begin;

-- Security-definer helpers live outside exposed schemas to avoid recursive RLS
-- lookups on public.profiles. They never accept a user id and always derive the
-- caller from auth.uid().
create schema if not exists private;

revoke all privileges on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.has_active_profile()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active
  );
$$;

create function private.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.is_active;
$$;

create function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active
      and profile.role = 'admin'
  );
$$;

create function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active
      and profile.role in ('admin', 'operator')
  );
$$;

revoke all privileges on function private.has_active_profile()
  from public, anon, authenticated;
revoke all privileges on function private.current_profile_role()
  from public, anon, authenticated;
revoke all privileges on function private.is_active_admin()
  from public, anon, authenticated;
revoke all privileges on function private.is_active_staff()
  from public, anon, authenticated;

grant execute on function private.has_active_profile() to authenticated;
grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.is_active_admin() to authenticated;
grant execute on function private.is_active_staff() to authenticated;

-- Remove platform defaults for client roles, then grant only the operations
-- needed by this phase. Privileges of postgres, service_role and
-- supabase_admin are intentionally left unchanged.
revoke all privileges on table
  public.profiles,
  public.customers,
  public.services,
  public.orders,
  public.order_items,
  public.order_status_history
from public, anon, authenticated;

grant select on table public.profiles to authenticated;

grant select on table public.customers to authenticated;
grant insert (name, phone, email, notes, created_by)
  on table public.customers to authenticated;
grant update (name, phone, email, notes, is_active)
  on table public.customers to authenticated;

grant select on table public.services to authenticated;
grant insert (name, unit, current_price, is_active)
  on table public.services to authenticated;
grant update (name, unit, current_price, is_active)
  on table public.services to authenticated;

grant select on table
  public.orders,
  public.order_items,
  public.order_status_history
to authenticated;

create policy profiles_select_own_active
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and id = (select auth.uid())
  and is_active
  and (select private.has_active_profile())
);

create policy profiles_select_all_by_active_admin
on public.profiles
for select
to authenticated
using ((select private.is_active_admin()));

create policy customers_select_by_active_staff
on public.customers
for select
to authenticated
using ((select private.is_active_staff()));

create policy customers_insert_by_active_staff
on public.customers
for insert
to authenticated
with check (
  (select private.is_active_staff())
  and created_by = (select auth.uid())
);

create policy customers_update_by_active_staff
on public.customers
for update
to authenticated
using ((select private.is_active_staff()))
with check ((select private.is_active_staff()));

create policy services_select_all_by_active_admin
on public.services
for select
to authenticated
using ((select private.is_active_admin()));

create policy services_select_active_by_operator
on public.services
for select
to authenticated
using (
  is_active
  and (select private.current_profile_role()) = 'operator'
);

create policy services_insert_by_active_admin
on public.services
for insert
to authenticated
with check ((select private.is_active_admin()));

create policy services_update_by_active_admin
on public.services
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create policy orders_select_by_active_staff
on public.orders
for select
to authenticated
using ((select private.is_active_staff()));

create policy order_items_select_by_active_staff
on public.order_items
for select
to authenticated
using ((select private.is_active_staff()));

create policy order_status_history_select_by_active_staff
on public.order_status_history
for select
to authenticated
using ((select private.is_active_staff()));

commit;
