# REPO-SYNC 🔄

**Automated Workspace Git Repository Orchestration System**

REPO-SYNC solves the problem of managing multiple scattered git repositories in your workspace. No more manually checking each repo's status, figuring out commit messages, or forgetting to push changes.

## Features

- 🔍 **Auto-Discovery**: Finds all git repositories recursively
- 📊 **Unified Status**: See all repos at a glance
- 🤖 **Smart Commit Messages**: Auto-generates from diff summaries
- 🚀 **Batch Operations**: Commit and push across all repos
- 📈 **Visual Dashboard**: Web-based status visualization
- 👁️ **Optional Daemon**: Auto-commit after idle time
- 🎨 **Color-Coded Output**: No more guessing what's dirty

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Show status of all repos
python repo_sync.py status

# Commit all changes across repos
python repo_sync.py commit-all

# Push all repos
python repo_sync.py push-all

# Do both (commit + push)  
python repo_sync.py sync

# Generate and serve dashboard
python repo_sync.py dashboard
```

## Installation

1. **Clone or navigate to the REPO-SYNC directory:**
   ```bash
   cd /Users/clawdbot/.openclaw/workspace/REPO-SYNC
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify it works:**
   ```bash
   python repo_sync.py status
   ```

## Usage

### CLI Commands

```bash
# Display status of all repositories
python repo_sync.py status

# Commit all changes (auto-generates messages)
python repo_sync.py commit-all

# Commit with custom message
python repo_sync.py commit-all -m "feat: my custom message"

# Push all repositories
python repo_sync.py push-all

# Commit AND push in one command
python repo_sync.py sync

# Generate dashboard HTML
python repo_sync.py dashboard

# Serve dashboard on custom port (default: 8080)
python repo_sync.py dashboard -p 8081

# Don't auto-open browser
python repo_sync.py dashboard --no-browser

# Dry run (show what would be done)
python repo_sync.py commit-all --dry-run

# List all discovered repositories
python repo_sync.py discover
```

### Auto-Commit Daemon

The daemon watches all repositories and auto-commits changes after an idle period (default: 5 minutes).

```bash
# Start the daemon (background)
python sync_daemon.py start

# Run daemon in foreground (for testing)
python sync_daemon.py run

# Check daemon status
python sync_daemon.py status

# Stop the daemon
python sync_daemon.py stop
```

## Configuration

Edit `repos.json` to customize behavior:

```json
{
  "scan_paths": [
    "/Users/clawdbot/.openclaw/workspace"
  ],
  "exclude_patterns": [
    "node_modules",
    ".venv",
    "__pycache__",
    ".git",
    "REPO-SYNC"
  ],
  "auto_commit": {
    "enabled": false,
    "idle_minutes": 5,
    "auto_push": false,
    "include_patterns": [
      "*.py",
      "*.js",
      "*.md",
      "*.json"
    ],
    "exclude_patterns": [
      "*.log",
      "*.tmp",
      ".env*"
    ]
  },
  "commit_message_style": "conventional",
  "dashboard": {
    "title": "REPO-SYNC Dashboard",
    "refresh_interval_seconds": 30,
    "theme": "dark"
  }
}
```

### Commit Message Styles

REPO-SYNC supports multiple commit message styles:

- **conventional**: `feat: add file`, `fix: update config`, `chore: remove file`
- **simple**: `Update file`, `Add file`, `Remove file`

## Dashboard

The dashboard provides a visual overview of all repositories:

- ✅ Synced (green)
- 📝 Dirty/Uncommitted (orange)  
- ⚠️ Needs push (blue)
- ❌ Error (red)

**Columns:**
- Repository name
- Current branch
- Sync status
- Last commit time
- Uncommitted file count
- Unpushed commit count
- Quick action (copy path)

The dashboard auto-refreshes every 30 seconds.

## Auto-Commit Logic

The daemon uses smart file watching:

1. **Detection**: Monitors all configured file types
2. **Ignored files**: Excludes logs, temps, secrets, cached files
3. **Idle timer**: Waits 5 minutes (configurable) after last change
4. **Smart messages**: Generates from actual changes
5. **Safety**: Only commits if there are actual changes
6. **Logging**: All activity logged to `logs/daemon.log`

### Commit Message Generation

Messages are automatically generated based on changes:

| Change Pattern | Generated Message |
|----------------|-------------------|
| Only new files | `feat: add file1, file2` |
| Only deleted | `chore: remove N file(s)` |
| Single modification | `fix: update filename` |
| Multiple modifications | `chore: update file1, file2` |
| Mixed changes | `chore: sync changes (+N/~N/-N)` |

## Project Structure

```
REPO-SYNC/
├── repo_sync.py          # Main CLI tool
├── sync_daemon.py        # Background auto-commit daemon
├── dashboard.html        # Generated dashboard (auto-created)
├── repos.json            # Configuration
├── requirements.txt      # Python dependencies
├── README.md             # This file
└── logs/                 # Daemon logs
    └── daemon.log
```

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### Permission denied
```bash
chmod +x repo_sync.py sync_daemon.py
```

### Daemon won't start
- Check if another instance is running: `python sync_daemon.py status`
- Kill stale process and retry

### Dashboard doesn't show
- Run `python repo_sync.py dashboard` to regenerate
- Check browser console for JavaScript errors
- Verify HTML file exists and isn't corrupted

### Auto-commit not working
- Check `repos.json` - `auto_commit.enabled` must be `true`
- Verify daemon is running: `python sync_daemon.py status`
- Check logs: `tail -f logs/daemon.log`
- Files might be in exclude list

## Integration

### Add to `~/.bashrc` or `~/.zshrc`:

```bash
# REPO-SYNC aliases
alias rstatus='python ~/workspace/REPO-SYNC/repo_sync.py status'
alias rcommit='python ~/workspace/REPO-SYNC/repo_sync.py commit-all'
alias rpush='python ~/workspace/REPO-SYNC/repo_sync.py push-all'
alias rsync='python ~/workspace/REPO-SYNC/repo_sync.py sync'
alias rdash='python ~/workspace/REPO-SYNC/repo_sync.py dashboard'
```

### Cron job for periodic sync:

```bash
# Run status check every hour
0 * * * * cd ~/workspace/REPO-SYNC && python repo_sync.py status >> ~/repo-status.log 2>&1
```

## Requirements

- Python 3.11+
- GitPython (for Python git operations)
- watchdog (for file monitoring)
- click (for CLI)
- colorama (for colored output)

## Contributing

This is a workspace utility. Feel free to:
- Add new commit message styles
- Improve dashboard styling
- Add more batch operations
- Enhance error handling

## License

MIT - Use it, modify it, make it better.

---

**Pro tip:** Run `python repo_sync.py status` every morning to see what needs attention before you start your day.
