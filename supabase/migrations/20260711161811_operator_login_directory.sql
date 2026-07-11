begin;

create or replace function public.list_active_operator_directory()
returns table(id uuid, full_name text)
language sql
security definer
set search_path = ''
as $$
  select p.id, p.full_name
  from public.profiles p
  where p.role = 'operator' and p.is_active
  order by p.full_name;
$$;

revoke all on function public.list_active_operator_directory() from public;
grant execute on function public.list_active_operator_directory() to anon, authenticated;

commit;
