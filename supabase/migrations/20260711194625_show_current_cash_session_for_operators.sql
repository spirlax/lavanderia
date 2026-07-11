-- Allow active operators to read the global open cash session and today's
-- session (America/Lima), including when it is already closed.
-- Admins keep full history access. Operators cannot read arbitrary past days.

drop policy if exists cash_sessions_select_by_staff on public.cash_sessions;

create policy cash_sessions_select_by_staff
on public.cash_sessions
for select
to authenticated
using (
  (select private.is_active_admin())
  or (
    (select private.current_profile_role()) = 'operator'
    and (
      status = 'open'
      or business_date = (
        (pg_catalog.timezone('America/Lima', pg_catalog.statement_timestamp()))::date
      )
    )
  )
);

-- Mirror the same day scope for cash movements tied to today's session so
-- operators can load a closed-today summary when movements are present.
drop policy if exists cash_movements_select_by_staff on public.cash_movements;

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
        and (
          session.status = 'open'
          or session.business_date = (
            (pg_catalog.timezone('America/Lima', pg_catalog.statement_timestamp()))::date
          )
        )
    )
  )
);
