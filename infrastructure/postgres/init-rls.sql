-- ====================================================================
-- Webin10: PostgreSQL Row Level Security (RLS) Template
-- ====================================================================

-- 1. Function to enforce tenant context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Sample RLS activation pattern for all tenant-owned tables
-- (Run this after table creation or during migrations)

-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers FORCE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON customers
--   USING (tenant_id = current_tenant_id())
--   WITH CHECK (tenant_id = current_tenant_id());
