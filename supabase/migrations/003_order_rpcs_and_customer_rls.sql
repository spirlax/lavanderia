begin;

-- Phase 2A (revised, not yet authorized for remote apply):
-- transactional order RPCs, order_number generator, and customer update RLS.
-- Column-level DML grants remain those defined in migration 002. No seed data.

-- ---------------------------------------------------------------------------
-- Customer update: only active admin (matrix alignment)
-- ---------------------------------------------------------------------------

drop policy if exists customers_update_by_active_staff on public.customers;

create policy customers_update_by_active_admin
on public.customers
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

-- ---------------------------------------------------------------------------
-- Order number counter (America/Lima business year)
-- ---------------------------------------------------------------------------

create table private.order_number_counters (
  year integer primary key,
  last_value integer not null,
  constraint order_number_counters_year_positive_check check (year >= 2000),
  constraint order_number_counters_last_value_positive_check check (last_value >= 0)
);

revoke all privileges on table private.order_number_counters
  from public, anon, authenticated;

create function private.next_platform_order_number()
returns text
language plpgsql
security definer
set search_path = ''
as 'declare v_year integer; v_next integer; begin v_year := pg_catalog.date_part(''year'', pg_catalog.timezone(''America/Lima'', pg_catalog.statement_timestamp()))::integer; insert into private.order_number_counters as counters (year, last_value) values (v_year, 1) on conflict (year) do update set last_value = counters.last_value + 1 returning counters.last_value into v_next; if v_next > 999999 then raise exception ''order number sequence exhausted for year %'', v_year using errcode = ''P0001''; end if; return pg_catalog.format( ''LAV-%s-%s'', v_year, pg_catalog.lpad(v_next::text, 6, ''0'') ); end;';

revoke all privileges on function private.next_platform_order_number()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_platform_order
-- Client may send only customer_id, scheduled_for, items[{service_id,quantity}],
-- and operation_id. Role, prices, totals, and actor come from auth + tables.
-- ---------------------------------------------------------------------------

create function private.create_platform_order(
  p_customer_id uuid,
  p_scheduled_for timestamptz,
  p_items jsonb,
  p_operation_id uuid
)
returns table (
  order_id uuid,
  order_number text,
  status public.order_status,
  subtotal numeric,
  discount numeric,
  total numeric,
  amount_paid numeric,
  balance_due numeric,
  reused_existing boolean
)
language plpgsql
security definer
set search_path = ''
as 'declare v_actor_id uuid := (select auth.uid()); v_actor_role public.user_role; v_existing_order_id uuid; v_existing_changed_by uuid; v_order_id uuid; v_order_number text; v_received_at timestamptz := pg_catalog.statement_timestamp(); v_subtotal numeric(12,2) := 0; v_discount numeric(12,2) := 0; v_total numeric(12,2); v_amount_paid numeric(12,2) := 0; v_balance_due numeric(12,2); v_item_count integer := 0; v_item record; v_service public.services%rowtype; v_quantity numeric(12,3); v_line_total numeric(12,2); v_service_id uuid; v_resolved_items jsonb := ''[]''::jsonb; v_seen_service_ids uuid[] := ''{}''::uuid[]; v_extra_key_count integer; v_key_count integer; v_quantity_text text; v_customer_id uuid; begin if v_actor_id is null then raise exception ''authentication required'' using errcode = ''42501''; end if; if p_customer_id is null or p_scheduled_for is null or p_items is null or p_operation_id is null then raise exception ''customer_id, scheduled_for, items, and operation_id are required'' using errcode = ''22023''; end if; if pg_catalog.jsonb_typeof(p_items) <> ''array'' then raise exception ''items must be a JSON array'' using errcode = ''22023''; end if; select profile.role into v_actor_role from public.profiles as profile where profile.id = v_actor_id and profile.is_active and profile.role in (''admin'', ''operator'') for share; if v_actor_role is null then raise exception ''active staff profile required'' using errcode = ''42501''; end if;  select history.order_id, history.changed_by into v_existing_order_id, v_existing_changed_by from public.order_status_history as history where history.operation_id = p_operation_id; if v_existing_order_id is not null then if v_existing_changed_by = v_actor_id and exists ( select 1 from public.order_status_history as history where history.operation_id = p_operation_id and history.from_status is null and history.to_status = ''received'' and history.changed_by = v_actor_id ) then return query select existing.id, existing.order_number, existing.status, existing.subtotal, existing.discount, existing.total, existing.amount_paid, existing.balance_due, true from public.orders as existing where existing.id = v_existing_order_id; return; end if; raise exception ''operation_id % already used by a different operation or actor'', p_operation_id using errcode = ''23505''; end if; select customer.id into v_customer_id from public.customers as customer where customer.id = p_customer_id and customer.is_active for share; if v_customer_id is null then raise exception ''active customer required'' using errcode = ''23514''; end if; v_item_count := pg_catalog.jsonb_array_length(p_items); if v_item_count < 1 then raise exception ''at least one order item is required'' using errcode = ''23514''; end if; if v_item_count > 100 then raise exception ''orders may contain at most 100 line items'' using errcode = ''22023''; end if; for v_item in select ordinality as item_index, value as item_value from pg_catalog.jsonb_array_elements(p_items) with ordinality loop if pg_catalog.jsonb_typeof(v_item.item_value) <> ''object'' then raise exception ''items[%] must be an object'', v_item.item_index using errcode = ''22023''; end if; select count(*)::integer, count(*) filter ( where key_name not in (''service_id'', ''quantity'') )::integer into v_key_count, v_extra_key_count from pg_catalog.jsonb_object_keys(v_item.item_value) as key_name; if v_key_count <> 2 or v_extra_key_count > 0 or not ( (v_item.item_value ? ''service_id'') and (v_item.item_value ? ''quantity'') ) then raise exception ''items[%] may contain only service_id and quantity'', v_item.item_index using errcode = ''22023''; end if; begin v_service_id := (v_item.item_value ->> ''service_id'')::uuid; exception when others then raise exception ''items[%].service_id is invalid'', v_item.item_index using errcode = ''22023''; end; if v_service_id is null then raise exception ''items[%].service_id is required'', v_item.item_index using errcode = ''22023''; end if; if v_service_id = any (v_seen_service_ids) then raise exception ''items[%] duplicates service_id %'', v_item.item_index, v_service_id using errcode = ''23505''; end if; v_quantity_text := pg_catalog.btrim(v_item.item_value ->> ''quantity''); if v_quantity_text is null or v_quantity_text = '''' then raise exception ''items[%].quantity is required'', v_item.item_index using errcode = ''22023''; end if; if v_quantity_text !~ ''^[0-9]+(\.[0-9]{1,3})?$'' then raise exception ''items[%].quantity must be a positive numeric(12,3) value'', v_item.item_index using errcode = ''22023''; end if; begin v_quantity := v_quantity_text::numeric(12,3); exception when others then raise exception ''items[%].quantity exceeds numeric(12,3) capacity'', v_item.item_index using errcode = ''22023''; end; if v_quantity is null or v_quantity <= 0 then raise exception ''items[%].quantity must be greater than zero'', v_item.item_index using errcode = ''22023''; end if; if v_quantity > 999999999.999 then raise exception ''items[%].quantity exceeds numeric(12,3) capacity'', v_item.item_index using errcode = ''22023''; end if; select * into v_service from public.services as service where service.id = v_service_id and service.is_active for share; if not found then raise exception ''items[%] references an inactive or missing service'', v_item.item_index using errcode = ''23514''; end if; if v_quantity * v_service.current_price > 9999999999.99 then raise exception ''items[%] line total exceeds numeric(12,2) capacity'', v_item.item_index using errcode = ''22023''; end if; v_line_total := pg_catalog.round(v_quantity * v_service.current_price, 2); if v_subtotal + v_line_total > 9999999999.99 then raise exception ''order subtotal exceeds numeric(12,2) capacity'' using errcode = ''22023''; end if; v_subtotal := v_subtotal + v_line_total; v_seen_service_ids := pg_catalog.array_append(v_seen_service_ids, v_service_id); v_resolved_items := v_resolved_items || pg_catalog.jsonb_build_array( pg_catalog.jsonb_build_object( ''service_id'', v_service.id, ''service_name_snapshot'', v_service.name, ''unit_snapshot'', v_service.unit, ''quantity'', v_quantity, ''unit_price'', v_service.current_price, ''line_total'', v_line_total ) ); end loop;  v_discount := 0; v_total := v_subtotal - v_discount; v_amount_paid := 0; v_balance_due := greatest(v_total - v_amount_paid, 0::numeric); v_order_id := pg_catalog.gen_random_uuid(); v_order_number := private.next_platform_order_number(); begin insert into public.orders ( id, customer_id, order_number, status, source, scheduled_for, received_at, ready_at, delivered_at, cancelled_at, subtotal, discount, total, amount_paid, balance_due, created_by, cancel_reason, delivery_with_balance_authorized_by, delivery_with_balance_reason ) values ( v_order_id, p_customer_id, v_order_number, ''received'', ''platform'', p_scheduled_for, v_received_at, null, null, null, v_subtotal, v_discount, v_total, v_amount_paid, v_balance_due, v_actor_id, null, null, null ); insert into public.order_items ( order_id, service_id, service_name_snapshot, unit_snapshot, quantity, unit_price, line_total ) select v_order_id, lines.service_id, lines.service_name_snapshot, lines.unit_snapshot, lines.quantity, lines.unit_price, lines.line_total from pg_catalog.jsonb_to_recordset(v_resolved_items) as lines ( service_id uuid, service_name_snapshot text, unit_snapshot public.service_unit, quantity numeric, unit_price numeric, line_total numeric ); insert into public.order_status_history ( order_id, from_status, to_status, changed_by, actor_role_snapshot, changed_at, reason, operation_id ) values ( v_order_id, null, ''received'', v_actor_id, v_actor_role, v_received_at, null, p_operation_id ); exception when unique_violation then if exists ( select 1 from public.order_status_history as history where history.operation_id = p_operation_id and history.from_status is null and history.to_status = ''received'' and history.changed_by = v_actor_id ) then return query select existing.id, existing.order_number, existing.status, existing.subtotal, existing.discount, existing.total, existing.amount_paid, existing.balance_due, true from public.orders as existing join public.order_status_history as history on history.order_id = existing.id where history.operation_id = p_operation_id and history.changed_by = v_actor_id; return; end if; raise exception ''operation_id % already used by a different operation or actor'', p_operation_id using errcode = ''23505''; end; return query select v_order_id, v_order_number, ''received''::public.order_status, v_subtotal, v_discount, v_total, v_amount_paid, v_balance_due, false; return; end;';

revoke all privileges on function private.create_platform_order(uuid, timestamptz, jsonb, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- transition_order_status
-- Authorizer for delivery-with-balance is always auth.uid(); never client-supplied.
-- ---------------------------------------------------------------------------

create function private.transition_order_status(
  p_order_id uuid,
  p_to_status public.order_status,
  p_operation_id uuid,
  p_reason text default null
)
returns table (
  order_id uuid,
  order_number text,
  status public.order_status,
  balance_due numeric,
  reused_existing boolean
)
language plpgsql
security definer
set search_path = ''
as 'declare v_actor_id uuid := (select auth.uid()); v_actor_role public.user_role; v_order public.orders%rowtype; v_reason text := nullif(pg_catalog.btrim(coalesce(p_reason, '''')), ''''); v_now timestamptz := pg_catalog.statement_timestamp(); v_from_status public.order_status; v_existing_history public.order_status_history%rowtype; begin if v_actor_id is null then raise exception ''authentication required'' using errcode = ''42501''; end if; if p_order_id is null or p_to_status is null or p_operation_id is null then raise exception ''order_id, to_status, and operation_id are required'' using errcode = ''22023''; end if; select profile.role into v_actor_role from public.profiles as profile where profile.id = v_actor_id and profile.is_active and profile.role in (''admin'', ''operator'') for share; if v_actor_role is null then raise exception ''active staff profile required'' using errcode = ''42501''; end if; select orders.* into v_order from public.orders as orders where orders.id = p_order_id for update of orders; if not found then raise exception ''order not found'' using errcode = ''P0002''; end if; if v_order.source <> ''platform'' then raise exception ''only platform orders can be transitioned by this function'' using errcode = ''23514''; end if;  select history.* into v_existing_history from public.order_status_history as history where history.operation_id = p_operation_id; if found then if v_existing_history.order_id = p_order_id and v_existing_history.to_status = p_to_status and v_existing_history.changed_by = v_actor_id and v_existing_history.from_status is not null then return query select existing.id, existing.order_number, existing.status, existing.balance_due, true from public.orders as existing where existing.id = p_order_id; return; end if; raise exception ''operation_id % already used by a different operation or actor'', p_operation_id using errcode = ''23505''; end if; if v_order.status in (''delivered'', ''cancelled'') then raise exception ''terminal order status % cannot be changed'', v_order.status using errcode = ''23514''; end if; v_from_status := v_order.status; if v_from_status = p_to_status then raise exception ''transition to the same status is not allowed'' using errcode = ''23514''; end if; if v_from_status = ''received'' and p_to_status = ''in_process'' then null; elsif v_from_status = ''in_process'' and p_to_status = ''ready'' then null; elsif v_from_status = ''ready'' and p_to_status = ''delivered'' then if v_order.balance_due > 0 then if v_actor_role <> ''admin'' then raise exception ''operator cannot deliver an order with outstanding balance'' using errcode = ''42501''; end if; if v_reason is null then raise exception ''delivery with outstanding balance requires a reason'' using errcode = ''23514''; end if; end if; elsif v_from_status = ''ready'' and p_to_status = ''in_process'' then if v_actor_role <> ''admin'' then raise exception ''only admin can return a ready order to in_process'' using errcode = ''42501''; end if; if v_reason is null then raise exception ''reprocess requires a reason'' using errcode = ''23514''; end if; elsif p_to_status = ''cancelled'' and v_from_status in (''received'', ''in_process'', ''ready'') then if v_actor_role <> ''admin'' then raise exception ''only admin can cancel an order'' using errcode = ''42501''; end if; if v_reason is null then raise exception ''cancellation requires a reason'' using errcode = ''23514''; end if; else raise exception ''transition from % to % is not allowed'', v_from_status, p_to_status using errcode = ''23514''; end if; begin if p_to_status = ''in_process'' then update public.orders as orders set status = ''in_process'', ready_at = null, delivered_at = null, cancelled_at = null, cancel_reason = null, delivery_with_balance_authorized_by = null, delivery_with_balance_reason = null where orders.id = p_order_id; elsif p_to_status = ''ready'' then update public.orders as orders set status = ''ready'', ready_at = v_now, delivered_at = null, cancelled_at = null, cancel_reason = null, delivery_with_balance_authorized_by = null, delivery_with_balance_reason = null where orders.id = p_order_id; elsif p_to_status = ''delivered'' then update public.orders as orders set status = ''delivered'', delivered_at = v_now, cancelled_at = null, cancel_reason = null, delivery_with_balance_authorized_by = case when orders.balance_due > 0 then v_actor_id else null end, delivery_with_balance_reason = case when orders.balance_due > 0 then v_reason else null end where orders.id = p_order_id; elsif p_to_status = ''cancelled'' then update public.orders as orders set status = ''cancelled'', cancelled_at = v_now, cancel_reason = v_reason, delivered_at = null, delivery_with_balance_authorized_by = null, delivery_with_balance_reason = null where orders.id = p_order_id; end if; insert into public.order_status_history ( order_id, from_status, to_status, changed_by, actor_role_snapshot, changed_at, reason, operation_id ) values ( p_order_id, v_from_status, p_to_status, v_actor_id, v_actor_role, v_now, case when p_to_status = ''cancelled'' then v_reason when v_from_status = ''ready'' and p_to_status = ''in_process'' then v_reason when p_to_status = ''delivered'' and v_order.balance_due > 0 then v_reason else null end, p_operation_id ); exception when unique_violation then if exists ( select 1 from public.order_status_history as history where history.operation_id = p_operation_id and history.order_id = p_order_id and history.to_status = p_to_status and history.changed_by = v_actor_id and history.from_status is not null ) then return query select existing.id, existing.order_number, existing.status, existing.balance_due, true from public.orders as existing where existing.id = p_order_id; return; end if; raise exception ''operation_id % already used by a different operation or actor'', p_operation_id using errcode = ''23505''; end; return query select existing.id, existing.order_number, existing.status, existing.balance_due, false from public.orders as existing where existing.id = p_order_id; return; end;';

revoke all privileges on function private.transition_order_status(uuid, public.order_status, uuid, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public SECURITY INVOKER wrappers for PostgREST / supabase-js rpc()
-- ---------------------------------------------------------------------------

create function public.create_platform_order(
  p_customer_id uuid,
  p_scheduled_for timestamptz,
  p_items jsonb,
  p_operation_id uuid
)
returns table (
  order_id uuid,
  order_number text,
  status public.order_status,
  subtotal numeric,
  discount numeric,
  total numeric,
  amount_paid numeric,
  balance_due numeric,
  reused_existing boolean
)
language sql
volatile
security invoker
set search_path = ''
as 'select * from private.create_platform_order( p_customer_id, p_scheduled_for, p_items, p_operation_id );'

create function public.transition_order_status(
  p_order_id uuid,
  p_to_status public.order_status,
  p_operation_id uuid,
  p_reason text default null
)
returns table (
  order_id uuid,
  order_number text,
  status public.order_status,
  balance_due numeric,
  reused_existing boolean
)
language sql
volatile
security invoker
set search_path = ''
as 'select * from private.transition_order_status( p_order_id, p_to_status, p_operation_id, p_reason );'

revoke all privileges on function public.create_platform_order(uuid, timestamptz, jsonb, uuid)
  from public, anon, authenticated;
revoke all privileges on function public.transition_order_status(uuid, public.order_status, uuid, text)
  from public, anon, authenticated;

grant execute on function private.create_platform_order(uuid, timestamptz, jsonb, uuid)
  to authenticated;
grant execute on function private.transition_order_status(uuid, public.order_status, uuid, text)
  to authenticated;

grant execute on function public.create_platform_order(uuid, timestamptz, jsonb, uuid)
  to authenticated;
grant execute on function public.transition_order_status(uuid, public.order_status, uuid, text)
  to authenticated;

comment on function public.create_platform_order(uuid, timestamptz, jsonb, uuid) is
  'Creates a platform order with server-side pricing, totals, and initial status history. Idempotent by operation_id for the same actor.';
comment on function public.transition_order_status(uuid, public.order_status, uuid, text) is
  'Applies an allowed platform-order status transition with role checks and immutable history. Idempotent by operation_id for the same actor.';

commit;
