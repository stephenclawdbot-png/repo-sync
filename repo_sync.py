#!/usr/bin/env python3
"""
REPO-SYNC: Automated Workspace Git Repository Orchestration System

A CLI tool for managing multiple git repositories across the workspace.
Provides unified status, batch operations, auto-commit messages, and dashboard.
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import http.server
import socketserver
import webbrowser

# Optional imports - graceful degradation if not installed
try:
    from git import Repo, InvalidGitRepositoryError
    GITPYTHON_AVAILABLE = True
except ImportError:
    GITPYTHON_AVAILABLE = False

try:
    from colorama import init, Fore, Style
    init()
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False
    class MockStyle:
        def __getattr__(self, name):
            return ''
    Fore = MockStyle()
    Style = MockStyle()


@dataclass
class RepoStatus:
    """Represents the current status of a git repository."""
    name: str
    path: str
    branch: str
    is_dirty: bool
    uncommitted_files: int
    unpushed_commits: int
    last_commit_time: Optional[str]
    last_commit_message: Optional[str]
    remote_url: Optional[str]
    ahead_behind: Tuple[int, int]  # (ahead, behind)
    is_synced: bool
    errors: List[str]

    def to_dict(self) -> dict:
        return asdict(self)


class RepoSync:
    """Main orchestrator for repository synchronization."""
    
    def __init__(self, config_path: str = "repos.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.repo_statuses: List[RepoStatus] = []
        self.workspace_root = Path("/Users/clawdbot/.openclaw/workspace")
        
    def _load_config(self) -> dict:
        """Load configuration from JSON file."""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return self._default_config()
    
    def _default_config(self) -> dict:
        """Return default configuration."""
        return {
            "scan_paths": [str(self.workspace_root)],
            "exclude_patterns": ["node_modules", ".venv", "__pycache__", ".git", "REPO-SYNC"],
            "repos": {},
            "auto_commit": {"enabled": False, "idle_minutes": 5},
            "commit_message_style": "conventional"
        }
    
    def _is_excluded(self, path: Path) -> bool:
        """Check if a path should be excluded from scanning."""
        exclude_patterns = self.config.get("exclude_patterns", [])
        path_str = str(path)
        for pattern in exclude_patterns:
            if pattern in path_str or path.name == pattern:
                return True
        return False
    
    def discover_repos(self) -> List[Path]:
        """Recursively discover all git repositories in scan paths."""
        repos = []
        scan_paths = self.config.get("scan_paths", [str(self.workspace_root)])
        
        for scan_path in scan_paths:
            scan_path = Path(scan_path).expanduser().resolve()
            if not scan_path.exists():
                continue
                
            # Check if root is a git repo
            if (scan_path / ".git").exists():
                repos.append(scan_path)
            
            # Recursively find .git directories
            for git_dir in scan_path.rglob(".git"):
                if self._is_excluded(git_dir.parent):
                    continue
                # Check if it's actually a git repo (not a submodule)
                try:
                    repo_path = git_dir.parent
                    if repo_path not in repos:
                        repos.append(repo_path)
                except Exception:
                    pass
        
        # Also include explicitly configured repos
        configured = self.config.get("repos", {})
        for repo_path in configured.keys():
            path = Path(repo_path).expanduser().resolve()
            if path.exists() and path not in repos:
                repos.append(path)
        
        return sorted(set(repos))
    
    def _get_repo_status(self, repo_path: Path) -> RepoStatus:
        """Get detailed status of a single repository."""
        name = repo_path.name
        path_str = str(repo_path)
        errors = []
        
        try:
            if GITPYTHON_AVAILABLE:
                repo = Repo(repo_path)
            else:
                # Fallback to git CLI
                return self._get_status_via_cli(repo_path)
            
            # Get branch info
            try:
                branch = repo.active_branch.name
            except Exception:
                branch = "DETACHED"
            
            # Check for uncommitted changes
            is_dirty = repo.is_dirty(untracked_files=True)
            uncommitted = len(repo.index.diff(None)) + len(repo.untracked_files)
            
            # Get last commit info
            try:
                last_commit = repo.head.commit
                last_commit_time = datetime.fromtimestamp(last_commit.committed_date).isoformat()
                last_commit_message = last_commit.message.strip().split('\n')[0][:80]
            except Exception:
                last_commit_time = None
                last_commit_message = None
            
            # Check remote status
            ahead = behind = 0
            remote_url = None
            try:
                if repo.remotes:
                    remote = repo.remotes.origin
                    remote_url = remote.url
                    # Fetch to ensure we have latest
                    # repo.remotes.origin.fetch()
                    
                    # Compare with remote
                    local_commit = repo.head.commit
                    try:
                        remote_ref = repo.remotes.origin.refs[repo.active_branch.name]
                        ahead = sum(1 for _ in repo.iter_commits(f'{remote_ref.commit.hexsha}..{local_commit.hexsha}'))
                        behind = sum(1 for _ in repo.iter_commits(f'{local_commit.hexsha}..{remote_ref.commit.hexsha}'))
                    except Exception:
                        pass
            except Exception:
                pass
            
            is_synced = not is_dirty and ahead == 0 and behind == 0
            
            return RepoStatus(
                name=name,
                path=path_str,
                branch=branch,
                is_dirty=is_dirty,
                uncommitted_files=uncommitted,
                unpushed_commits=ahead,
                last_commit_time=last_commit_time,
                last_commit_message=last_commit_message,
                remote_url=remote_url,
                ahead_behind=(ahead, behind),
                is_synced=is_synced,
                errors=errors
            )
            
        except Exception as e:
            return RepoStatus(
                name=name,
                path=path_str,
                branch="ERROR",
                is_dirty=False,
                uncommitted_files=0,
                unpushed_commits=0,
                last_commit_time=None,
                last_commit_message=None,
                remote_url=None,
                ahead_behind=(0, 0),
                is_synced=False,
                errors=[str(e)]
            )
    
    def _get_status_via_cli(self, repo_path: Path) -> RepoStatus:
        """Get repository status using git CLI (fallback)."""
        name = repo_path.name
        errors = []
        
        def run_git(args: List[str]) -> Tuple[int, str, str]:
            try:
                result = subprocess.run(
                    ["git"] + args,
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                return result.returncode, result.stdout, result.stderr
            except Exception as e:
                return 1, "", str(e)
        
        # Get branch
        rc, branch, _ = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
        branch = branch.strip() if rc == 0 else "UNKNOWN"
        
        # Check dirty status
        rc, _, _ = run_git(["diff", "--quiet"])
        is_dirty = rc != 0
        rc2, _, _ = run_git(["diff", "--cached", "--quiet"])
        is_staged = rc2 != 0
        is_dirty = is_dirty or is_staged
        
        # Count uncommitted files
        rc, status_out, _ = run_git(["status", "--porcelain"])
        uncommitted = len([l for l in status_out.split('\n') if l.strip()])
        
        # Get last commit
        rc, commit_info, _ = run_git(["log", "-1", "--format=%H|%ci|%s"])
        last_time = None
        last_msg = None
        if rc == 0 and '|' in commit_info:
            parts = commit_info.strip().split('|')
            if len(parts) >= 3:
                last_time = parts[1]
                last_msg = parts[2][:80]
        
        # Get remote info
        rc, remote_url, _ = run_git(["remote", "get-url", "origin"])
        remote_url = remote_url.strip() if rc == 0 else None
        
        # Check ahead/behind
        ahead = behind = 0
        rc, ab, _ = run_git(["rev-list", "--left-right", "--count", f"HEAD...origin/{branch}"])
        if rc == 0:
            try:
                parts = ab.strip().split()
                if len(parts) == 2:
                    ahead, behind = int(parts[0]), int(parts[1])
            except ValueError:
                pass
        
        is_synced = not is_dirty and ahead == 0 and behind == 0 and remote_url is not None
        
        return RepoStatus(
            name=name,
            path=str(repo_path),
            branch=branch,
            is_dirty=is_dirty,
            uncommitted_files=uncommitted,
            unpushed_commits=ahead,
            last_commit_time=last_time,
            last_commit_message=last_msg,
            remote_url=remote_url,
            ahead_behind=(ahead, behind),
            is_synced=is_synced,
            errors=errors
        )
    
    def scan(self) -> List[RepoStatus]:
        """Scan all repositories and return their statuses."""
        print(f"{Fore.CYAN}🔍 Scanning for git repositories...{Style.RESET_ALL}")
        repo_paths = self.discover_repos()
        print(f"{Fore.GREEN}Found {len(repo_paths)} repositories{Style.RESET_ALL}\n")
        
        self.repo_statuses = [self._get_repo_status(p) for p in repo_paths]
        return self.repo_statuses
    
    def print_status(self):
        """Display formatted status of all repositories."""
        if not self.repo_statuses:
            self.scan()
        
        print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'REPOSITORY STATUS':^80}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")
        
        dirty_count = 0
        unsynced_count = 0
        
        for status in sorted(self.repo_statuses, key=lambda x: x.name.lower()):
            # Color coding
            if status.errors:
                color = Fore.RED
                icon = "❌"
            elif not status.is_synced:
                color = Fore.YELLOW
                icon = "⚠️"
            else:
                color = Fore.GREEN
                icon = "✅"
            
            if status.is_dirty:
                dirty_count += 1
            if not status.is_synced:
                unsynced_count += 1
            
            # Print status line
            print(f"{icon} {color}{status.name}{Style.RESET_ALL}")
            print(f"   Path: {status.path}")
            print(f"   Branch: {Fore.MAGENTA}{status.branch}{Style.RESET_ALL}")
            
            if status.is_dirty:
                print(f"   {Fore.YELLOW}⚡ {status.uncommitted_files} uncommitted files{Style.RESET_ALL}")
            
            if status.unpushed_commits > 0:
                print(f"   {Fore.YELLOW}⬆️  {status.unpushed_commits} unpushed commits{Style.RESET_ALL}")
            
            if status.ahead_behind[1] > 0:
                print(f"   {Fore.RED}⬇️  {status.ahead_behind[1]} commits behind remote{Style.RESET_ALL}")
            
            if status.last_commit_time:
                commit_time = status.last_commit_time[:19] if len(status.last_commit_time) > 19 else status.last_commit_time
                print(f"   Last commit: {commit_time}")
                if status.last_commit_message:
                    print(f"   Message: {status.last_commit_message[:60]}")
            
            if status.errors:
                for error in status.errors:
                    print(f"   {Fore.RED}Error: {error}{Style.RESET_ALL}")
            
            print()
        
        # Summary
        print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
        print(f"Summary: {len(self.repo_statuses)} repos | {dirty_count} dirty | {unsynced_count} unsynced")
        print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")
    
    def _generate_commit_message(self, repo_path: Path) -> str:
        """Generate a meaningful commit message based on changes."""
        def run_git(args: List[str]) -> str:
            try:
                result = subprocess.run(
                    ["git"] + args,
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                return result.stdout
            except Exception:
                return ""
        
        # Get diff stats
        diff_stat = run_git(["diff", "--stat"])
        staged_stat = run_git(["diff", "--cached", "--stat"])
        status_output = run_git(["status", "--porcelain"])
        
        # Count changes by type
        added = []
        modified = []
        deleted = []
        staged = []
        
        for line in status_output.split('\n'):
            if len(line) >= 2:
                index_status = line[0]
                worktree_status = line[1]
                filename = line[3:].strip()
                
                if index_status in 'AMR' or worktree_status in 'AMR':
                    if index_status != ' ':
                        staged.append(filename)
                    if 'D' in (index_status, worktree_status):
                        deleted.append(filename)
                    elif worktree_status == '?' or index_status == '?':
                        added.append(filename)
                    else:
                        modified.append(filename)
        
        # Generate message
        style = self.config.get("commit_message_style", "conventional")
        
        if added and not modified and not deleted:
            files = ", ".join([p.split('/')[-1][:20] for p in added[:3]])
            return f"feat: add {files}{' and more' if len(added) > 3 else ''}"
        elif deleted and not added and not modified:
            return f"chore: remove {len(deleted)} file(s)"
        elif len(modified) == 1 and not added and not deleted:
            return f"fix: update {modified[0].split('/')[-1][:30]}"
        elif modified and not added and not deleted:
            files = ", ".join([p.split('/')[-1][:15] for p in modified[:2]])
            return f"chore: update {files}{' and more' if len(modified) > 2 else ''}"
        else:
            counts = []
            if added:
                counts.append(f"+{len(added)}")
            if modified:
                counts.append(f"~{len(modified)}")
            if deleted:
                counts.append(f"-{len(deleted)}")
            return f"chore: sync changes ({'/'.join(counts)})"
    
    def commit_all(self, dry_run: bool = False, message: Optional[str] = None) -> Dict[str, bool]:
        """Commit all changes in dirty repositories."""
        if not self.repo_statuses:
            self.scan()
        
        results = {}
        
        print(f"\n{Fore.CYAN}📝 Committing changes in all dirty repositories...{Style.RESET_ALL}\n")
        
        for status in self.repo_statuses:
            if not status.is_dirty:
                continue
            
            repo_path = Path(status.path)
            
            print(f"Processing: {Fore.MAGENTA}{status.name}{Style.RESET_ALL}")
            
            if dry_run:
                print(f"  [DRY RUN] Would commit {status.uncommitted_files} files")
                results[status.name] = True
                continue
            
            try:
                # Stage all changes
                subprocess.run(
                    ["git", "add", "-A"],
                    cwd=repo_path,
                    check=True,
                    capture_output=True
                )
                
                # Generate or use provided message
                commit_msg = message or self._generate_commit_message(repo_path)
                
                # Commit
                result = subprocess.run(
                    ["git", "commit", "-m", commit_msg],
                    cwd=repo_path,
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    print(f"  {Fore.GREEN}✅ Committed: {commit_msg}{Style.RESET_ALL}")
                    results[status.name] = True
                else:
                    print(f"  {Fore.RED}❌ Failed: {result.stderr}{Style.RESET_ALL}")
                    results[status.name] = False
                    
            except subprocess.CalledProcessError as e:
                print(f"  {Fore.RED}❌ Error: {e}{Style.RESET_ALL}")
                results[status.name] = False
        
        success = sum(1 for v in results.values() if v)
        print(f"\n{Fore.CYAN}Committed {success}/{len(results)} repositories{Style.RESET_ALL}\n")
        return results
    
    def push_all(self, dry_run: bool = False) -> Dict[str, bool]:
        """Push all repositories with unpushed commits."""
        if not self.repo_statuses:
            self.scan()
        
        results = {}
        
        print(f"\n{Fore.CYAN}🚀 Pushing changes to remote...{Style.RESET_ALL}\n")
        
        for status in self.repo_statuses:
            if status.unpushed_commits == 0:
                continue
            
            repo_path = Path(status.path)
            
            print(f"Pushing: {Fore.MAGENTA}{status.name}{Style.RESET_ALL} ({status.unpushed_commits} commits)")
            
            if dry_run:
                print(f"  [DRY RUN] Would push {status.unpushed_commits} commits")
                results[status.name] = True
                continue
            
            try:
                result = subprocess.run(
                    ["git", "push", "origin", status.branch],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0:
                    print(f"  {Fore.GREEN}✅ Pushed successfully{Style.RESET_ALL}")
                    results[status.name] = True
                else:
                    print(f"  {Fore.RED}❌ Failed: {result.stderr}{Style.RESET_ALL}")
                    results[status.name] = False
                    
            except Exception as e:
                print(f"  {Fore.RED}❌ Error: {e}{Style.RESET_ALL}")
                results[status.name] = False
        
        success = sum(1 for v in results.values() if v)
        print(f"\n{Fore.CYAN}Pushed {success}/{len(results)} repositories{Style.RESET_ALL}\n")
        return results
    
    def generate_dashboard(self, output_path: Optional[str] = None) -> str:
        """Generate HTML dashboard with repository status."""
        if not self.repo_statuses:
            self.scan()
        
        if output_path is None:
            output_path = Path(__file__).parent / "dashboard.html"
        else:
            output_path = Path(output_path)
        
        dashboard_config = self.config.get("dashboard", {})
        title = dashboard_config.get("title", "REPO-SYNC Dashboard")
        refresh = dashboard_config.get("refresh_interval_seconds", 30)
        theme = dashboard_config.get("theme", "dark")
        
        # Generate table rows
        rows = []
        for status in sorted(self.repo_statuses, key=lambda x: x.name.lower()):
            if status.is_synced:
                status_class = "status-synced"
                status_text = "✅ Synced"
            elif status.is_dirty:
                status_class = "status-dirty"
                status_text = f"📝 Dirty ({status.uncommitted_files} files)"
            else:
                status_class = "status-unsynced"
                status_text = f"⚠️ Needs push ({status.unpushed_commits} commits)"
            
            if status.errors:
                status_class = "status-error"
                status_text = f"❌ Error"
            
            last_time = status.last_commit_time or "N/A"
            if last_time != "N/A" and len(last_time) > 19:
                last_time = last_time[:19]
            
            row = f"""
                <tr class="{status_class}">
                    <td>{status.name}</td>
                    <td><span class="branch-tag">{status.branch}</span></td>
                    <td><span class="status-badge {status_class}">{status_text}</span></td>
                    <td>{last_time}</td>
                    <td>{status.uncommitted_files}</td>
                    <td>{status.unpushed_commits}</td>
                    <td><span class="action-btn" onclick="openRepo('{status.path}')">Open</span></td>
                </tr>
            """
            rows.append(row)
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        :root {{
            --bg-primary: {'#1a1a1a' if theme == 'dark' else '#f5f5f5'};
            --bg-secondary: {'#2d2d2d' if theme == 'dark' else '#ffffff'};
            --text-primary: {'#e0e0e0' if theme == 'dark' else '#333333'};
            --text-secondary: {'#a0a0a0' if theme == 'dark' else '#666666'};
            --border-color: {'#3d3d3d' if theme == 'dark' else '#e0e0e0'};
            --status-synced: #4caf50;
            --status-dirty: #ff9800;
            --status-unsynced: #2196f3;
            --status-error: #f44336;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        header {{
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--bg-secondary);
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }}
        
        h1 {{
            font-size: 2rem;
            margin-bottom: 10px;
        }}
        
        .timestamp {{
            color: var(--text-secondary);
            font-size: 0.9rem;
        }}
        
        .stats {{
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            flex-wrap: wrap;
        }}
        
        .stat {{
            text-align: center;
        }}
        
        .stat-value {{
            font-size: 2.5rem;
            font-weight: bold;
        }}
        
        .stat-label {{
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-secondary);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border-color);
        }}
        
        th, td {{
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }}
        
        th {{
            background: rgba(0,0,0,0.2);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }}
        
        tr:hover {{
            background: rgba(255,255,255,0.05);
        }}
        
        .status-badge {{
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }}
        
        .status-synced {{ color: var(--status-synced); background: rgba(76, 175, 80, 0.2); }}
        .status-dirty {{ color: var(--status-dirty); background: rgba(255, 152, 0, 0.2); }}
        .status-unsynced {{ color: var(--status-unsynced); background: rgba(33, 150, 243, 0.2); }}
        .status-error {{ color: var(--status-error); background: rgba(244, 67, 54, 0.2); }}
        
        .branch-tag {{
            background: rgba(255,255,255,0.1);
            padding: 4px 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9rem;
        }}
        
        .action-btn {{
            background: #3d5afe;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: opacity 0.2s;
        }}
        
        .action-btn:hover {{
            opacity: 0.8;
        }}
        
        .actions {{
            margin: 20px 0;
            text-align: center;
        }}
        
        .refresh-btn {{
            background: #4caf50;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            margin-right: 10px;
        }}
        
        .refresh-btn:hover {{
            background: #45a049;
        }}
        
        @media (max-width: 768px) {{
            table {{ font-size: 0.85rem; }}
            th, td {{ padding: 10px; }}
            h1 {{ font-size: 1.5rem; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔧 {title}</h1>
            <div class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">{len(self.repo_statuses)}</div>
                    <div class="stat-label">Repositories</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: var(--status-synced)">{sum(1 for r in self.repo_statuses if r.is_synced)}</div>
                    <div class="stat-label">Synced</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: var(--status-dirty)">{sum(1 for r in self.repo_statuses if r.is_dirty)}</div>
                    <div class="stat-label">Dirty</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: var(--status-unsynced)">{sum(1 for r in self.repo_statuses if not r.is_synced and not r.is_dirty)}</div>
                    <div class="stat-label">Needs Push</div>
                </div>
            </div>
        </header>
        
        <div class="actions">
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Dashboard</button>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Repository</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Last Commit</th>
                    <th>Uncommitted</th>
                    <th>Unpushed</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {''.join(rows) if rows else '<tr><td colspan="7" style="text-align:center; padding: 40px;">No repositories found</td></tr>'}
            </tbody>
        </table>
    </div>
    <script>
        function openRepo(path) {{
            // For local repos, we can't actually open them
            // This is a placeholder for potential future functionality
            console.log('Open repo:', path);
            navigator.clipboard.writeText(path).then(() => alert('Path copied: ' + path));
        }}
        
        // Auto-refresh
        setTimeout(() => location.reload(), {refresh * 1000});
    </script>
</body>
</html>"""
        
        with open(output_path, 'w') as f:
            f.write(html)
        
        return str(output_path)
    
    def serve_dashboard(self, port: int = 8080):
        """Start a simple HTTP server to serve the dashboard."""
        dashboard_path = self.generate_dashboard()
        dashboard_dir = Path(dashboard_path).parent
        
        class DashboardHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(dashboard_dir), **kwargs)
            
            def log_message(self, format, *args):
                # Suppress default logging
                pass
        
        with socketserver.TCPServer(("", port), DashboardHandler) as httpd:
            url = f"http://localhost:{port}/dashboard.html"
            print(f"\n{Fore.GREEN}🌐 Dashboard server running at {url}{Style.RESET_ALL}")
            print(f"{Fore.CYAN}Press Ctrl+C to stop{Style.RESET_ALL}\n")
            
            webbrowser.open(url)
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print(f"\n{Fore.YELLOW}Server stopped{Style.RESET_ALL}")
                httpd.shutdown()


def main():
    parser = argparse.ArgumentParser(
        description="REPO-SYNC: Workspace Git Repository Orchestration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python repo_sync.py status              # Show status of all repos
  python repo_sync.py commit-all          # Commit all changes
  python repo_sync.py push-all            # Push all commits
  python repo_sync.py commit-push         # Commit and push all
  python repo_sync.py dashboard           # Generate and serve dashboard
  python repo_sync.py sync                # Full sync (commit + push)
        """
    )
    
    parser.add_argument(
        "command",
        choices=["status", "commit-all", "push-all", "commit-push", "sync", "dashboard", "discover"],
        help="Command to execute"
    )
    parser.add_argument("-m", "--message", help="Custom commit message (for commit commands)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without executing")
    parser.add_argument("-p", "--port", type=int, default=8080, help="Dashboard port (default: 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Don't open browser for dashboard")
    
    args = parser.parse_args()
    
    # Create orchestrator
    sync = RepoSync()
    
    if args.command == "status":
        sync.print_status()
    
    elif args.command == "discover":
        repos = sync.discover_repos()
        print(f"\n{Fore.CYAN}Discovered {len(repos)} repositories:{Style.RESET_ALL}\n")
        for repo in repos:
            print(f"  📁 {repo}")
        print()
    
    elif args.command in ["commit-all", "sync", "commit-push"]:
        results = sync.commit_all(dry_run=args.dry_run, message=args.message)
        failed = [k for k, v in results.items() if not v]
        if failed:
            print(f"{Fore.RED}Failed: {', '.join(failed)}{Style.RESET_ALL}")
            sys.exit(1)
    
    if args.command in ["push-all", "sync", "commit-push"]:
        results = sync.push_all(dry_run=args.dry_run)
        failed = [k for k, v in results.items() if not v]
        if failed:
            print(f"{Fore.RED}Failed: {', '.join(failed)}{Style.RESET_ALL}")
            sys.exit(1)
    
    elif args.command == "dashboard":
        dashboard_path = sync.generate_dashboard()
        print(f"\n{Fore.GREEN}📊 Dashboard generated: {dashboard_path}{Style.RESET_ALL}")
        if not args.no_browser:
            sync.serve_dashboard(port=args.port)


if __name__ == "__main__":
    main()
