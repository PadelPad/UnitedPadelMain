# United Padel — v4 (Full Project)

This is the complete app with all patches (compat DB hooks, leaderboard_app MV, notifications view, push token save, UUID player entry).

## Quick start
1) Copy `.env.example` → `.env` and set Supabase URL/Anon key.
2) `npm install`
3) `npx expo start` (scan QR with Expo Go) or build dev clients with EAS for push tests.

## SQL order (if needed)
- `sql/supabase_compat_existing_schema.sql`
- `sql/supabase_compat_mv_fix.sql`
- `sql/supabase_post_setup_grants_and_storage_v2.sql`
- (optional) `sql/supabase_auto_approve_hourly.sql`

## Optional native
- `npx expo prebuild` then `npm run platform:merge` (uses /platform to patch native).
