-- Only the Next.js server (service_role) may read or mutate this state.
create table if not exists public.yalaza_store (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  data jsonb not null
);
alter table public.yalaza_store enable row level security;
revoke all on public.yalaza_store from anon, authenticated;
grant select, insert, update on public.yalaza_store to service_role;

create or replace function public.yalaza_compare_and_swap(expected_revision bigint, next_data jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.yalaza_store set data = next_data, revision = revision + 1
    where id = 1 and revision = expected_revision;
  return found;
end;
$$;
revoke all on function public.yalaza_compare_and_swap(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.yalaza_compare_and_swap(bigint, jsonb) to service_role;
