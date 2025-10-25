# 🧩 Applying D1 Migrations (Manual Skip & Apply Guide)

This guide explains how to manually skip a failed migration (e.g., when a table already exists) and continue applying later migrations in your local Cloudflare D1 database.

---

## 🪄 1. Check Pending Migrations

Run the following to see which migrations are pending:

```bash
npx wrangler d1 migrations list DB
```

## 🧠 2. Mark a Failed Migration as Applied

If a migration failed but the schema already matches (e.g., `0003.sql`), mark it as applied manually:

```bash
npx wrangler d1 execute DB --local --command "INSERT INTO d1_migrations (name, applied_at) VALUES ('0003.sql', datetime('now'));"
```

## 🔍 3. Verify It’s Skipped

Re-check the list:

```bash
npx wrangler d1 migrations list DB
```

## ⚙️ 4. Apply Remaining Migrations

Apply all remaining migrations normally:

```bash
npx wrangler d1 migrations apply DB
```
## 📝 Notes

- Use `--local` for your local D1 database.
- Add `--remote` to run against the deployed D1 instance.
- Migration logs are stored at:

```bash
C:\Users\<username>\AppData\Roaming\xdg.config\.wrangler\logs\
```
