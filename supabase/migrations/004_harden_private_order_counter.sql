begin;

alter table private.order_number_counters
enable row level security;

revoke all on table private.order_number_counters
from public, anon, authenticated;

commit;
