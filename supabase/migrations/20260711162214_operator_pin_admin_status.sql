begin;

create or replace function public.list_operator_pin_status()
returns table(profile_id uuid, full_name text, is_active boolean, pin_configured boolean)
language sql
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.is_active, (c.profile_id is not null)
  from public.profiles p
  left join private.operator_pin_credentials c on c.profile_id = p.id
  where p.role = 'operator' and private.is_active_admin();
$$;

revoke all on function public.list_operator_pin_status() from public, anon;
grant execute on function public.list_operator_pin_status() to authenticated;

commit;
