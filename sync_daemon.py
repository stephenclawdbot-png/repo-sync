#!/usr/bin/env python3
"""
REPO-SYNC Daemon: Background File Watcher for Auto-Commit

Monitors tracked repositories for file changes and automatically
commits changes after a configurable idle period.

Usage:
    python sync_daemon.py start     # Start the daemon
    python sync_daemon.py stop      # Stop the daemon
    python sync_daemon.py status    # Check daemon status
    python sync_daemon.py run       # Run in foreground (for testing)
"""

import os
import sys
import json
import time
import signal
import logging
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Set, List, Optional
from dataclasses import dataclass, asdict
from threading import Lock, Thread

# Optional imports
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler, FileSystemEvent
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Warning: watchdog not installed. Install with: pip install watchdog")

try:
    from git import Repo
    GITPYTHON_AVAILABLE = True
except ImportError:
    GITPYTHON_AVAILABLE = False


# Configure logging
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "daemon.log"
PID_FILE = Path(__file__).parent / "daemon.pid"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class RepoWatcher:
    """Tracks state for a single watched repository."""
    path: Path
    last_change_time: Optional[datetime] = None
    is_dirty: bool = False
    auto_commit_enabled: bool = True
    idle_minutes: int = 5
    pending_commit: bool = False
    last_commit_time: Optional[datetime] = None
    excluded_patterns: List[str] = None
    included_patterns: List[str] = None
    
    def __post_init__(self):
        if self.excluded_patterns is None:
            self.excluded_patterns = ['*.log', '*.tmp', '.env*', 'secrets*', '*.key']
        if self.included_patterns is None:
            self.included_patterns = ['*.py', '*.js', '*.ts', '*.md', '*.json', '*.yaml', '*.yml', '*.toml', '*.txt', '*.rs', '*.go']
    
    def to_dict(self) -> dict:
        return {
            'path': str(self.path),
            'last_change_time': self.last_change_time.isoformat() if self.last_change_time else None,
            'is_dirty': self.is_dirty,
            'auto_commit_enabled': self.auto_commit_enabled,
            'idle_minutes': self.idle_minutes,
            'pending_commit': self.pending_commit,
            'last_commit_time': self.last_commit_time.isoformat() if self.last_commit_time else None,
            'excluded_patterns': self.excluded_patterns,
            'included_patterns': self.included_patterns
        }


if WATCHDOG_AVAILABLE:
    class RepoEventHandler(FileSystemEventHandler):
        """Handles file system events for a repository."""
        
        def __init__(self, repo_path: Path, watcher: RepoWatcher, on_change_callback):
            self.repo_path = repo_path
            self.watcher = watcher
            self.on_change = on_change_callback
            self._lock = Lock()
        
        def should_ignore(self, path: str) -> bool:
            """Check if a file path should be ignored."""
            filename = Path(path).name
            
            # Check excluded patterns
            for pattern in self.watcher.excluded_patterns:
                if pattern.startswith('*'):
                    if filename.endswith(pattern[1:]):
                        return True
                elif pattern in path:
                    return True
            
            # Check included patterns (if set)
            if self.watcher.included_patterns:
                included = False
                for pattern in self.watcher.included_patterns:
                    if pattern.startswith('*'):
                        if filename.endswith(pattern[1:]):
                            included = True
                            break
                    elif pattern in path:
                        included = True
                        break
                if not included:
                    return True
            
            # Ignore .git directory
            if '.git' in path:
                return True
            
            return False
        
        def on_any_event(self, event: FileSystemEvent):
            """Handle any file system event."""
            if event.is_directory:
                return
            
            path = str(event.src_path)
            
            if self.should_ignore(path):
                return
            
            with self._lock:
                self.watcher.last_change_time = datetime.now()
                self.watcher.is_dirty = True
                self.watcher.pending_commit = True
            
            logger.debug(f"Change detected in {self.watcher.path.name}: {path}")
            self.on_change(self.watcher)


class SyncDaemon:
    """Background daemon for auto-committing repository changes."""
    
    def __init__(self, config_path: str = "repos.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.watchers: Dict[Path, RepoWatcher] = {}
        self.observers: Dict[Path, Observer] = {}
        self._running = False
        self._check_thread: Optional[Thread] = None
        self.workspace_root = Path("/Users/clawdbot/.openclaw/workspace")
    
    def _load_config(self) -> dict:
        """Load configuration from JSON file."""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return json.load(f)
        return self._default_config()
    
    def _default_config(self) -> dict:
        return {
            "scan_paths": [str(self.workspace_root)],
            "exclude_patterns": ["node_modules", ".venv", "venv", "__pycache__", ".git", "REPO-SYNC"],
            "auto_commit": {
                "enabled": True,
                "idle_minutes": 5,
                "auto_push": False
            }
        }
    
    def _discover_repos(self) -> List[Path]:
        """Discover all git repositories."""
        repos = []
        scan_paths = self.config.get("scan_paths", [str(self.workspace_root)])
        exclude = set(self.config.get("exclude_patterns", []))
        
        for scan_path in map(Path, scan_paths):
            scan_path = scan_path.expanduser().resolve()
            if not scan_path.exists():
                continue
            
            for git_dir in scan_path.rglob(".git"):
                repo_path = git_dir.parent
                
                # Skip if excluded
                if any(pattern in str(repo_path) for pattern in exclude):
                    continue
                
                repos.append(repo_path)
        
        return sorted(set(repos))
    
    def _create_watcher(self, repo_path: Path) -> RepoWatcher:
        """Create a watcher configuration for a repository."""
        auto_config = self.config.get("auto_commit", {})
        
        return RepoWatcher(
            path=repo_path,
            auto_commit_enabled=auto_config.get("enabled", True),
            idle_minutes=auto_config.get("idle_minutes", 5),
            excluded_patterns=auto_config.get("exclude_patterns", ['*.log', '*.tmp', '.env*', 'secrets*', '*.key']),
            included_patterns=auto_config.get("include_patterns", ['*.py', '*.js', '*.ts', '*.md', '*.json', '*.yaml', '*.yml', '*.toml', '*.txt', '*.rs', '*.go'])
        )
    
    def _on_file_change(self, watcher: RepoWatcher):
        """Callback when a file change is detected."""
        logger.info(f"📁 Change in {watcher.path.name} - idle timer started ({watcher.idle_minutes}min)")
    
    def _start_watching_repo(self, repo_path: Path) -> bool:
        """Start watching a single repository."""
        if repo_path not in self.watchers:
            self.watchers[repo_path] = self._create_watcher(repo_path)
        
        watcher = self.watchers[repo_path]
        
        if not watcher.auto_commit_enabled:
            logger.info(f"    ⏭️  Auto-commit disabled for {repo_path.name}")
            return False
        
        if not WATCHDOG_AVAILABLE:
            logger.warning(f"    ⚠️  Watchdog not available - cannot watch {repo_path.name}")
            return False
        
        try:
            event_handler = RepoEventHandler(repo_path, watcher, self._on_file_change)
            observer = Observer()
            observer.schedule(event_handler, str(repo_path), recursive=True)
            observer.start()
            self.observers[repo_path] = observer
            logger.info(f"    ✅ Watching {repo_path.name}")
            return True
        except Exception as e:
            logger.error(f"    ❌ Failed to watch {repo_path.name}: {e}")
            return False
    
    def _check_and_commit(self):
        """Background thread that checks for idle repos and commits them."""
        logger.info("Idle checker thread started")
        
        while self._running:
            for repo_path, watcher in self.watchers.items():
                if not watcher.pending_commit or not watcher.is_dirty:
                    continue
                
                if not watcher.last_change_time:
                    continue
                
                idle_time = datetime.now() - watcher.last_change_time
                idle_minutes = timedelta(minutes=watcher.idle_minutes)
                
                if idle_time >= idle_minutes:
                    self._auto_commit(repo_path, watcher)
            
            time.sleep(10)  # Check every 10 seconds
    
    def _generate_commit_message(self, repo_path: Path) -> str:
        """Generate a commit message based on changes."""
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            changes = {
                'added': [],
                'modified': [],
                'deleted': []
            }
            
            for line in result.stdout.split('\n'):
                if len(line) >= 3:
                    index_status = line[0]
                    worktree_status = line[1]
                    filename = line[3:].strip()
                    
                    if worktree_status == '?' or index_status == '?':
                        changes['added'].append(filename)
                    elif 'D' in (index_status, worktree_status):
                        changes['deleted'].append(filename)
                    else:
                        changes['modified'].append(filename)
            
            # Generate message
            if changes['added'] and not changes['modified'] and not changes['deleted']:
                files = ", ".join([p.split('/')[-1][:20] for p in changes['added'][:3]])
                return f"feat: add {files}"
            elif changes['deleted'] and not changes['added'] and not changes['modified']:
                return f"chore: remove {len(changes['deleted'])} file(s)"
            elif len(changes['modified']) == 1 and not changes['added'] and not changes['deleted']:
                return f"fix: update {changes['modified'][0].split('/')[-1][:30]}"
            elif changes['modified'] and not changes['added'] and not changes['deleted']:
                files = ", ".join([p.split('/')[-1][:15] for p in changes['modified'][:2]])
                return f"chore: update {files}"
            else:
                counts = []
                if changes['added']:
                    counts.append(f"+{len(changes['added'])}")
                if changes['modified']:
                    counts.append(f"~{len(changes['modified'])}")
                if changes['deleted']:
                    counts.append(f"-{len(changes['deleted'])}")
                return f"chore: auto-sync ({'/'.join(counts)})" if counts else "chore: auto-sync"
                
        except Exception as e:
            logger.warning(f"Failed to generate commit message: {e}")
            return f"chore: auto-sync on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    def _auto_commit(self, repo_path: Path, watcher: RepoWatcher) -> bool:
        """Perform auto-commit for a repository."""
        logger.info(f"📝 Auto-committing changes in {repo_path.name}...")
        
        try:
            # Stage all changes
            result = subprocess.run(
                ["git", "add", "-A"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"    Failed to stage: {result.stderr}")
                return False
            
            # Generate commit message
            commit_msg = self._generate_commit_message(repo_path)
            
            # Commit
            result = subprocess.run(
                ["git", "commit", "-m", commit_msg],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                watcher.last_commit_time = datetime.now()
                watcher.pending_commit = False
                watcher.is_dirty = False
                logger.info(f"    ✅ Committed: {commit_msg}")
                
                # Optionally push
                auto_config = self.config.get("auto_commit", {})
                if auto_config.get("auto_push", False):
                    self._auto_push(repo_path)
                
                return True
            else:
                # Check if nothing to commit
                if "nothing to commit" in result.stdout.lower() or "nothing to commit" in result.stderr.lower():
                    watcher.pending_commit = False
                    watcher.is_dirty = False
                    logger.info(f"    ℹ️  No changes to commit")
                    return True
                
                logger.error(f"    Failed to commit: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"    Error during auto-commit: {e}")
            return False
    
    def _auto_push(self, repo_path: Path) -> bool:
        """Auto-push commits to remote."""
        try:
            # Get current branch
            result = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                return False
            
            branch = result.stdout.strip()
            
            # Push
            result = subprocess.run(
                ["git", "push", "origin", branch],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info(f"    ✅ Pushed to origin/{branch}")
                return True
            else:
                logger.warning(f"    ⚠️  Push failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.warning(f"    ⚠️  Push error: {e}")
            return False
    
    def start(self):
        """Start the daemon."""
        if self.is_running():
            logger.info("Daemon is already running")
            return False
        
        # Daemonize
        try:
            pid = os.fork()
            if pid > 0:
                # Parent process
                logger.info(f"Daemon started (PID: {pid})")
                return True
        except OSError as e:
            logger.error(f"Fork failed: {e}")
            return False
        
        # Child process
        os.chdir('/')
        os.setsid()
        os.umask(0)
        
        # Second fork
        try:
            pid = os.fork()
            if pid > 0:
                os._exit(0)
        except OSError:
            os._exit(1)
        
        # Redirect stdin/stdout/stderr
        sys.stdout.flush()
        sys.stderr.flush()
        si = open('/dev/null', 'r')
        so = open('/dev/null', 'a+')
        se = open('/dev/null', 'a+')
        os.dup2(si.fileno(), sys.stdin.fileno())
        os.dup2(so.fileno(), sys.stdout.fileno())
        os.dup2(se.fileno(), sys.stderr.fileno())
        
        # Write PID file
        with open(PID_FILE, 'w') as f:
            f.write(str(os.getpid()))
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        # Start the daemon
        self._run()
        
        return True
    
    def run_foreground(self):
        """Run the daemon in foreground mode (for testing)."""
        logger.info("="*60)
        logger.info("REPO-SYNC Daemon - Foreground Mode")
        logger.info("="*60)
        logger.info(f"Log file: {LOG_FILE}")
        logger.info("Press Ctrl+C to stop\n")
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        self._run()
    
    def _run(self):
        """Main daemon loop."""
        self._running = True
        
        logger.info("Daemon starting...")
        
        # Discover and watch repos
        logger.info("Discovering repositories...")
        repos = self._discover_repos()
        logger.info(f"Found {len(repos)} repositories\n")
        
        watching = 0
        for repo_path in repos:
            if self._start_watching_repo(repo_path):
                watching += 1
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Watching {watching}/{len(repos)} repositories")
        logger.info(f"Idle threshold: {self.config.get('auto_commit', {}).get('idle_minutes', 5)} minutes")
        logger.info(f"{'='*60}\n")
        
        # Start idle checker thread
        self._check_thread = Thread(target=self._check_and_commit, daemon=True)
        self._check_thread.start()
        
        # Keep running
        while self._running:
            time.sleep(1)
        
        self._cleanup()
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, shutting down...")
        self._running = False
    
    def _cleanup(self):
        """Clean up resources on shutdown."""
        logger.info("Stopping watchers...")
        for observer in self.observers.values():
            observer.stop()
            observer.join()
        
        if PID_FILE.exists():
            PID_FILE.unlink()
        
        logger.info("Daemon stopped")
    
    def stop(self) -> bool:
        """Stop the daemon."""
        if not PID_FILE.exists():
            logger.info("Daemon is not running")
            return False
        
        try:
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            
            os.kill(pid, signal.SIGTERM)
            
            # Wait for shutdown
            for _ in range(10):
                if not PID_FILE.exists():
                    break
                time.sleep(0.5)
            
            logger.info("Daemon stopped")
            return True
            
        except ProcessLookupError:
            logger.warning("Process not found, cleaning up PID file")
            PID_FILE.unlink(missing_ok=True)
            return True
        except Exception as e:
            logger.error(f"Failed to stop daemon: {e}")
            return False
    
    def is_running(self) -> bool:
        """Check if daemon is running."""
        if not PID_FILE.exists():
            return False
        
        try:
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process exists
            os.kill(pid, 0)
            return True
        except (ValueError, ProcessLookupError, FileNotFoundError):
            PID_FILE.unlink(missing_ok=True)
            return False
    
    def status(self):
        """Show daemon status."""
        running = self.is_running()
        
        status_text = "RUNNING" if running else "STOPPED"
        status_color = "✅" if running else "❌"
        
        print(f"\n{'='*60}")
        print(f"REPO-SYNC Daemon Status")
        print(f"{'='*60}")
        print(f"Status: {status_color} {status_text}")
        
        if running:
            with open(PID_FILE, 'r') as f:
                pid = f.read().strip()
            print(f"PID: {pid}")
        
        print(f"Log file: {LOG_FILE}")
        print(f"Config file: {self.config_path}")
        
        # Show recent log entries
        if LOG_FILE.exists():
            print(f"\n{'─'*60}")
            print("Recent log entries:")
            print(f"{'─'*60}")
            
            try:
                result = subprocess.run(
                    ["tail", "-20", str(LOG_FILE)],
                    capture_output=True,
                    text=True
                )
                print(result.stdout)
            except Exception as e:
                print(f"Could not read log: {e}")
        
        print(f"{'='*60}\n")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="REPO-SYNC Daemon: Background auto-commit watcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python sync_daemon.py start       # Start daemon (background)
    python sync_daemon.py run         # Run in foreground (for testing)
    python sync_daemon.py stop        # Stop daemon
    python sync_daemon.py status      # Check status
        """
    )
    
    parser.add_argument(
        "command",
        choices=["start", "stop", "status", "run"],
        help="Command to execute"
    )
    
    args = parser.parse_args()
    
    daemon = SyncDaemon()
    
    if args.command == "start":
        daemon.start()
    elif args.command == "stop":
        daemon.stop()
    elif args.command == "status":
        daemon.status()
    elif args.command == "run":
        daemon.run_foreground()


if __name__ == "__main__":
    main()
