-- Apply before enabling reviews in production. Writes go through the authenticated server API.
create table if not exists public.booking_reviews (
 booking_code text primary key,
 customer_id uuid not null references auth.users(id),
 data jsonb not null,
 published boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint valid_review_rating check ((data->>'rating')::int between 1 and 5),
 constraint valid_review_comment check (length(data->>'comment') <= 1000),
 constraint consent_before_publication check (not published or coalesce((data->>'publicConsent')::boolean,false))
);
alter table public.booking_reviews enable row level security;
-- Public testimonials are served by an API that removes identifiers and abbreviates names.
-- No direct anon/client access: service_role is the only writer and reader.
revoke all on public.booking_reviews from anon, authenticated;
grant all on public.booking_reviews to service_role;
create index if not exists booking_reviews_customer_idx on public.booking_reviews(customer_id);
