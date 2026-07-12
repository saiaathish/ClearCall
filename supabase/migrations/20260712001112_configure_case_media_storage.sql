-- Enforce upload restrictions at the bucket level (defence in depth beyond the
-- API route), since clients can call Storage directly with the publishable key.
-- Public read is retained for now so demo media keeps rendering; uploads remain
-- restricted to the authenticated user's own uid-prefixed folder via RLS.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'case-media') then
    raise exception 'aborting: storage bucket case-media does not exist';
  end if;
end $$;

update storage.buckets
set file_size_limit = 52428800, -- 50 MiB, matches the API route MAX_BYTES
    allowed_mime_types = array['video/mp4','video/webm','image/jpeg','image/png','image/webp']
where id = 'case-media';
