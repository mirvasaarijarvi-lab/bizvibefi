
-- Content type enum
CREATE TYPE public.showcase_type AS ENUM ('case_study', 'testimonial', 'tool');

-- Approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Main showcase items table
CREATE TABLE public.showcase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type showcase_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  category_tags TEXT[] DEFAULT '{}',
  pricing_info TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reviews/ratings table for tools
CREATE TABLE public.showcase_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  showcase_item_id UUID NOT NULL REFERENCES public.showcase_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(showcase_item_id, user_id)
);

-- Enable RLS
ALTER TABLE public.showcase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view approved items
CREATE POLICY "Anyone can view approved showcase items"
  ON public.showcase_items FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS: Authenticated users can submit items
CREATE POLICY "Authenticated users can submit showcase items"
  ON public.showcase_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can update their own items
CREATE POLICY "Users can update own showcase items"
  ON public.showcase_items FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS: Users can delete their own items, admins can delete any
CREATE POLICY "Users can delete own showcase items"
  ON public.showcase_items FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS: Anyone can view reviews on approved items
CREATE POLICY "Anyone can view showcase reviews"
  ON public.showcase_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.showcase_items WHERE id = showcase_item_id AND status = 'approved'));

-- RLS: Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.showcase_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.showcase_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.showcase_reviews FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Updated_at trigger for showcase_items
CREATE TRIGGER update_showcase_items_updated_at
  BEFORE UPDATE ON public.showcase_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
