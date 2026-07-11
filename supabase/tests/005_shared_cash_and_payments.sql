-- Run only on a disposable database after migrations 001-005.
-- The test rolls back every row it creates.
begin;

insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003');

insert into public.profiles (
  id, role, full_name, can_manage_cash_session
) values
  ('10000000-0000-4000-8000-000000000001', 'admin', 'Admin', false),
  ('10000000-0000-4000-8000-000000000002', 'operator', 'Principal', true),
  ('10000000-0000-4000-8000-000000000003', 'operator', 'Secundaria', false);

insert into public.customers (id, name, created_by) values (
  '20000000-0000-4000-8000-000000000001',
  'Cliente',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.services (id, name, unit, current_price) values (
  '30000000-0000-4000-8000-000000000001',
  'Lavado',
  'kg',
  10.00
);

insert into public.orders (
  id, customer_id, order_number, status, source, scheduled_for, received_at,
  subtotal, discount, total, amount_paid, balance_due, created_by
) values
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'LEGACY-BALANCE-1',
    'received',
    'platform',
    '2026-07-12 09:00:00-05',
    '2026-07-11 09:00:00-05',
    15, 0, 15, 0, 15,
    '10000000-0000-4000-8000-000000000002'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'LEGACY-BALANCE-2',
    'received',
    'platform',
    '2026-07-12 10:00:00-05',
    '2026-07-11 10:00:00-05',
    20, 0, 20, 0, 20,
    '10000000-0000-4000-8000-000000000002'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

-- 1) Responsible operator opens the shared cash session.
select (public.open_cash_session(
  100,
  '10000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001'
)).id as cash_session_id \gset

do $$
begin
  if not exists (
    select 1
    from public.cash_sessions
    where open_operation_id = '40000000-0000-4000-8000-000000000001'
      and status = 'open'
      and opening_cash = 100
      and expected_cash = 100
  ) then
    raise exception 'test 1 failed: responsible did not open cash';
  end if;
end;
$$;

-- 2) Secondary operator cannot open.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
do $$
begin
  begin
    perform public.open_cash_session(
      0,
      '10000000-0000-4000-8000-000000000003',
      '40000000-0000-4000-8000-000000000002'
    );
    raise exception 'test 2 failed: secondary opened cash';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 3) A second global open session is rejected.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
do $$
begin
  begin
    perform public.open_cash_session(
      0,
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000003'
    );
    raise exception 'test 3 failed: second cash session opened';
  exception when unique_violation then null;
  end;
end;
$$;

-- 4, 5, 7) Primary creates order + full cash payment atomically; change is 5.
select * from public.create_platform_order(
  '20000000-0000-4000-8000-000000000001',
  '2026-07-12 11:00:00-05',
  '[{"service_id":"30000000-0000-4000-8000-000000000001","quantity":"2"}]',
  'cash',
  25,
  null,
  '40000000-0000-4000-8000-000000000004'
) \gset cash_order_

do $$
begin
  if not exists (
    select 1
    from public.orders as orders
    join public.payments as payment on payment.order_id = orders.id
    where payment.operation_id = '40000000-0000-4000-8000-000000000004'
      and orders.total = 20
      and orders.amount_paid = 20
      and orders.balance_due = 0
      and payment.change_given = 5
  ) then
    raise exception 'tests 5/7 failed: cash totals or change are incorrect';
  end if;
  if not exists (
    select 1
    from public.payments
    where operation_id = '40000000-0000-4000-8000-000000000004'
      and amount = 20
      and cash_received = 25
      and change_given = 5
  ) then
    raise exception 'test 7 failed: atomic payment is missing';
  end if;
end;
$$;

-- 4, 6) Secondary records Yape in the same session; expected cash is unchanged.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000003',
  true
);
select * from public.create_platform_order(
  '20000000-0000-4000-8000-000000000001',
  '2026-07-12 12:00:00-05',
  '[{"service_id":"30000000-0000-4000-8000-000000000001","quantity":"1"}]',
  'yape',
  null,
  'YAPE-1',
  '40000000-0000-4000-8000-000000000005'
);

do $$
begin
  if (select expected_cash from public.cash_sessions where status = 'open') <> 120 then
    raise exception 'test 6 failed: Yape changed expected cash';
  end if;
  if (select count(distinct created_by) from public.payments) <> 2 then
    raise exception 'test 4 failed: both operators did not register payments';
  end if;
end;
$$;

-- 6) Plin also leaves expected cash unchanged.
select * from public.pay_order_balance(
  '50000000-0000-4000-8000-000000000001',
  'plin',
  null,
  'PLIN-1',
  '40000000-0000-4000-8000-000000000006'
) \gset legacy_payment_

do $$
begin
  if not exists (
       select 1 from public.payments
       where operation_id = '40000000-0000-4000-8000-000000000006'
         and amount = 15
     )
     or (select balance_due from public.orders where id = '50000000-0000-4000-8000-000000000001') <> 0
     or (select expected_cash from public.cash_sessions where status = 'open') <> 120 then
    raise exception 'tests 6/9 failed: Plin/full balance behavior is incorrect';
  end if;
end;
$$;

-- 8) Invalid full-payment data rolls the whole new order back.
do $$
begin
  begin
    perform * from public.create_platform_order(
      '20000000-0000-4000-8000-000000000001',
      '2026-07-12 13:00:00-05',
      '[{"service_id":"30000000-0000-4000-8000-000000000001","quantity":"3"}]',
      'cash',
      10,
      null,
      '40000000-0000-4000-8000-000000000007'
    );
    raise exception 'test 8 failed: order without valid full payment was created';
  exception when check_violation then null;
  end;
  if exists (
    select 1 from public.order_status_history
    where operation_id = '40000000-0000-4000-8000-000000000007'
  ) then
    raise exception 'test 8 failed: failed order left history';
  end if;
  if to_regprocedure('public.create_platform_order(uuid,timestamptz,jsonb,uuid)') is not null then
    raise exception 'test 8 failed: unpaid legacy RPC signature remains callable';
  end if;
end;
$$;

-- 9) No partial-payment amount exists in the RPC; the complete 15 balance was paid above.

-- 10) Starting service with balance is rejected for all roles.
do $$
begin
  begin
    perform * from public.transition_order_status(
      '50000000-0000-4000-8000-000000000002',
      'in_process',
      '40000000-0000-4000-8000-000000000008'
    );
    raise exception 'test 10 failed: service started with balance';
  exception when check_violation then null;
  end;
end;
$$;

-- 11) Operator may edit customer details.
update public.customers
set name = 'Cliente editado', phone = '999 111 222'
where id = '20000000-0000-4000-8000-000000000001';

do $$
begin
  if (select name from public.customers where id = '20000000-0000-4000-8000-000000000001') <> 'Cliente editado' then
    raise exception 'test 11 failed: operator did not edit customer';
  end if;
end;
$$;

-- 12) Operator cannot deactivate a customer.
do $$
begin
  begin
    update public.customers
    set is_active = false
    where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'test 12 failed: operator deactivated customer';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 13) Secondary cannot close; responsible or admin can.
do $$
begin
  begin
    perform public.close_cash_session(
      (select id from public.cash_sessions where status = 'open'),
      105,
      null,
      '40000000-0000-4000-8000-000000000009'
    );
    raise exception 'test 13 failed: secondary closed cash';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 17) Operator cannot void a payment.
do $$
begin
  begin
    perform public.void_payment(
      (select id from public.payments where operation_id = '40000000-0000-4000-8000-000000000004'),
      'No autorizado',
      '40000000-0000-4000-8000-000000000010'
    );
    raise exception 'test 17 failed: operator voided payment';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 16) Admin voids with a reason; original remains and cash movement is reversed.
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select * from public.void_payment(
  :'cash_order_payment_id'::uuid,
  'Cobro duplicado',
  '40000000-0000-4000-8000-000000000011'
) \gset voided_

do $$
begin
  if not exists (
       select 1 from public.payments
       where operation_id = '40000000-0000-4000-8000-000000000004'
         and status = 'voided'
         and void_reason = 'Cobro duplicado'
     )
     or not exists (
       select 1 from public.cash_movements
       where payment_id = (
         select id from public.payments
         where operation_id = '40000000-0000-4000-8000-000000000004'
       )
         and movement_type = 'payment_void_out'
         and amount = 20
     ) then
    raise exception 'test 16 failed: admin void is incomplete';
  end if;
end;
$$;

-- 14) Admin closes; difference = counted 105 - expected 100 = 5.
select * from public.close_cash_session(
  :'cash_session_id'::uuid,
  105,
  'Cierre de prueba',
  '40000000-0000-4000-8000-000000000012'
) \gset closed_

do $$
begin
  if not exists (
    select 1 from public.cash_sessions
    where open_operation_id = '40000000-0000-4000-8000-000000000001'
      and status = 'closed'
      and expected_cash = 100
      and difference = 5
  ) then
    raise exception 'test 14 failed: close totals are incorrect';
  end if;
end;
$$;

-- 15) Closed cash rejects payments and cannot be reopened/modified.
do $$
begin
  begin
    perform public.pay_order_balance(
      '50000000-0000-4000-8000-000000000002',
      'yape',
      null,
      null,
      '40000000-0000-4000-8000-000000000013'
    );
    raise exception 'test 15 failed: closed cash accepted payment';
  exception when check_violation then null;
  end;
end;
$$;

reset role;
do $$
begin
  begin
    update public.cash_sessions
    set counted_cash = 106
    where open_operation_id = '40000000-0000-4000-8000-000000000001';
    raise exception 'test 15 failed: closed cash changed';
  exception when object_not_in_prerequisite_state then null;
  end;
end;
$$;

rollback;
