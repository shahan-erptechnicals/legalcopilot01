-- Add subscription tier default to Solo for profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS practice_areas TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days');

-- Update subscription_tier to have a default value
ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'solo';

-- Create team_members table for Firm tier multi-user access
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id UUID NOT NULL,
  member_user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_owner_id, member_user_id)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies for team_members
CREATE POLICY "Team owners can manage their team members" 
ON public.team_members 
FOR ALL 
USING (auth.uid() = team_owner_id);

CREATE POLICY "Team members can view their team membership" 
ON public.team_members 
FOR SELECT 
USING (auth.uid() = member_user_id);

-- Create custom_templates table for Firm tier
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_templates
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- Policies for custom_templates
CREATE POLICY "Users can manage their own templates" 
ON public.custom_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Create client_portal_access table for Professional tier
CREATE TABLE IF NOT EXISTS public.client_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lawyer_user_id UUID NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Enable RLS on client_portal_access
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;

-- Policies for client_portal_access
CREATE POLICY "Lawyers can manage their client portal access" 
ON public.client_portal_access 
FOR ALL 
USING (auth.uid() = lawyer_user_id);

-- Create function to update updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_templates_updated_at ON public.custom_templates;
CREATE TRIGGER update_custom_templates_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();