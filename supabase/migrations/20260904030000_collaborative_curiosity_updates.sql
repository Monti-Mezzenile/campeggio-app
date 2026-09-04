begin;

revoke update on table public.curiosities from authenticated;
grant update (titolo, contenuto, immagine_url, audio_url)
  on table public.curiosities
  to authenticated;

drop policy if exists "Authenticated users can update community curiosities"
  on public.curiosities;

create policy "Authenticated users can update community curiosities"
  on public.curiosities
  for update
  to authenticated
  using (tipo = 'community')
  with check (tipo = 'community');

commit;
