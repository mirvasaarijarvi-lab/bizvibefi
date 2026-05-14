UPDATE public.events 
SET location = 'Turku (paikka TBA)' 
WHERE location = 'Turku (venue TBA)' 
AND starts_at >= '2026-06-10T00:00:00Z' 
AND starts_at < '2026-06-11T00:00:00Z';