begin;

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete
  on table public.push_subscriptions
  to authenticated;

drop policy if exists "Users can read their own push subscription"
  on public.push_subscriptions;
create policy "Users can read their own push subscription"
  on public.push_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own push subscription"
  on public.push_subscriptions;
create policy "Users can create their own push subscription"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own push subscription"
  on public.push_subscriptions;
create policy "Users can update their own push subscription"
  on public.push_subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own push subscription"
  on public.push_subscriptions;
create policy "Users can delete their own push subscription"
  on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = auth.uid());

commit;
