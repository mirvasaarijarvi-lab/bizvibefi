CREATE OR REPLACE FUNCTION public.get_event_rsvp_count(_event_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(*) FROM public.event_rsvps
     WHERE event_id = _event_id AND status = 'going')
    +
    (SELECT COUNT(*) FROM public.event_signups
     WHERE event_id = _event_id)
$function$;