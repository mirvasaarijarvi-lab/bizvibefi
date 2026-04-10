
CREATE TYPE public.vibetor_type AS ENUM ('investor', 'innovator', 'partner');

ALTER TABLE public.profiles ADD COLUMN vibetor_type public.vibetor_type NULL;
