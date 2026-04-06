
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Sender can create requests
CREATE POLICY "Authenticated users can send contact requests"
  ON public.contact_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Recipient can view requests sent to them
CREATE POLICY "Users can view received contact requests"
  ON public.contact_requests FOR SELECT TO authenticated
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Recipient can mark as read
CREATE POLICY "Recipients can update their contact requests"
  ON public.contact_requests FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id);
