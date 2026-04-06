
-- Drop ALL policies that use has_role or membership_tier functions
DROP POLICY IF EXISTS "Anyone can view free categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Anyone can view starter categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Anyone can view topics in accessible categories" ON public.forum_topics;
DROP POLICY IF EXISTS "Anyone can view replies in accessible topics" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can delete their own topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Users can delete their own replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view approved showcase items" ON public.showcase_items;
DROP POLICY IF EXISTS "Users can update own showcase items" ON public.showcase_items;
DROP POLICY IF EXISTS "Users can delete own showcase items" ON public.showcase_items;
DROP POLICY IF EXISTS "Authenticated users can submit showcase items" ON public.showcase_items;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.showcase_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.showcase_reviews;
DROP POLICY IF EXISTS "Anyone can view showcase reviews" ON public.showcase_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.showcase_reviews;
DROP POLICY IF EXISTS "Only admins can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_membership_tier(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Recreate membership_tier enum
ALTER TABLE public.profiles ALTER COLUMN membership_tier DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN membership_tier TYPE text USING membership_tier::text;
ALTER TABLE public.forum_categories ALTER COLUMN min_tier DROP DEFAULT;
ALTER TABLE public.forum_categories ALTER COLUMN min_tier TYPE text USING min_tier::text;
DROP TYPE public.membership_tier;
CREATE TYPE public.membership_tier AS ENUM ('starter', 'viber');
UPDATE public.profiles SET membership_tier = CASE WHEN membership_tier = 'free' THEN 'starter' WHEN membership_tier = 'pro' THEN 'viber' ELSE membership_tier END;
UPDATE public.forum_categories SET min_tier = CASE WHEN min_tier = 'free' THEN 'starter' WHEN min_tier = 'pro' THEN 'viber' ELSE min_tier END;
ALTER TABLE public.profiles ALTER COLUMN membership_tier TYPE public.membership_tier USING membership_tier::public.membership_tier;
ALTER TABLE public.profiles ALTER COLUMN membership_tier SET DEFAULT 'starter'::public.membership_tier;
ALTER TABLE public.forum_categories ALTER COLUMN min_tier TYPE public.membership_tier USING min_tier::public.membership_tier;
ALTER TABLE public.forum_categories ALTER COLUMN min_tier SET DEFAULT 'starter'::public.membership_tier;

CREATE OR REPLACE FUNCTION public.get_membership_tier(_user_id uuid)
RETURNS membership_tier LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT membership_tier FROM public.profiles WHERE user_id = _user_id $$;

-- Recreate app_role enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'moderator', 'user');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Recreate ALL policies
CREATE POLICY "Anyone can view starter categories" ON public.forum_categories FOR SELECT
  USING (min_tier = 'starter' OR (auth.uid() IS NOT NULL AND get_membership_tier(auth.uid()) = 'viber') OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin')) OR (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'superadmin')));

CREATE POLICY "Anyone can view topics in accessible categories" ON public.forum_topics FOR SELECT
  USING (EXISTS (SELECT 1 FROM forum_categories fc WHERE fc.id = forum_topics.category_id AND (fc.min_tier = 'starter' OR get_membership_tier(auth.uid()) = 'viber' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'))));

CREATE POLICY "Authenticated users can create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" ON public.forum_topics FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can update their own topics" ON public.forum_topics FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can view replies in accessible topics" ON public.forum_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM forum_topics ft JOIN forum_categories fc ON fc.id = ft.category_id WHERE ft.id = forum_replies.topic_id AND (fc.min_tier = 'starter' OR get_membership_tier(auth.uid()) = 'viber' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'))));

CREATE POLICY "Authenticated users can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON public.forum_replies FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can update their own replies" ON public.forum_replies FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Only admins can view subscribers" ON public.newsletter_subscribers FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved showcase items" ON public.showcase_items FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Authenticated users can submit showcase items" ON public.showcase_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own showcase items" ON public.showcase_items FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can delete own showcase items" ON public.showcase_items FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can view showcase reviews" ON public.showcase_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.showcase_items WHERE id = showcase_item_id AND status = 'approved'));

CREATE POLICY "Authenticated users can create reviews" ON public.showcase_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.showcase_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.showcase_reviews FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- Assign superadmin to mirva
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'superadmin'::app_role FROM auth.users au WHERE au.email = 'mirva.saarijarvi@cmimmio.com'
ON CONFLICT (user_id, role) DO NOTHING;
