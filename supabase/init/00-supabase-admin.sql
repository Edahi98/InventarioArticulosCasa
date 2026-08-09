-- Create supabase_admin role before the image's own init scripts run.
-- The supabase/postgres image expects this role to exist with superuser privileges.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin WITH LOGIN SUPERUSER REPLICATION BYPASSRLS PASSWORD 'postgres';
  END IF;
END $$;
