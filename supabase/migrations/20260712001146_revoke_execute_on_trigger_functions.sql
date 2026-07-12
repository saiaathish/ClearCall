-- Trigger functions must not be callable as RPC endpoints. Triggers still fire
-- (they run as the table owner), but the REST surface is removed. Addresses the
-- Supabase security advisor "Public Can Execute SECURITY DEFINER Function".
revoke all on function public.protect_profile_metrics() from public, anon, authenticated;
revoke all on function public.trg_reputation_from_authored() from public, anon, authenticated;
revoke all on function public.trg_reputation_from_helpful() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
