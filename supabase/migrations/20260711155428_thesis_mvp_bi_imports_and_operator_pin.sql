begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.report_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  duration_ms integer,
  date_from date not null,
  date_to date not null,
  status text not null default 'completed' check (status in ('completed','failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  check (date_to >= date_from),
  check (duration_ms is null or duration_ms >= 0)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_hash text not null unique,
  imported_by uuid not null references public.profiles(id) on delete restrict,
  imported_at timestamptz not null default statement_timestamp(),
  row_count integer not null check (row_count > 0),
  status text not null default 'completed' check (status in ('completed','failed')),
  error_count integer not null default 0 check (error_count >= 0)
);

create table public.historical_summaries (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete restrict,
  business_date date not null,
  orders_received integer not null check (orders_received >= 0),
  orders_delivered integer not null check (orders_delivered >= 0),
  orders_uncollected integer not null check (orders_uncollected >= 0),
  revenue numeric(12,2) not null check (revenue >= 0),
  report_time_minutes numeric(10,2) not null check (report_time_minutes >= 0),
  unique (import_batch_id, business_date)
);

create index report_runs_requested_by_date_idx on public.report_runs(requested_by, date_from, date_to);
create index historical_summaries_business_date_idx on public.historical_summaries(business_date);
create index import_batches_imported_at_idx on public.import_batches(imported_at desc);

alter table public.report_runs enable row level security;
alter table public.import_batches enable row level security;
alter table public.historical_summaries enable row level security;

create policy report_runs_admin_select on public.report_runs for select to authenticated
  using ((select private.is_active_admin()));
create policy report_runs_admin_insert on public.report_runs for insert to authenticated
  with check ((select private.is_active_admin()) and requested_by = (select auth.uid()));

create policy import_batches_admin_select on public.import_batches for select to authenticated
  using ((select private.is_active_admin()));
create policy import_batches_admin_insert on public.import_batches for insert to authenticated
  with check ((select private.is_active_admin()) and imported_by = (select auth.uid()));

create policy historical_summaries_admin_select on public.historical_summaries for select to authenticated
  using ((select private.is_active_admin()));
create policy historical_summaries_admin_insert on public.historical_summaries for insert to authenticated
  with check ((select private.is_active_admin()));

grant select, insert on public.report_runs, public.import_batches, public.historical_summaries to authenticated;
revoke update, delete on public.report_runs, public.import_batches, public.historical_summaries from anon, authenticated;

create table private.operator_pin_credentials (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  pin_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default statement_timestamp()
);

create table private.operator_pin_attempts (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete restrict,
  succeeded boolean not null,
  attempted_at timestamptz not null default statement_timestamp()
);

revoke all on private.operator_pin_credentials, private.operator_pin_attempts from anon, authenticated;

create or replace function private.set_operator_pin(p_profile_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.profiles%rowtype;
begin
  if (select private.is_active_admin()) is not true then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN must contain exactly 6 digits' using errcode = '22023';
  end if;
  select * into v_target from public.profiles where id = p_profile_id and role = 'operator' and is_active for update;
  if not found then
    raise exception 'active operator not found' using errcode = 'P0002';
  end if;
  insert into private.operator_pin_credentials(profile_id, pin_hash, failed_attempts, locked_until)
  values (p_profile_id, extensions.crypt(p_pin, extensions.gen_salt('bf', 12)), 0, null)
  on conflict (profile_id) do update set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null, updated_at = statement_timestamp();
  return true;
end;
$$;

create or replace function private.verify_operator_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_credential private.operator_pin_credentials%rowtype;
  v_success boolean := false;
begin
  if v_profile_id is null or p_pin is null or p_pin !~ '^[0-9]{6}$' then
    return false;
  end if;
  select c.* into v_credential from private.operator_pin_credentials c
  join public.profiles p on p.id = c.profile_id
  where c.profile_id = v_profile_id and p.role = 'operator' and p.is_active for update;
  if not found or (v_credential.locked_until is not null and v_credential.locked_until > statement_timestamp()) then
    insert into private.operator_pin_attempts(profile_id, succeeded) values (v_profile_id, false);
    return false;
  end if;
  v_success := extensions.crypt(p_pin, v_credential.pin_hash) = v_credential.pin_hash;
  if v_success then
    update private.operator_pin_credentials set failed_attempts = 0, locked_until = null, updated_at = statement_timestamp() where profile_id = v_profile_id;
  else
    update private.operator_pin_credentials set failed_attempts = failed_attempts + 1, locked_until = case when failed_attempts + 1 >= 5 then statement_timestamp() + interval '15 minutes' else locked_until end, updated_at = statement_timestamp() where profile_id = v_profile_id;
  end if;
  insert into private.operator_pin_attempts(profile_id, succeeded) values (v_profile_id, v_success);
  return v_success;
end;
$$;

create or replace function public.set_operator_pin(p_profile_id uuid, p_pin text)
returns boolean language sql security definer set search_path = ''
as $$ select private.set_operator_pin(p_profile_id, p_pin); $$;
create or replace function public.verify_operator_pin(p_pin text)
returns boolean language sql security definer set search_path = ''
as $$ select private.verify_operator_pin(p_pin); $$;
revoke all on function public.set_operator_pin(uuid,text), public.verify_operator_pin(text) from public, anon;
grant execute on function public.set_operator_pin(uuid,text), public.verify_operator_pin(text) to authenticated;

commit;
