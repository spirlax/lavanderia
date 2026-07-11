begin;

create or replace function private.verify_operator_pin_for_profile(p_profile_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credential private.operator_pin_credentials%rowtype;
  v_email text;
  v_profile public.profiles%rowtype;
  v_success boolean := false;
begin
  if p_profile_id is null or p_pin is null or p_pin !~ '^[0-9]{6}$' then
    return jsonb_build_object('status', 'incorrect');
  end if;
  select * into v_profile from public.profiles where id = p_profile_id;
  if not found or v_profile.role <> 'operator' or not v_profile.is_active then
    return jsonb_build_object('status', 'inactive');
  end if;
  select c.* into v_credential
  from private.operator_pin_credentials c where c.profile_id = p_profile_id
  for update;
  if not found then
    return jsonb_build_object('status', 'not_configured');
  end if;
  if v_credential.locked_until is not null and v_credential.locked_until > statement_timestamp() then
    insert into private.operator_pin_attempts(profile_id, succeeded) values (p_profile_id, false);
    return jsonb_build_object('status', 'locked');
  end if;
  v_success := extensions.crypt(p_pin, v_credential.pin_hash) = v_credential.pin_hash;
  if v_success then
    update private.operator_pin_credentials set failed_attempts = 0, locked_until = null, updated_at = statement_timestamp() where profile_id = p_profile_id;
    select email into v_email from auth.users where id = p_profile_id;
  else
    update private.operator_pin_credentials set failed_attempts = failed_attempts + 1, locked_until = case when failed_attempts + 1 >= 5 then statement_timestamp() + interval '15 minutes' else locked_until end, updated_at = statement_timestamp() where profile_id = p_profile_id;
  end if;
  insert into private.operator_pin_attempts(profile_id, succeeded) values (p_profile_id, v_success);
  if not v_success then return jsonb_build_object('status', 'incorrect'); end if;
  return jsonb_build_object('status', 'success', 'email', v_email);
end;
$$;

create or replace function public.operator_pin_login(p_profile_id uuid, p_pin text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select case when current_setting('request.jwt.claim.role', true) = 'service_role'
    then private.verify_operator_pin_for_profile(p_profile_id, p_pin)
    else null end;
$$;

revoke all on function public.operator_pin_login(uuid,text) from public, anon, authenticated;
grant execute on function public.operator_pin_login(uuid,text) to service_role;

commit;
