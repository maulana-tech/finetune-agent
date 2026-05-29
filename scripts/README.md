# Scripts

Collection of maintenance and setup scripts for uTune AI.

## Database Scripts

### `verify-database.ts`
Check database integrity and show statistics.

```bash
pnpm db:verify
```

**Output:**
- Total users & workspaces
- Duplicate email detection
- Orphaned workspaces
- Recent users list

---

### `cleanup-duplicate-workspaces.ts`
Remove duplicate user entries (same email with multiple workspaces).

```bash
pnpm db:cleanup-dupes
```

**What it does:**
- Find all emails with multiple user rows
- Keep **oldest** workspace per email
- Migrate all data to primary workspace
- Delete duplicate users & empty workspaces

**Safe to run:** Idempotent, skips if no duplicates found

---

### `cleanup-orphaned-workspaces.ts`
Remove workspaces that have no users.

```bash
pnpm db:cleanup-orphaned
```

**What it does:**
- Find workspaces with no users
- Check if workspace has data (leads, jobs, etc)
- Delete only **empty** orphaned workspaces
- Warn about workspaces with data

---

### `migrate-orphaned-data.ts`
Migrate all data from orphaned workspaces to active workspace.

```bash
# Auto-migrate all orphaned data to the only active workspace
pnpm db:migrate-orphaned

# Manual: specify source and target workspace IDs
pnpm db:migrate-orphaned <orphaned-workspace-id> <target-workspace-id>
```

**What it migrates:**
- Leads
- Jobs
- Transactions
- Simulations
- Market data & analyses
- Agent logs
- Swarm runs
- Scrape schedules
- Lead notes

---

## Redis Scripts

### `setup-redis-vps.sh`
Automated Redis setup for VPS (Ubuntu/Debian).

```bash
# On VPS
bash scripts/setup-redis-vps.sh
```

**What it does:**
- Install Redis server
- Generate secure password
- Configure Redis (bind localhost, maxmemory, persistence)
- Restart & enable service
- Test connection
- Print next steps (update .env, restart PM2)

**See:** `docs/redis-migration.md` for full migration guide

---

### `monitor-redis.sh`
Monitor Redis health and BullMQ queues.

```bash
pnpm redis:monitor
```

**Output:**
- Connection status
- Server info (version, uptime)
- Memory usage
- Stats (connections, commands, ops/sec)
- BullMQ queue status (waiting, active, completed, failed jobs)

**Useful for:**
- Checking if workers are processing jobs
- Monitoring memory usage
- Debugging queue issues

---

## Utility Scripts

### `check-schedules.ts`
Check scrape schedules status and workspace assignment.

```bash
pnpm dotenv -e .env -- tsx scripts/check-schedules.ts
```

**Output:**
- List all scrape schedules
- Show workspace assignment
- Count schedules needing migration

---

## Usage Examples

### Daily health check
```bash
pnpm db:verify
pnpm redis:monitor
```

### After user cleanup
```bash
pnpm db:cleanup-dupes
pnpm db:cleanup-orphaned
pnpm db:verify
```

### Redis migration
```bash
# On VPS
bash scripts/setup-redis-vps.sh

# Update .env with new REDIS_URL
nano .env

# Restart services
pm2 restart all

# Verify
pnpm redis:monitor
```

### Debugging queue issues
```bash
# Check Redis queues
pnpm redis:monitor

# Check PM2 logs
pm2 logs workers --lines 100

# Check database for jobs
pnpm db:verify
```

---

## Requirements

- **Node.js:** >= 22
- **pnpm:** 9.15.0
- **tsx:** For TypeScript execution
- **dotenv-cli:** For .env loading
- **Redis:** For redis scripts (on VPS)

---

## Safety Notes

- All database cleanup scripts are **idempotent** — safe to run multiple times
- Scripts check for existing data before deletion
- Orphaned workspaces with data are **not deleted** automatically
- Use `db:verify` before and after cleanup operations
- Always backup database before running cleanup: `pg_dump $DATABASE_URL > backup.sql`

---

## Troubleshooting

### "Cannot find module @repo/db"

Run from project root, not inside scripts folder:
```bash
cd /Users/em/web/finetune-agent
pnpm db:verify
```

### "Permission denied" for shell scripts

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### ".env not found"

Ensure `.env` exists in project root:
```bash
ls -la .env
```

For VPS scripts, ensure `.env` is in the same directory where PM2 runs.

---

## Contributing

When adding new scripts:

1. Add script to `scripts/` folder
2. If TypeScript: add command to `package.json` scripts
3. If Bash: make executable with `chmod +x`
4. Add documentation to this README
5. Test idempotency (safe to run multiple times)
6. Add error handling for edge cases
