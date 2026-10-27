# Architecture rules

- Event email functions share scheduler authentication in `supabase/functions/_shared/event-email-auth.ts`; service-role JWTs must pass the project's database API verification before authorization, because decoded claims alone are untrusted and Auth user lookup requires a subject.