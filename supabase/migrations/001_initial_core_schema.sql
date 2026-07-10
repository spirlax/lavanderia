begin;

-- PostgreSQL 15+ provides gen_random_uuid(); no additional extension is required.
-- Exact timestamps are stored as timestamptz and interpreted as America/Lima by
-- future application and reporting logic. All monetary values are PEN.

create type public.user_role as enum (
  'admin',
  'operator'
);

create type public.service_unit as enum (
  'kg',
  'unit',
  'pair',
  'set',
  'other'
);

create type public.order_status as enum (
  'received',
  'in_process',
  'ready',
  'delivered',
  'cancelled'
);

create type public.order_source as enum (
  'platform',
  'historical_detailed'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  role public.user_role not null,
  is_active boolean not null default true,
  full_name text not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),

  constraint profiles_full_name_not_blank_check
    check (length(btrim(full_name)) > 0)
);

comment on column public.profiles.role is
  'Authorization source controlled by the database; user_metadata is not used.';

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),

  constraint customers_name_not_blank_check
    check (length(btrim(name)) > 0),
  constraint customers_phone_not_blank_check
    check (phone is null or length(btrim(phone)) > 0),
  constraint customers_email_not_blank_check
    check (email is null or length(btrim(email)) > 0)
);

comment on column public.customers.phone is
  'Optional and intentionally not unique; duplicate merging is deferred.';

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit public.service_unit not null,
  current_price numeric(12,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),

  constraint services_name_not_blank_check
    check (length(btrim(name)) > 0),
  constraint services_current_price_nonnegative_check
    check (current_price >= 0)
);

comment on column public.services.current_price is
  'Current price in PEN; historical line prices are preserved on order_items.';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  order_number text not null unique,
  status public.order_status not null default 'received',
  source public.order_source not null default 'platform',
  scheduled_for timestamptz,
  received_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  cancel_reason text,
  delivery_with_balance_authorized_by uuid
    references public.profiles (id) on delete restrict,
  delivery_with_balance_reason text,

  constraint orders_order_number_not_blank_check
    check (length(btrim(order_number)) > 0),
  constraint orders_platform_timestamps_check
    check (
      source <> 'platform'
      or (scheduled_for is not null and received_at is not null)
    ),
  constraint orders_amounts_nonnegative_check
    check (
      subtotal >= 0
      and discount >= 0
      and total >= 0
      and amount_paid >= 0
      and balance_due >= 0
    ),
  constraint orders_discount_not_above_subtotal_check
    check (discount <= subtotal),
  constraint orders_total_consistency_check
    check (total = subtotal - discount),
  constraint orders_amount_paid_not_above_total_check
    check (amount_paid <= total),
  constraint orders_balance_consistency_check
    check (balance_due = greatest(total - amount_paid, 0)),
  constraint orders_status_timestamps_check
    check (
      (
        status in ('received', 'in_process')
        and received_at is not null
        and ready_at is null
        and delivered_at is null
        and cancelled_at is null
        and cancel_reason is null
      )
      or (
        status = 'ready'
        and received_at is not null
        and ready_at is not null
        and delivered_at is null
        and cancelled_at is null
        and cancel_reason is null
      )
      or (
        status = 'delivered'
        and received_at is not null
        and ready_at is not null
        and delivered_at is not null
        and cancelled_at is null
        and cancel_reason is null
      )
      or (
        status = 'cancelled'
        and received_at is not null
        and delivered_at is null
        and cancelled_at is not null
        and cancel_reason is not null
        and length(btrim(cancel_reason)) > 0
      )
    ),
  constraint orders_event_chronology_check
    check (
      (received_at is null or ready_at is null or ready_at >= received_at)
      and (ready_at is null or delivered_at is null or delivered_at >= ready_at)
      and (received_at is null or cancelled_at is null or cancelled_at >= received_at)
      and (ready_at is null or cancelled_at is null or cancelled_at >= ready_at)
    ),
  constraint orders_delivery_with_balance_check
    check (
      (
        status <> 'delivered'
        and delivery_with_balance_authorized_by is null
        and delivery_with_balance_reason is null
      )
      or (
        status = 'delivered'
        and balance_due = 0
        and delivery_with_balance_authorized_by is null
        and delivery_with_balance_reason is null
      )
      or (
        status = 'delivered'
        and balance_due > 0
        and delivery_with_balance_authorized_by is not null
        and delivery_with_balance_reason is not null
        and length(btrim(delivery_with_balance_reason)) > 0
      )
    )
);

comment on column public.orders.source is
  'Distinguishes platform orders from detailed historical orders; summaries use a later table.';
comment on column public.orders.order_number is
  'Globally unique; recommended future platform format LAV-AAAA-NNNNNN, generated transactionally.';
comment on column public.orders.scheduled_for is
  'Required for platform orders; nullable for historical details whose source lacks this exact timestamp.';
comment on column public.orders.amount_paid is
  'Defaults to zero; future payment functions must update it transactionally on the server.';
comment on column public.orders.balance_due is
  'Defaults to zero; order creation sets it consistently and future payment functions update it transactionally.';
comment on column public.orders.delivery_with_balance_authorized_by is
  'Future transactional logic must verify that this profile is an active admin.';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,
  service_name_snapshot text not null,
  unit_snapshot public.service_unit not null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default statement_timestamp(),

  constraint order_items_service_name_snapshot_not_blank_check
    check (length(btrim(service_name_snapshot)) > 0),
  constraint order_items_quantity_positive_check
    check (quantity > 0),
  constraint order_items_amounts_nonnegative_check
    check (unit_price >= 0 and line_total >= 0),
  constraint order_items_line_total_consistency_check
    check (line_total = round(quantity * unit_price, 2))
);

comment on column public.order_items.service_id is
  'Nullable historical reference; snapshots remain authoritative if a service is removed later.';

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  actor_role_snapshot public.user_role not null,
  changed_at timestamptz not null default statement_timestamp(),
  reason text,
  operation_id uuid not null default gen_random_uuid() unique,

  constraint order_status_history_transition_check
    check (
      from_status is null
      or (from_status = 'received' and to_status in ('in_process', 'cancelled'))
      or (from_status = 'in_process' and to_status in ('ready', 'cancelled'))
      or (from_status = 'ready' and to_status in ('in_process', 'delivered', 'cancelled'))
    ),
  constraint order_status_history_reason_check
    check (
      (reason is null or length(btrim(reason)) > 0)
      and (
        not (
          to_status = 'cancelled'
          or (from_status = 'ready' and to_status = 'in_process')
        )
        or reason is not null
      )
    )
);

comment on column public.order_status_history.operation_id is
  'Idempotency key for a future transactional status-change function.';
comment on constraint order_status_history_transition_check
  on public.order_status_history is
  'A null from_status records the first known state, including incomplete historical detail.';

create index profiles_active_role_idx
  on public.profiles (role)
  where is_active;

create index customers_created_by_idx
  on public.customers (created_by);
create index customers_active_name_idx
  on public.customers (name)
  where is_active;

create index services_active_name_idx
  on public.services (name)
  where is_active;

create index orders_customer_id_idx
  on public.orders (customer_id);
create index orders_created_by_idx
  on public.orders (created_by);
create index orders_delivery_authorizer_idx
  on public.orders (delivery_with_balance_authorized_by)
  where delivery_with_balance_authorized_by is not null;
create index orders_scheduled_for_idx
  on public.orders (scheduled_for)
  where scheduled_for is not null;
create index orders_active_status_created_at_idx
  on public.orders (status, created_at)
  where status in ('received', 'in_process', 'ready');

create index order_items_order_id_idx
  on public.order_items (order_id);
create index order_items_service_id_idx
  on public.order_items (service_id)
  where service_id is not null;

create index order_status_history_order_changed_at_idx
  on public.order_status_history (order_id, changed_at desc);
create index order_status_history_changed_by_idx
  on public.order_status_history (changed_by);
create index order_status_history_to_status_changed_at_idx
  on public.order_status_history (to_status, changed_at);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create function public.reject_protected_operation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% does not allow %', tg_table_name, tg_op
    using errcode = '55000';
end;
$$;

create trigger orders_reject_delete
before delete on public.orders
for each row execute function public.reject_protected_operation();

create trigger orders_reject_truncate
before truncate on public.orders
for each statement execute function public.reject_protected_operation();

create trigger order_status_history_reject_update_delete
before update or delete on public.order_status_history
for each row execute function public.reject_protected_operation();

create trigger order_status_history_reject_truncate
before truncate on public.order_status_history
for each statement execute function public.reject_protected_operation();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Policies and explicit Data API grants are intentionally deferred to a
-- separately reviewed migration. With RLS enabled and no policies, access for
-- anon/authenticated roles is denied even if project-level grants exist.

commit;
