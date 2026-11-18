create table public.live_chat_messages (
  id bigint generated always as identity primary key,
  thread_id text not null check (thread_id ~ '^[0-9a-f]{64}$'),
  sender text not null check (sender in ('guest', 'staff')),
  request_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (thread_id, sender, request_id)
);

create index live_chat_messages_thread_latest_idx
  on public.live_chat_messages (thread_id, id desc);

alter table public.live_chat_messages enable row level security;
revoke all on public.live_chat_messages from public, anon, authenticated;
grant select, insert on public.live_chat_messages to service_role;
grant usage on sequence public.live_chat_messages_id_seq to service_role;

create view public.live_chat_inbox with (security_invoker = true) as
select distinct on (thread_id) thread_id, sender, body, created_at, id
from public.live_chat_messages
order by thread_id, id desc;

revoke all on public.live_chat_inbox from public, anon, authenticated;
grant select on public.live_chat_inbox to service_role;