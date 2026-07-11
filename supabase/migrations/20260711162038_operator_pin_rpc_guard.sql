begin;

create or replace function public.operator_pin_login(p_profile_id uuid, p_pin text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.verify_operator_pin_for_profile(p_profile_id, p_pin);
$$;

revoke all on function public.operator_pin_login(uuid,text) from public, anon, authenticated;
grant execute on function public.operator_pin_login(uuid,text) to service_role;

commit;
