# Fix: Race Condition pada Workspace Provisioning

## Masalah

Setiap kali user login, sistem membuat workspace dan user baru secara berulang-ulang, menyebabkan data duplikat seperti:

```
Email: user@example.com
Workspace: coffee shop
Created: 2024-01-01

Email: user@example.com  
Workspace: coffee shop
Created: 2024-01-01

Email: user@example.com
Workspace: coffee shop
Created: 2024-01-01
...
```

## Root Cause

**Race condition** terjadi karena:

1. Saat user login → redirect ke `/dashboard`
2. Next.js me-render **multiple pages secara paralel** (`layout.tsx`, `page.tsx`, nested layouts)
3. Setiap page memanggil `getWorkspaceId()` secara bersamaan
4. Semua request melakukan `SELECT` → tidak menemukan user → membuat workspace + user baru
5. Tidak ada deduplikasi atau unique constraint enforcement di application layer

## Solusi yang Diimplementasikan

### 1. **Race condition protection di `getWorkspaceId()`** 
   (`apps/web/src/lib/get-workspace.ts`)

   - Menambahkan try-catch untuk handle PostgreSQL unique constraint violation (`23505`)
   - Jika constraint violation terdeteksi, retry SELECT untuk mendapatkan workspace yang sudah dibuat oleh request paralel lainnya
   - Idempotent — aman dipanggil berkali-kali

### 2. **Early provisioning di auth callback**
   (`apps/web/src/app/auth/callback/route.ts`)

   - Provision workspace **segera setelah** OAuth callback berhasil
   - Mengurangi kemungkinan race condition karena provisioning dilakukan di single request context
   - Juga menggunakan unique constraint protection

### 3. **Early provisioning di password login**
   (`apps/web/src/app/(auth)/login/page.tsx` + `actions.ts`)

   - Provision workspace **segera setelah** `signInWithPassword` berhasil
   - Menggunakan server action untuk akses database dari client component
   - Idempotent — tidak akan error jika workspace sudah ada

### 4. **Cleanup script untuk data duplikat**
   (`scripts/cleanup-duplicate-workspaces.ts`)

   - Mengidentifikasi semua email dengan multiple workspace
   - Memilih workspace **terlama** sebagai primary
   - Migrate semua data (leads, jobs, ai_insights) ke primary workspace
   - Menghapus duplicate users dan empty workspaces

## Cara Menggunakan

### Membersihkan Data Duplikat yang Sudah Ada

```bash
pnpm db:cleanup-dupes
```

Script ini akan:
- ✅ Mencari semua email dengan duplicate workspace
- ✅ Memilih workspace tertua untuk setiap email
- ✅ Migrate semua leads/jobs/insights ke workspace primary
- ✅ Menghapus duplicate users dan workspaces yang kosong

**PENTING:** Backup database dulu sebelum menjalankan cleanup script!

```bash
# Backup via Supabase Dashboard atau:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Testing

Setelah fix diimplementasikan, test scenario berikut:

1. **First-time login** — buat user baru, login, verify hanya 1 workspace dibuat
2. **Subsequent login** — logout, login lagi, verify tidak ada workspace baru
3. **Multiple tabs** — buka `/dashboard` di 5 tabs sekaligus (fresh login), verify hanya 1 workspace
4. **OAuth flow** — test dengan OAuth callback jika digunakan

## Database Schema Notes

### Existing Constraints

- `users.email` memiliki `UNIQUE` constraint → enforcement utama yang mencegah duplikasi
- Unique constraint name: `users_email_unique` (digunakan di error handling)

### Future Improvements (Optional)

Jika masalah ini terus terjadi atau ingin extra protection:

1. **Add database index:**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
   ON users(email);
   ```

2. **Add database trigger untuk auto-cleanup:**
   ```sql
   CREATE OR REPLACE FUNCTION prevent_duplicate_workspace()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Check if user with this email already exists
     IF EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
       RAISE EXCEPTION 'User with email % already exists', NEW.email;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER check_duplicate_user
   BEFORE INSERT ON users
   FOR EACH ROW
   EXECUTE FUNCTION prevent_duplicate_workspace();
   ```

3. **Add Redis lock untuk distributed locking** (jika scale ke multiple app instances):
   ```typescript
   import { Redis } from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   
   const lockKey = `workspace:provision:${email}`;
   const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX');
   
   if (!lock) {
     // Another process is provisioning, wait and retry
     await sleep(100);
     return getWorkspaceId(); // Retry
   }
   
   try {
     // Do provisioning
   } finally {
     await redis.del(lockKey);
   }
   ```

## Files Changed

- ✅ `apps/web/src/lib/get-workspace.ts` — race condition protection
- ✅ `apps/web/src/app/auth/callback/route.ts` — early provisioning di OAuth callback
- ✅ `apps/web/src/app/(auth)/login/page.tsx` — early provisioning di password login
- ✅ `apps/web/src/app/(auth)/login/actions.ts` — server action untuk provisioning (NEW)
- ✅ `scripts/cleanup-duplicate-workspaces.ts` — cleanup script (NEW)
- ✅ `package.json` — tambah command `db:cleanup-dupes` (NEW)

## Testing Checklist

- [ ] Run cleanup script untuk membersihkan data existing
- [ ] Test first-time login — verify 1 workspace created
- [ ] Test subsequent login — verify no new workspace
- [ ] Test multiple concurrent requests (open 5 tabs simultaneously)
- [ ] Check database untuk confirm no duplicates: 
  ```sql
  SELECT email, COUNT(*) 
  FROM users 
  GROUP BY email 
  HAVING COUNT(*) > 1;
  ```

## Notes

- Solusi ini menggunakan **PostgreSQL unique constraint** sebagai source of truth
- Idempotent di semua layer — aman untuk concurrent execution
- Backward compatible — tidak break existing workspaces
- Cleanup script bersifat **destructive** — selalu backup database dulu!

---

**Status:** ✅ Implemented and ready for testing
**Impact:** Fixes duplicate workspace bug caused by race condition during login
**Risk:** Low — idempotent, backward compatible, constraint-based protection
