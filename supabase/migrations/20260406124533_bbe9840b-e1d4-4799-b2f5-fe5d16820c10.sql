
-- First set superadmin role
UPDATE public.user_roles SET role = 'superadmin' WHERE user_id = '82f10958-6619-40fb-ae37-452bbe3b2891';

-- Disable only the custom trigger
ALTER TABLE public.profiles DISABLE TRIGGER protect_vibetor_tier_trigger;
UPDATE public.profiles SET membership_tier = 'vibetor' WHERE user_id = '82f10958-6619-40fb-ae37-452bbe3b2891';
ALTER TABLE public.profiles ENABLE TRIGGER protect_vibetor_tier_trigger;
