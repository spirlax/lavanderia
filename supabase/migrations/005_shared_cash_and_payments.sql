begin;

create type public.cash_session_status as enum ('open', 'closed');
create type public.payment_method as enum ('cash', 'yape', 'plin');
create type public.payment_status as enum ('posted', 'voided');
create type public.cash_movement_type as enum ('payment_in', 'payment_void_out');

alter table public.profiles
add column can_manage_cash_session boolean not null default false;

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_date date not null,
  status public.cash_session_status not null default 'open',
  opening_cash numeric(12,2) not null,
  responsible_operator_id uuid not null references public.profiles (id) on delete restrict,
  opened_by uuid not null references public.profiles (id) on delete restrict,
  opened_at timestamptz not null default statement_timestamp(),
  expected_cash numeric(12,2) not null,
  counted_cash numeric(12,2),
  difference numeric(12,2),
  closed_by uuid references public.profiles (id) on delete restrict,
  closed_at timestamptz,
  closing_notes text,
  open_operation_id uuid not null unique,
  close_operation_id uuid unique,

  constraint cash_sessions_business_date_unique unique (business_date),
  constraint cash_sessions_opening_nonnegative_check check (opening_cash >= 0),
  constraint cash_sessions_expected_nonnegative_check check (expected_cash >= 0),
  constraint cash_sessions_closing_notes_check check (
    closing_notes is null
    or (length(btrim(closing_notes)) between 1 and 500)
  ),
  constraint cash_sessions_state_check check (
    (
      status = 'open'
      and counted_cash is null
      and difference is null
      and closed_by is null
      and closed_at is null
      and closing_notes is null
      and close_operation_id is null
    )
    or (
      status = 'closed'
      and counted_cash is not null
      and counted_cash >= 0
      and difference = counted_cash - expected_cash
      and closed_by is not null
      and closed_at is not null
      and closed_at >= opened_at
      and close_operation_id is not null
    )
  )
);

create unique index cash_sessions_one_open_global_idx
on public.cash_sessions ((status))
where status = 'open';

create index cash_sessions_responsible_date_idx
on public.cash_sessions (responsible_operator_id, business_date desc);

create index cash_sessions_opened_by_idx
on public.cash_sessions (opened_by);

create index cash_sessions_closed_by_idx
on public.cash_sessions (closed_by)
where closed_by is not null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  cash_session_id uuid not null references public.cash_sessions (id) on delete restrict,
  amount numeric(12,2) not null,
  method public.payment_method not null,
  cash_received numeric(12,2),
  change_given numeric(12,2),
  reference text,
  status public.payment_status not null default 'posted',
  paid_at timestamptz not null default statement_timestamp(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  operation_id uuid not null unique,
  voided_at timestamptz,
  voided_by uuid references public.profiles (id) on delete restrict,
  void_reason text,
  void_cash_session_id uuid references public.cash_sessions (id) on delete restrict,
  void_operation_id uuid unique,

  constraint payments_amount_positive_check check (amount > 0),
  constraint payments_reference_check check (
    reference is null
    or (length(btrim(reference)) between 1 and 80)
  ),
  constraint payments_method_details_check check (
    (
      method = 'cash'
      and cash_received is not null
      and cash_received >= amount
      and change_given = cash_received - amount
      and reference is null
    )
    or (
      method in ('yape', 'plin')
      and cash_received is null
      and change_given is null
    )
  ),
  constraint payments_status_check check (
    (
      status = 'posted'
      and voided_at is null
      and voided_by is null
      and void_reason is null
      and void_cash_session_id is null
      and void_operation_id is null
    )
    or (
      status = 'voided'
      and voided_at is not null
      and voided_by is not null
      and void_reason is not null
      and length(btrim(void_reason)) between 1 and 500
      and void_cash_session_id is not null
      and void_operation_id is not null
      and voided_at >= paid_at
    )
  )
);

create index payments_order_paid_at_idx
on public.payments (order_id, paid_at desc);

create index payments_session_method_idx
on public.payments (cash_session_id, method, status);

create index payments_created_by_session_idx
on public.payments (created_by, cash_session_id);

create index payments_void_session_idx
on public.payments (void_cash_session_id)
where void_cash_session_id is not null;

create index payments_voided_by_idx
on public.payments (voided_by)
where voided_by is not null;

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions (id) on delete restrict,
  payment_id uuid not null references public.payments (id) on delete restrict,
  movement_type public.cash_movement_type not null,
  amount numeric(12,2) not null,
  reason text,
  occurred_at timestamptz not null default statement_timestamp(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  operation_id uuid not null unique,

  constraint cash_movements_amount_positive_check check (amount > 0),
  constraint cash_movements_reason_check check (
    (movement_type = 'payment_in' and reason is null)
    or (
      movement_type = 'payment_void_out'
      and reason is not null
      and length(btrim(reason)) between 1 and 500
    )
  ),
  constraint cash_movements_payment_type_unique unique (payment_id, movement_type)
);

create index cash_movements_session_occurred_idx
on public.cash_movements (cash_session_id, occurred_at desc);

create index cash_movements_created_by_idx
on public.cash_movements (created_by);

alter table public.cash_sessions enable row level security;
alter table public.payments enable row level security;
alter table public.cash_movements enable row level security;

revoke all privileges on table
  public.cash_sessions,
  public.payments,
  public.cash_movements
from public, anon, authenticated;

grant select on table
  public.cash_sessions,
  public.payments,
  public.cash_movements
to authenticated;

revoke update (is_active) on table public.customers from authenticated;

drop policy if exists customers_update_by_active_admin on public.customers;

create policy customers_update_details_by_active_staff
on public.customers
for update
to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy profiles_select_staff_by_active_staff
on public.profiles
for select
to authenticated
using (
  (select private.is_active_staff())
  and role in ('admin', 'operator')
);

create policy cash_sessions_select_by_staff
on public.cash_sessions
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.current_profile_role()) = 'operator'
    and status = 'open'
  )
);

create policy payments_select_by_active_staff
on public.payments
for select
to authenticated
using ((select private.is_active_staff()));

create policy cash_movements_select_by_staff
on public.cash_movements
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.current_profile_role()) = 'operator'
    and exists (
      select 1
      from public.cash_sessions as session
      where session.id = cash_session_id
        and session.status = 'open'
    )
  )
);

create trigger cash_sessions_reject_delete
before delete on public.cash_sessions
for each row execute function public.reject_protected_operation();

create trigger cash_sessions_reject_truncate
before truncate on public.cash_sessions
for each statement execute function public.reject_protected_operation();

create function private.protect_cash_session_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'closed' then
    raise exception 'closed cash session is immutable' using errcode = '55000';
  end if;
  if new.id <> old.id
     or new.business_date <> old.business_date
     or new.opening_cash <> old.opening_cash
     or new.responsible_operator_id <> old.responsible_operator_id
     or new.opened_by <> old.opened_by
     or new.opened_at <> old.opened_at
     or new.open_operation_id <> old.open_operation_id then
    raise exception 'cash session opening fields are immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger cash_sessions_protect_update
before update on public.cash_sessions
for each row execute function private.protect_cash_session_update();

create trigger payments_reject_delete
before delete on public.payments
for each row execute function public.reject_protected_operation();

create trigger payments_reject_truncate
before truncate on public.payments
for each statement execute function public.reject_protected_operation();

create function private.protect_payment_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'voided' then
    raise exception 'voided payment is immutable' using errcode = '55000';
  end if;
  if new.id <> old.id
     or new.order_id <> old.order_id
     or new.cash_session_id <> old.cash_session_id
     or new.amount <> old.amount
     or new.method <> old.method
     or new.cash_received is distinct from old.cash_received
     or new.change_given is distinct from old.change_given
     or new.reference is distinct from old.reference
     or new.paid_at <> old.paid_at
     or new.created_by <> old.created_by
     or new.operation_id <> old.operation_id then
    raise exception 'payment original fields are immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger payments_protect_update
before update on public.payments
for each row execute function private.protect_payment_update();

create trigger cash_movements_reject_update_delete
before update or delete on public.cash_movements
for each row execute function public.reject_protected_operation();

create trigger cash_movements_reject_truncate
before truncate on public.cash_movements
for each statement execute function public.reject_protected_operation();

revoke all privileges on function
  private.protect_cash_session_update(),
  private.protect_payment_update()
from public, anon, authenticated;

create function private.open_cash_session(
  p_opening_cash numeric,
  p_responsible_operator_id uuid,
  p_operation_id uuid
)
returns public.cash_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor public.profiles%rowtype;
  v_responsible public.profiles%rowtype;
  v_existing public.cash_sessions%rowtype;
  v_session public.cash_sessions%rowtype;
  v_business_date date := pg_catalog.timezone(
    'America/Lima',
    pg_catalog.statement_timestamp()
  )::date;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_opening_cash is null
     or p_opening_cash < 0
     or p_opening_cash > 9999999999.99
     or p_responsible_operator_id is null
     or p_operation_id is null then
    raise exception 'valid opening_cash, responsible_operator_id, and operation_id are required'
      using errcode = '22023';
  end if;

  select profile.*
  into v_actor
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active
  for share;

  if not found
     or (
       v_actor.role <> 'admin'
       and not (
         v_actor.role = 'operator'
         and v_actor.can_manage_cash_session
         and v_actor.id = p_responsible_operator_id
       )
     ) then
    raise exception 'cash session management permission required'
      using errcode = '42501';
  end if;

  select profile.*
  into v_responsible
  from public.profiles as profile
  where profile.id = p_responsible_operator_id
    and profile.is_active
    and profile.role = 'operator'
    and profile.can_manage_cash_session
  for share;

  if not found then
    raise exception 'responsible operator must be active and authorized'
      using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.cash_sessions.global_open')
  );

  select session.*
  into v_existing
  from public.cash_sessions as session
  where session.open_operation_id = p_operation_id;

  if found then
    if v_existing.opened_by = v_actor_id
       and v_existing.responsible_operator_id = p_responsible_operator_id
       and v_existing.opening_cash = p_opening_cash then
      return v_existing;
    end if;
    raise exception 'operation_id already used by a different cash opening'
      using errcode = '23505';
  end if;

  if exists (
    select 1 from public.cash_sessions as session where session.status = 'open'
  ) then
    raise exception 'an open cash session already exists' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.cash_sessions as session
    where session.business_date = v_business_date
  ) then
    raise exception 'cash session already exists for this business date'
      using errcode = '23505';
  end if;

  insert into public.cash_sessions (
    business_date,
    opening_cash,
    responsible_operator_id,
    opened_by,
    expected_cash,
    open_operation_id
  ) values (
    v_business_date,
    p_opening_cash,
    p_responsible_operator_id,
    v_actor_id,
    p_opening_cash,
    p_operation_id
  )
  returning * into v_session;

  return v_session;
end;
$$;

create function private.close_cash_session(
  p_cash_session_id uuid,
  p_counted_cash numeric,
  p_closing_notes text,
  p_operation_id uuid
)
returns public.cash_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor public.profiles%rowtype;
  v_session public.cash_sessions%rowtype;
  v_notes text := nullif(pg_catalog.btrim(coalesce(p_closing_notes, '')), '');
  v_expected numeric(12,2);
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_cash_session_id is null
     or p_counted_cash is null
     or p_counted_cash < 0
     or p_counted_cash > 9999999999.99
     or p_operation_id is null
     or (v_notes is not null and length(v_notes) > 500) then
    raise exception 'valid session, counted cash, notes, and operation_id are required'
      using errcode = '22023';
  end if;

  select profile.*
  into v_actor
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active
  for share;

  if not found then
    raise exception 'active staff profile required' using errcode = '42501';
  end if;

  select session.*
  into v_session
  from public.cash_sessions as session
  where session.id = p_cash_session_id
  for update;

  if not found then
    raise exception 'cash session not found' using errcode = 'P0002';
  end if;

  if v_session.status = 'closed' then
    if v_session.close_operation_id = p_operation_id
       and v_session.closed_by = v_actor_id
       and v_session.counted_cash = p_counted_cash
       and v_session.closing_notes is not distinct from v_notes then
      return v_session;
    end if;
    raise exception 'cash session is already closed' using errcode = '23514';
  end if;

  if v_actor.role <> 'admin'
     and not (
       v_actor.role = 'operator'
       and v_actor.can_manage_cash_session
       and v_session.responsible_operator_id = v_actor_id
     ) then
    raise exception 'only admin or responsible operator may close cash session'
      using errcode = '42501';
  end if;

  select (
    v_session.opening_cash
    + coalesce(sum(
      case movement.movement_type
        when 'payment_in' then movement.amount
        when 'payment_void_out' then -movement.amount
      end
    ), 0)
  )::numeric(12,2)
  into v_expected
  from public.cash_movements as movement
  where movement.cash_session_id = v_session.id;

  update public.cash_sessions as session
  set status = 'closed',
      expected_cash = v_expected,
      counted_cash = p_counted_cash,
      difference = p_counted_cash - v_expected,
      closed_by = v_actor_id,
      closed_at = pg_catalog.statement_timestamp(),
      closing_notes = v_notes,
      close_operation_id = p_operation_id
  where session.id = v_session.id
  returning * into v_session;

  return v_session;
end;
$$;

create function private.post_full_payment(
  p_order_id uuid,
  p_method public.payment_method,
  p_cash_received numeric,
  p_reference text,
  p_operation_id uuid
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.user_role;
  v_session public.cash_sessions%rowtype;
  v_order public.orders%rowtype;
  v_existing public.payments%rowtype;
  v_payment public.payments%rowtype;
  v_reference text := nullif(pg_catalog.btrim(coalesce(p_reference, '')), '');
  v_amount numeric(12,2);
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_order_id is null or p_method is null or p_operation_id is null then
    raise exception 'order_id, payment method, and operation_id are required'
      using errcode = '22023';
  end if;

  if v_reference is not null and length(v_reference) > 80 then
    raise exception 'payment reference is too long' using errcode = '22023';
  end if;

  select profile.role
  into v_actor_role
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active
    and profile.role in ('admin', 'operator')
  for share;

  if v_actor_role is null then
    raise exception 'active staff profile required' using errcode = '42501';
  end if;

  select session.*
  into v_session
  from public.cash_sessions as session
  where session.status = 'open'
  for update;

  if not found then
    raise exception 'an open cash session is required' using errcode = '23514';
  end if;

  select payment.*
  into v_existing
  from public.payments as payment
  where payment.operation_id = p_operation_id;

  if found then
    if v_existing.order_id = p_order_id
       and v_existing.created_by = v_actor_id
       and v_existing.method = p_method then
      return v_existing;
    end if;
    raise exception 'operation_id already used by a different payment'
      using errcode = '23505';
  end if;

  select orders.*
  into v_order
  from public.orders as orders
  where orders.id = p_order_id
  for update;

  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.source <> 'platform' or v_order.status = 'cancelled' then
    raise exception 'order does not accept payments' using errcode = '23514';
  end if;

  v_amount := v_order.balance_due;

  if v_amount <= 0 then
    raise exception 'order has no outstanding balance' using errcode = '23514';
  end if;

  if p_method = 'cash' then
    if p_cash_received is null or p_cash_received < v_amount then
      raise exception 'cash received must cover the full balance'
        using errcode = '23514';
    end if;
    if p_cash_received > 9999999999.99 then
      raise exception 'cash received exceeds numeric capacity'
        using errcode = '22023';
    end if;
    if v_reference is not null then
      raise exception 'cash payment does not accept a reference'
        using errcode = '22023';
    end if;
  elsif p_cash_received is not null then
    raise exception 'digital payment does not accept cash received'
      using errcode = '22023';
  end if;

  insert into public.payments (
    order_id,
    cash_session_id,
    amount,
    method,
    cash_received,
    change_given,
    reference,
    created_by,
    operation_id
  ) values (
    v_order.id,
    v_session.id,
    v_amount,
    p_method,
    case when p_method = 'cash' then p_cash_received else null end,
    case when p_method = 'cash' then p_cash_received - v_amount else null end,
    case when p_method in ('yape', 'plin') then v_reference else null end,
    v_actor_id,
    p_operation_id
  )
  returning * into v_payment;

  update public.orders as orders
  set amount_paid = orders.amount_paid + v_amount,
      balance_due = orders.balance_due - v_amount
  where orders.id = v_order.id;

  if p_method = 'cash' then
    insert into public.cash_movements (
      cash_session_id,
      payment_id,
      movement_type,
      amount,
      reason,
      created_by,
      operation_id
    ) values (
      v_session.id,
      v_payment.id,
      'payment_in',
      v_amount,
      null,
      v_actor_id,
      p_operation_id
    );

    update public.cash_sessions as session
    set expected_cash = session.expected_cash + v_amount
    where session.id = v_session.id;
  end if;

  return v_payment;
end;
$$;

drop function public.create_platform_order(uuid, timestamptz, jsonb, uuid);
drop function private.create_platform_order(uuid, timestamptz, jsonb, uuid);

create function private.create_platform_order(
  p_customer_id uuid,
  p_scheduled_for timestamptz,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_cash_received numeric,
  p_payment_reference text,
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
  payment_id uuid,
  change_given numeric,
  reused_existing boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.user_role;
  v_session public.cash_sessions%rowtype;
  v_existing_order public.orders%rowtype;
  v_existing_payment public.payments%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_received_at timestamptz := pg_catalog.statement_timestamp();
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item_count integer;
  v_item record;
  v_service public.services%rowtype;
  v_quantity numeric(12,3);
  v_line_total numeric(12,2);
  v_service_id uuid;
  v_resolved_items jsonb := '[]'::jsonb;
  v_seen_service_ids uuid[] := '{}'::uuid[];
  v_extra_key_count integer;
  v_key_count integer;
  v_quantity_text text;
  v_customer_id uuid;
  v_reference text := nullif(pg_catalog.btrim(coalesce(p_payment_reference, '')), '');
  v_payment public.payments%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_customer_id is null
     or p_scheduled_for is null
     or p_items is null
     or p_payment_method is null
     or p_operation_id is null then
    raise exception 'customer, schedule, items, payment method, and operation_id are required'
      using errcode = '22023';
  end if;

  if pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a JSON array' using errcode = '22023';
  end if;

  select profile.role
  into v_actor_role
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active
    and profile.role in ('admin', 'operator')
  for share;

  if v_actor_role is null then
    raise exception 'active staff profile required' using errcode = '42501';
  end if;

  select session.*
  into v_session
  from public.cash_sessions as session
  where session.status = 'open'
  for update;

  if not found then
    raise exception 'an open cash session is required' using errcode = '23514';
  end if;

  select orders.*
  into v_existing_order
  from public.orders as orders
  join public.order_status_history as history on history.order_id = orders.id
  where history.operation_id = p_operation_id
    and history.from_status is null;

  if found then
    select payment.*
    into v_existing_payment
    from public.payments as payment
    where payment.order_id = v_existing_order.id
      and payment.operation_id = p_operation_id;

    if v_existing_order.created_by = v_actor_id and found then
      return query
      select
        v_existing_order.id,
        v_existing_order.order_number,
        v_existing_order.status,
        v_existing_order.subtotal,
        v_existing_order.discount,
        v_existing_order.total,
        v_existing_order.amount_paid,
        v_existing_order.balance_due,
        v_existing_payment.id,
        v_existing_payment.change_given,
        true;
      return;
    end if;

    raise exception 'operation_id already used by a different operation or actor'
      using errcode = '23505';
  end if;

  select customer.id
  into v_customer_id
  from public.customers as customer
  where customer.id = p_customer_id
    and customer.is_active
  for share;

  if not found then
    raise exception 'active customer required' using errcode = '23514';
  end if;

  v_item_count := pg_catalog.jsonb_array_length(p_items);
  if v_item_count < 1 then
    raise exception 'at least one order item is required' using errcode = '23514';
  end if;
  if v_item_count > 100 then
    raise exception 'orders may contain at most 100 line items' using errcode = '22023';
  end if;

  for v_item in
    select ordinality as item_index, value as item_value
    from pg_catalog.jsonb_array_elements(p_items) with ordinality
  loop
    if pg_catalog.jsonb_typeof(v_item.item_value) <> 'object' then
      raise exception 'items[%] must be an object', v_item.item_index
        using errcode = '22023';
    end if;

    select
      count(*)::integer,
      count(*) filter (where key_name not in ('service_id', 'quantity'))::integer
    into v_key_count, v_extra_key_count
    from pg_catalog.jsonb_object_keys(v_item.item_value) as key_name;

    if v_key_count <> 2
       or v_extra_key_count > 0
       or not (
         (v_item.item_value ? 'service_id')
         and (v_item.item_value ? 'quantity')
       ) then
      raise exception 'items[%] may contain only service_id and quantity', v_item.item_index
        using errcode = '22023';
    end if;

    begin
      v_service_id := (v_item.item_value ->> 'service_id')::uuid;
    exception when others then
      raise exception 'items[%].service_id is invalid', v_item.item_index
        using errcode = '22023';
    end;

    if v_service_id is null then
      raise exception 'items[%].service_id is required', v_item.item_index
        using errcode = '22023';
    end if;

    if v_service_id = any (v_seen_service_ids) then
      raise exception 'items[%] duplicates service_id %', v_item.item_index, v_service_id
        using errcode = '23505';
    end if;

    v_quantity_text := pg_catalog.btrim(v_item.item_value ->> 'quantity');
    if v_quantity_text is null or v_quantity_text = '' then
      raise exception 'items[%].quantity is required', v_item.item_index
        using errcode = '22023';
    end if;
    if v_quantity_text !~ '^[0-9]+(\.[0-9]{1,3})?$' then
      raise exception 'items[%].quantity must be a positive numeric value', v_item.item_index
        using errcode = '22023';
    end if;

    begin
      v_quantity := v_quantity_text::numeric(12,3);
    exception when others then
      raise exception 'items[%].quantity exceeds numeric capacity', v_item.item_index
        using errcode = '22023';
    end;

    if v_quantity <= 0 then
      raise exception 'items[%].quantity must be greater than zero', v_item.item_index
        using errcode = '22023';
    end if;

    select service.*
    into v_service
    from public.services as service
    where service.id = v_service_id
      and service.is_active
    for share;

    if not found then
      raise exception 'items[%] references an inactive or missing service', v_item.item_index
        using errcode = '23514';
    end if;

    if v_quantity * v_service.current_price > 9999999999.99 then
      raise exception 'items[%] line total exceeds numeric capacity', v_item.item_index
        using errcode = '22023';
    end if;

    v_line_total := pg_catalog.round(v_quantity * v_service.current_price, 2);
    if v_subtotal + v_line_total > 9999999999.99 then
      raise exception 'order subtotal exceeds numeric capacity' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + v_line_total;
    v_seen_service_ids := pg_catalog.array_append(v_seen_service_ids, v_service_id);
    v_resolved_items := v_resolved_items || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'service_id', v_service.id,
        'service_name_snapshot', v_service.name,
        'unit_snapshot', v_service.unit,
        'quantity', v_quantity,
        'unit_price', v_service.current_price,
        'line_total', v_line_total
      )
    );
  end loop;

  v_total := v_subtotal;

  if v_total <= 0 then
    raise exception 'new order total must be greater than zero' using errcode = '23514';
  end if;

  if v_reference is not null and length(v_reference) > 80 then
    raise exception 'payment reference is too long' using errcode = '22023';
  end if;

  if p_payment_method = 'cash' then
    if p_cash_received is null or p_cash_received < v_total then
      raise exception 'cash received must cover the full total' using errcode = '23514';
    end if;
    if p_cash_received > 9999999999.99 then
      raise exception 'cash received exceeds numeric capacity' using errcode = '22023';
    end if;
    if v_reference is not null then
      raise exception 'cash payment does not accept a reference' using errcode = '22023';
    end if;
  elsif p_cash_received is not null then
    raise exception 'digital payment does not accept cash received' using errcode = '22023';
  end if;

  v_order_id := pg_catalog.gen_random_uuid();
  v_order_number := private.next_platform_order_number();

  insert into public.orders (
    id,
    customer_id,
    order_number,
    status,
    source,
    scheduled_for,
    received_at,
    subtotal,
    discount,
    total,
    amount_paid,
    balance_due,
    created_by
  ) values (
    v_order_id,
    p_customer_id,
    v_order_number,
    'received',
    'platform',
    p_scheduled_for,
    v_received_at,
    v_subtotal,
    0,
    v_total,
    v_total,
    0,
    v_actor_id
  );

  insert into public.order_items (
    order_id,
    service_id,
    service_name_snapshot,
    unit_snapshot,
    quantity,
    unit_price,
    line_total
  )
  select
    v_order_id,
    lines.service_id,
    lines.service_name_snapshot,
    lines.unit_snapshot,
    lines.quantity,
    lines.unit_price,
    lines.line_total
  from pg_catalog.jsonb_to_recordset(v_resolved_items) as lines (
    service_id uuid,
    service_name_snapshot text,
    unit_snapshot public.service_unit,
    quantity numeric,
    unit_price numeric,
    line_total numeric
  );

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    actor_role_snapshot,
    changed_at,
    reason,
    operation_id
  ) values (
    v_order_id,
    null,
    'received',
    v_actor_id,
    v_actor_role,
    v_received_at,
    null,
    p_operation_id
  );

  insert into public.payments (
    order_id,
    cash_session_id,
    amount,
    method,
    cash_received,
    change_given,
    reference,
    paid_at,
    created_by,
    operation_id
  ) values (
    v_order_id,
    v_session.id,
    v_total,
    p_payment_method,
    case when p_payment_method = 'cash' then p_cash_received else null end,
    case when p_payment_method = 'cash' then p_cash_received - v_total else null end,
    case when p_payment_method in ('yape', 'plin') then v_reference else null end,
    v_received_at,
    v_actor_id,
    p_operation_id
  )
  returning * into v_payment;

  if p_payment_method = 'cash' then
    insert into public.cash_movements (
      cash_session_id,
      payment_id,
      movement_type,
      amount,
      reason,
      occurred_at,
      created_by,
      operation_id
    ) values (
      v_session.id,
      v_payment.id,
      'payment_in',
      v_total,
      null,
      v_received_at,
      v_actor_id,
      p_operation_id
    );

    update public.cash_sessions as session
    set expected_cash = session.expected_cash + v_total
    where session.id = v_session.id;
  end if;

  return query
  select
    v_order_id,
    v_order_number,
    'received'::public.order_status,
    v_subtotal,
    0::numeric,
    v_total,
    v_total,
    0::numeric,
    v_payment.id,
    v_payment.change_given,
    false;
end;
$$;

create or replace function private.transition_order_status(
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
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_role public.user_role;
  v_order public.orders%rowtype;
  v_reason text := nullif(pg_catalog.btrim(coalesce(p_reason, '')), '');
  v_now timestamptz := pg_catalog.statement_timestamp();
  v_from_status public.order_status;
  v_existing_history public.order_status_history%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_order_id is null or p_to_status is null or p_operation_id is null then
    raise exception 'order_id, to_status, and operation_id are required'
      using errcode = '22023';
  end if;

  select profile.role
  into v_actor_role
  from public.profiles as profile
  where profile.id = v_actor_id
    and profile.is_active
    and profile.role in ('admin', 'operator')
  for share;

  if v_actor_role is null then
    raise exception 'active staff profile required' using errcode = '42501';
  end if;

  select orders.*
  into v_order
  from public.orders as orders
  where orders.id = p_order_id
  for update;

  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  if v_order.source <> 'platform' then
    raise exception 'only platform orders can be transitioned by this function'
      using errcode = '23514';
  end if;

  select history.*
  into v_existing_history
  from public.order_status_history as history
  where history.operation_id = p_operation_id;

  if found then
    if v_existing_history.order_id = p_order_id
       and v_existing_history.to_status = p_to_status
       and v_existing_history.changed_by = v_actor_id
       and v_existing_history.from_status is not null then
      return query
      select existing.id, existing.order_number, existing.status,
             existing.balance_due, true
      from public.orders as existing
      where existing.id = p_order_id;
      return;
    end if;
    raise exception 'operation_id already used by a different operation or actor'
      using errcode = '23505';
  end if;

  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'terminal order status cannot be changed' using errcode = '23514';
  end if;

  v_from_status := v_order.status;
  if v_from_status = p_to_status then
    raise exception 'transition to the same status is not allowed' using errcode = '23514';
  end if;

  if v_from_status = 'received' and p_to_status = 'in_process' then
    if v_order.balance_due > 0 then
      raise exception 'order must be fully paid before starting service'
        using errcode = '23514';
    end if;
  elsif v_from_status = 'in_process' and p_to_status = 'ready' then
    null;
  elsif v_from_status = 'ready' and p_to_status = 'delivered' then
    if v_order.balance_due > 0 then
      raise exception 'order must be fully paid before delivery'
        using errcode = '23514';
    end if;
  elsif v_from_status = 'ready' and p_to_status = 'in_process' then
    if v_actor_role <> 'admin' then
      raise exception 'only admin can return a ready order to in_process'
        using errcode = '42501';
    end if;
    if v_reason is null then
      raise exception 'reprocess requires a reason' using errcode = '23514';
    end if;
  elsif p_to_status = 'cancelled'
        and v_from_status in ('received', 'in_process', 'ready') then
    if v_actor_role <> 'admin' then
      raise exception 'only admin can cancel an order' using errcode = '42501';
    end if;
    if v_reason is null then
      raise exception 'cancellation requires a reason' using errcode = '23514';
    end if;
  else
    raise exception 'transition from % to % is not allowed', v_from_status, p_to_status
      using errcode = '23514';
  end if;

  if p_to_status = 'in_process' then
    update public.orders as orders
    set status = 'in_process',
        ready_at = null,
        delivered_at = null,
        cancelled_at = null,
        cancel_reason = null,
        delivery_with_balance_authorized_by = null,
        delivery_with_balance_reason = null
    where orders.id = p_order_id;
  elsif p_to_status = 'ready' then
    update public.orders as orders
    set status = 'ready',
        ready_at = v_now,
        delivered_at = null,
        cancelled_at = null,
        cancel_reason = null,
        delivery_with_balance_authorized_by = null,
        delivery_with_balance_reason = null
    where orders.id = p_order_id;
  elsif p_to_status = 'delivered' then
    update public.orders as orders
    set status = 'delivered',
        delivered_at = v_now,
        cancelled_at = null,
        cancel_reason = null,
        delivery_with_balance_authorized_by = null,
        delivery_with_balance_reason = null
    where orders.id = p_order_id;
  elsif p_to_status = 'cancelled' then
    update public.orders as orders
    set status = 'cancelled',
        cancelled_at = v_now,
        cancel_reason = v_reason,
        delivered_at = null,
        delivery_with_balance_authorized_by = null,
        delivery_with_balance_reason = null
    where orders.id = p_order_id;
  end if;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    actor_role_snapshot,
    changed_at,
    reason,
    operation_id
  ) values (
    p_order_id,
    v_from_status,
    p_to_status,
    v_actor_id,
    v_actor_role,
    v_now,
    case
      when p_to_status = 'cancelled' then v_reason
      when v_from_status = 'ready' and p_to_status = 'in_process' then v_reason
      else null
    end,
    p_operation_id
  );

  return query
  select existing.id, existing.order_number, existing.status,
         existing.balance_due, false
  from public.orders as existing
  where existing.id = p_order_id;
end;
$$;

create function private.void_payment(
  p_payment_id uuid,
  p_reason text,
  p_operation_id uuid
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_reason text := nullif(pg_catalog.btrim(coalesce(p_reason, '')), '');
  v_session public.cash_sessions%rowtype;
  v_payment public.payments%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_payment_id is null
     or p_operation_id is null
     or v_reason is null
     or length(v_reason) > 500 then
    raise exception 'payment, reason, and operation_id are required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_actor_id
      and profile.is_active
      and profile.role = 'admin'
  ) then
    raise exception 'only admin can void payments' using errcode = '42501';
  end if;

  select session.*
  into v_session
  from public.cash_sessions as session
  where session.status = 'open'
  for update;

  if not found then
    raise exception 'an open cash session is required' using errcode = '23514';
  end if;

  select payment.*
  into v_payment
  from public.payments as payment
  where payment.id = p_payment_id
  for update;

  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;

  if v_payment.status = 'voided' then
    if v_payment.void_operation_id = p_operation_id
       and v_payment.voided_by = v_actor_id then
      return v_payment;
    end if;
    raise exception 'payment is already voided' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.payments as payment
    where payment.void_operation_id = p_operation_id
  ) then
    raise exception 'operation_id already used by a different void'
      using errcode = '23505';
  end if;

  if v_payment.method = 'cash'
     and v_session.expected_cash < v_payment.amount then
    raise exception 'cash refund exceeds expected cash in open session'
      using errcode = '23514';
  end if;

  update public.payments as payment
  set status = 'voided',
      voided_at = pg_catalog.statement_timestamp(),
      voided_by = v_actor_id,
      void_reason = v_reason,
      void_cash_session_id = v_session.id,
      void_operation_id = p_operation_id
  where payment.id = v_payment.id
  returning * into v_payment;

  update public.orders as orders
  set amount_paid = orders.amount_paid - v_payment.amount,
      balance_due = orders.balance_due + v_payment.amount
  where orders.id = v_payment.order_id;

  if v_payment.method = 'cash' then
    insert into public.cash_movements (
      cash_session_id,
      payment_id,
      movement_type,
      amount,
      reason,
      created_by,
      operation_id
    ) values (
      v_session.id,
      v_payment.id,
      'payment_void_out',
      v_payment.amount,
      v_reason,
      v_actor_id,
      p_operation_id
    );

    update public.cash_sessions as session
    set expected_cash = session.expected_cash - v_payment.amount
    where session.id = v_session.id;

  end if;

  return v_payment;
end;
$$;

create function private.set_cash_manager_permission(
  p_profile_id uuid,
  p_can_manage boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_profile public.profiles%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_profile_id is null or p_can_manage is null then
    raise exception 'profile_id and can_manage are required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_actor_id
      and profile.is_active
      and profile.role = 'admin'
  ) then
    raise exception 'only admin can manage cash permissions' using errcode = '42501';
  end if;

  update public.profiles as profile
  set can_manage_cash_session = p_can_manage
  where profile.id = p_profile_id
    and profile.role = 'operator'
  returning * into v_profile;

  if not found then
    raise exception 'operator profile not found' using errcode = 'P0002';
  end if;

  if not p_can_manage and exists (
    select 1
    from public.cash_sessions as session
    where session.status = 'open'
      and session.responsible_operator_id = p_profile_id
  ) then
    raise exception 'cannot revoke permission from responsible operator while cash is open'
      using errcode = '23514';
  end if;

  return v_profile;
end;
$$;

create function private.set_customer_active(
  p_customer_id uuid,
  p_is_active boolean
)
returns public.customers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_customer public.customers%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_customer_id is null or p_is_active is null then
    raise exception 'customer_id and is_active are required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_actor_id
      and profile.is_active
      and profile.role = 'admin'
  ) then
    raise exception 'only admin can activate or deactivate customers'
      using errcode = '42501';
  end if;

  update public.customers as customer
  set is_active = p_is_active
  where customer.id = p_customer_id
  returning * into v_customer;

  if not found then
    raise exception 'customer not found' using errcode = 'P0002';
  end if;

  return v_customer;
end;
$$;

create function public.open_cash_session(
  p_opening_cash numeric,
  p_responsible_operator_id uuid,
  p_operation_id uuid
)
returns public.cash_sessions
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.open_cash_session(
    p_opening_cash,
    p_responsible_operator_id,
    p_operation_id
  );
$$;

create function public.close_cash_session(
  p_cash_session_id uuid,
  p_counted_cash numeric,
  p_closing_notes text,
  p_operation_id uuid
)
returns public.cash_sessions
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.close_cash_session(
    p_cash_session_id,
    p_counted_cash,
    p_closing_notes,
    p_operation_id
  );
$$;

create function public.create_platform_order(
  p_customer_id uuid,
  p_scheduled_for timestamptz,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_cash_received numeric,
  p_payment_reference text,
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
  payment_id uuid,
  change_given numeric,
  reused_existing boolean
)
language sql
volatile
security invoker
set search_path = ''
as $$
  select *
  from private.create_platform_order(
    p_customer_id,
    p_scheduled_for,
    p_items,
    p_payment_method,
    p_cash_received,
    p_payment_reference,
    p_operation_id
  );
$$;

create function public.pay_order_balance(
  p_order_id uuid,
  p_method public.payment_method,
  p_cash_received numeric,
  p_reference text,
  p_operation_id uuid
)
returns public.payments
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.post_full_payment(
    p_order_id,
    p_method,
    p_cash_received,
    p_reference,
    p_operation_id
  );
$$;

create function public.void_payment(
  p_payment_id uuid,
  p_reason text,
  p_operation_id uuid
)
returns public.payments
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.void_payment(p_payment_id, p_reason, p_operation_id);
$$;

create function public.set_cash_manager_permission(
  p_profile_id uuid,
  p_can_manage boolean
)
returns public.profiles
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_cash_manager_permission(p_profile_id, p_can_manage);
$$;

create function public.set_customer_active(
  p_customer_id uuid,
  p_is_active boolean
)
returns public.customers
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_customer_active(p_customer_id, p_is_active);
$$;

revoke all privileges on function
  private.open_cash_session(numeric, uuid, uuid),
  private.close_cash_session(uuid, numeric, text, uuid),
  private.post_full_payment(uuid, public.payment_method, numeric, text, uuid),
  private.create_platform_order(uuid, timestamptz, jsonb, public.payment_method, numeric, text, uuid),
  private.void_payment(uuid, text, uuid),
  private.set_cash_manager_permission(uuid, boolean),
  private.set_customer_active(uuid, boolean)
from public, anon, authenticated;

revoke all privileges on function
  public.open_cash_session(numeric, uuid, uuid),
  public.close_cash_session(uuid, numeric, text, uuid),
  public.create_platform_order(uuid, timestamptz, jsonb, public.payment_method, numeric, text, uuid),
  public.pay_order_balance(uuid, public.payment_method, numeric, text, uuid),
  public.void_payment(uuid, text, uuid),
  public.set_cash_manager_permission(uuid, boolean),
  public.set_customer_active(uuid, boolean)
from public, anon, authenticated;

grant execute on function
  private.open_cash_session(numeric, uuid, uuid),
  private.close_cash_session(uuid, numeric, text, uuid),
  private.post_full_payment(uuid, public.payment_method, numeric, text, uuid),
  private.create_platform_order(uuid, timestamptz, jsonb, public.payment_method, numeric, text, uuid),
  private.void_payment(uuid, text, uuid),
  private.set_cash_manager_permission(uuid, boolean),
  private.set_customer_active(uuid, boolean)
to authenticated;

grant execute on function
  public.open_cash_session(numeric, uuid, uuid),
  public.close_cash_session(uuid, numeric, text, uuid),
  public.create_platform_order(uuid, timestamptz, jsonb, public.payment_method, numeric, text, uuid),
  public.pay_order_balance(uuid, public.payment_method, numeric, text, uuid),
  public.void_payment(uuid, text, uuid),
  public.set_cash_manager_permission(uuid, boolean),
  public.set_customer_active(uuid, boolean)
to authenticated;

comment on table public.cash_sessions is
  'One shared daily cash session for the whole business, using America/Lima business dates.';
comment on table public.payments is
  'Immutable full payments in PEN; voiding preserves the original row and audit fields.';
comment on table public.cash_movements is
  'Automatic cash-only movements generated by posted or voided payments.';

commit;
