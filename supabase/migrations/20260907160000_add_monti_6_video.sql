begin;

insert into public.videos (
  titolo,
  descrizione,
  url,
  thumbnail_url,
  categoria,
  durata,
  anno
)
select
  'Monti 6',
  null,
  'https://www.youtube.com/watch?v=QVl_flZlHeQ',
  'https://jifelxdbsspfrxheepyt.supabase.co/storage/v1/object/public/copertine/Monti%206.png',
  'MOVIE',
  null,
  '2026'
where not exists (
  select 1
  from public.videos
  where lower(trim(titolo)) = 'monti 6'
);

commit;
