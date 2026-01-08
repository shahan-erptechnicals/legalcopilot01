
-- Create profiles table for user/firm information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  firm_name TEXT,
  email TEXT,
  phone TEXT,
  bar_number TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_types lookup table
CREATE TABLE public.case_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  document_checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  case_type_id UUID REFERENCES public.case_types(id),
  case_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'intake',
  priority TEXT DEFAULT 'medium',
  court_name TEXT,
  opposing_party TEXT,
  opposing_counsel TEXT,
  filed_date DATE,
  next_hearing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_documents table
CREATE TABLE public.case_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT,
  content TEXT,
  is_generated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_reminders table
CREATE TABLE public.case_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  reminder_type TEXT DEFAULT 'deadline',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create intake_conversations table for AI chat
CREATE TABLE public.intake_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create intake_messages table
CREATE TABLE public.intake_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.intake_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_timeline table
CREATE TABLE public.case_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for case_types (public read, admin write)
CREATE POLICY "Anyone can view case types" ON public.case_types FOR SELECT USING (true);

-- RLS Policies for cases
CREATE POLICY "Users can view their own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cases" ON public.cases FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for case_documents
CREATE POLICY "Users can view their own documents" ON public.case_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON public.case_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.case_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.case_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for case_reminders
CREATE POLICY "Users can view their own reminders" ON public.case_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reminders" ON public.case_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.case_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.case_reminders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for intake_conversations
CREATE POLICY "Users can view their own conversations" ON public.intake_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON public.intake_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.intake_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.intake_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for intake_messages (through conversation ownership)
CREATE POLICY "Users can view messages from their conversations" ON public.intake_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.intake_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages to their conversations" ON public.intake_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.intake_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- RLS Policies for case_timeline
CREATE POLICY "Users can view their own timeline" ON public.case_timeline FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own timeline" ON public.case_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own timeline" ON public.case_timeline FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timeline" ON public.case_timeline FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_case_documents_updated_at BEFORE UPDATE ON public.case_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_intake_conversations_updated_at BEFORE UPDATE ON public.intake_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default case types
INSERT INTO public.case_types (name, description, document_checklist) VALUES
('Personal Injury', 'Accidents, medical malpractice, slip and fall cases', '["Medical Records", "Police Report", "Insurance Information", "Witness Statements", "Photos/Evidence", "Lost Wage Documentation"]'::jsonb),
('Family Law', 'Divorce, custody, child support, adoption', '["Marriage Certificate", "Financial Statements", "Property Documents", "Child Information", "Prenuptial Agreement", "Tax Returns"]'::jsonb),
('Criminal Defense', 'Misdemeanors, felonies, DUI, drug charges', '["Police Report", "Arrest Records", "Witness List", "Evidence Documentation", "Character References", "Employment Records"]'::jsonb),
('Real Estate', 'Property disputes, contracts, landlord-tenant', '["Property Deed", "Purchase Agreement", "Title Insurance", "Inspection Reports", "HOA Documents", "Lease Agreements"]'::jsonb),
('Business Law', 'Contracts, partnerships, corporate matters', '["Business Registration", "Contracts", "Financial Statements", "Partnership Agreements", "Corporate Minutes", "Tax Records"]'::jsonb),
('Estate Planning', 'Wills, trusts, probate, inheritance', '["Asset Inventory", "Existing Will/Trust", "Beneficiary Information", "Property Deeds", "Insurance Policies", "Bank Statements"]'::jsonb),
('Immigration', 'Visas, green cards, citizenship, deportation', '["Passport", "Visa Documents", "Employment Records", "Educational Certificates", "Birth Certificate", "Marriage Certificate"]'::jsonb),
('Employment Law', 'Discrimination, wrongful termination, harassment', '["Employment Contract", "Performance Reviews", "Communication Records", "Pay Stubs", "Company Policies", "Witness Statements"]'::jsonb);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_reminders;
