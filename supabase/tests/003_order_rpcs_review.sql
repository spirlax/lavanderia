-- Manual review / smoke assertions for migration 003 (revised).
-- Repository has no automated SQL runner yet.
--
-- HOW TO RUN (disposable database only — never production without authorization):
--   1. Apply 001, 002, then 003 on a local/throwaway Supabase DB.
--   2. Replace placeholders with real auth.users / profiles for admin and operator
--      (created via Auth dashboard; do not seed production data here).
--   3. Execute privilege/policy blocks inside a transaction that ends with ROLLBACK.
--
-- No persistent seed data remains after ROLLBACK.

begin;

-- ---------------------------------------------------------------------------
-- Privilege matrix: column grants from migration 002 (not table-wide DML)
-- ---------------------------------------------------------------------------

do $$
begin
  -- customers INSERT columns
  if not (
    has_column_privilege('authenticated', 'public.customers', 'name', 'insert')
    and has_column_privilege('authenticated', 'public.customers', 'phone', 'insert')
    and has_column_privilege('authenticated', 'public.customers', 'email', 'insert')
    and has_column_privilege('authenticated', 'public.customers', 'notes', 'insert')
    and has_column_privilege('authenticated', 'public.customers', 'created_by', 'insert')
  ) then
    raise exception 'authenticated missing expected customers INSERT column privileges';
  end if;

  -- customers UPDATE columns
  if not (
    has_column_privilege('authenticated', 'public.customers', 'name', 'update')
    and has_column_privilege('authenticated', 'public.customers', 'phone', 'update')
    and has_column_privilege('authenticated', 'public.customers', 'email', 'update')
    and has_column_privilege('authenticated', 'public.customers', 'notes', 'update')
    and has_column_privilege('authenticated', 'public.customers', 'is_active', 'update')
  ) then
    raise exception 'authenticated missing expected customers UPDATE column privileges';
  end if;

  -- protected customers columns must not be updatable
  if has_column_privilege('authenticated', 'public.customers', 'id', 'update')
     or has_column_privilege('authenticated', 'public.customers', 'created_at', 'update')
     or has_column_privilege('authenticated', 'public.customers', 'updated_at', 'update')
     or has_column_privilege('authenticated', 'public.customers', 'created_by', 'update') then
    raise exception 'authenticated must not UPDATE protected customers columns';
  end if;

  -- services INSERT/UPDATE columns
  if not (
    has_column_privilege('authenticated', 'public.services', 'name', 'insert')
    and has_column_privilege('authenticated', 'public.services', 'unit', 'insert')
    and has_column_privilege('authenticated', 'public.services', 'current_price', 'insert')
    and has_column_privilege('authenticated', 'public.services', 'is_active', 'insert')
    and has_column_privilege('authenticated', 'public.services', 'name', 'update')
    and has_column_privilege('authenticated', 'public.services', 'unit', 'update')
    and has_column_privilege('authenticated', 'public.services', 'current_price', 'update')
    and has_column_privilege('authenticated', 'public.services', 'is_active', 'update')
  ) then
    raise exception 'authenticated missing expected services INSERT/UPDATE column privileges';
  end if;

  if has_column_privilege('authenticated', 'public.services', 'id', 'update')
     or has_column_privilege('authenticated', 'public.services', 'created_at', 'update')
     or has_column_privilege('authenticated', 'public.services', 'updated_at', 'update') then
    raise exception 'authenticated must not UPDATE protected services columns';
  end if;

  if has_table_privilege('authenticated', 'public.customers', 'delete')
     or has_table_privilege('authenticated', 'public.services', 'delete')
     or has_table_privilege('authenticated', 'public.orders', 'delete')
     or has_table_privilege('authenticated', 'public.order_items', 'delete')
     or has_table_privilege('authenticated', 'public.order_status_history', 'delete') then
    raise exception 'DELETE must not be granted to authenticated on core tables';
  end if;

  if has_table_privilege('authenticated', 'public.orders', 'insert')
     or has_table_privilege('authenticated', 'public.orders', 'update')
     or has_table_privilege('authenticated', 'public.order_items', 'insert')
     or has_table_privilege('authenticated', 'public.order_items', 'update')
     or has_table_privilege('authenticated', 'public.order_status_history', 'insert')
     or has_table_privilege('authenticated', 'public.order_status_history', 'update') then
    raise exception 'authenticated must not have direct INSERT/UPDATE on order tables';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privilege matrix: functions
-- ---------------------------------------------------------------------------

do $$
declare
  v_anon_public_create boolean;
  v_anon_public_transition boolean;
  v_anon_private_create boolean;
  v_auth_public_create boolean;
  v_auth_public_transition boolean;
  v_auth_next_number boolean;
begin
  select has_function_privilege(
    'anon',
    'public.create_platform_order(uuid,timestamptz,jsonb,uuid)',
    'execute'
  ) into v_anon_public_create;

  select has_function_privilege(
    'anon',
    'public.transition_order_status(uuid,order_status,uuid,text)',
    'execute'
  ) into v_anon_public_transition;

  select has_function_privilege(
    'anon',
    'private.create_platform_order(uuid,timestamptz,jsonb,uuid)',
    'execute'
  ) into v_anon_private_create;

  select has_function_privilege(
    'authenticated',
    'public.create_platform_order(uuid,timestamptz,jsonb,uuid)',
    'execute'
  ) into v_auth_public_create;

  select has_function_privilege(
    'authenticated',
    'public.transition_order_status(uuid,order_status,uuid,text)',
    'execute'
  ) into v_auth_public_transition;

  select has_function_privilege(
    'authenticated',
    'private.next_platform_order_number()',
    'execute'
  ) into v_auth_next_number;

  if v_anon_public_create or v_anon_public_transition or v_anon_private_create then
    raise exception 'anon must not EXECUTE order RPC wrappers or private implementations';
  end if;

  if not v_auth_public_create or not v_auth_public_transition then
    raise exception 'authenticated must EXECUTE both public order RPC wrappers';
  end if;

  if v_auth_next_number then
    raise exception 'authenticated must not EXECUTE private.next_platform_order_number';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Policy presence
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.customers'::regclass
      and polname = 'customers_update_by_active_admin'
  ) then
    raise exception 'missing customers_update_by_active_admin policy';
  end if;

  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.customers'::regclass
      and polname = 'customers_update_by_active_staff'
  ) then
    raise exception 'customers_update_by_active_staff must be removed';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Behavioral checklist (requires real JWT sessions)
-- ---------------------------------------------------------------------------

-- 1) operator INSERT customer succeeds; operator UPDATE customer fails (RLS).
-- 2) admin UPDATE customer succeeds.
-- 3) admin INSERT/UPDATE service succeeds.
-- 4) operator INSERT/UPDATE service fails (RLS).
-- 5) create_platform_order rejects item keys beyond {service_id, quantity}.
-- 6) create_platform_order rejects empty items and >100 lines.
-- 7) create_platform_order rejects duplicate service_id in the same payload.
-- 8) same create operation_id + same actor returns reused_existing = true.
-- 9) same operation_id from another actor raises 23505.
-- 10) create operation_id (from_status IS NULL -> received) used as
--     transition_order_status must raise 23505 (never reused as a transition).
-- 11) transition_order_status rejects source = historical_detailed.
-- 12) direct INSERT into public.orders as authenticated fails.
-- 13) operator cannot deliver when balance_due > 0.
-- 14) admin can deliver with balance only with reason; authorizer = auth.uid().
-- 15) UPDATE/DELETE on order_status_history is rejected by trigger.
-- 16) Concurrent transition with the same operation_id (documented procedure):
--
--     Session A and Session B authenticate as the same actor.
--     Both call public.transition_order_status(
--       p_order_id := <same order>,
--       p_to_status := <same allowed next status>,
--       p_operation_id := <same uuid>,
--       p_reason := null
--     ) at the same time.
--
--     Expected:
--       - one session commits the transition (reused_existing = false);
--       - the other waits on FOR UPDATE, then returns reused_existing = true
--         for the same order/status/actor with from_status IS NOT NULL;
--       - neither raises "transition to the same status is not allowed".
--
--     Optional local probe after a successful transition in one session:
--       select *
--       from public.transition_order_status(
--         p_order_id := <order_id>,
--         p_to_status := <same to_status>,
--         p_operation_id := <same operation_id>
--       );
--       -- expect reused_existing = true
--
--     Reject create-as-transition probe:
--       select *
--       from public.transition_order_status(
--         p_order_id := <order_id>,
--         p_to_status := 'in_process',
--         p_operation_id := <create_operation_id>
--       );
--       -- expect SQLSTATE 23505

rollback;
