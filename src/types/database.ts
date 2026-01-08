export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  firm_name: string | null;
  email: string | null;
  phone: string | null;
  bar_number: string | null;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseType {
  id: string;
  name: string;
  description: string | null;
  document_checklist: string[] | unknown;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  client_id: string | null;
  case_type_id: string | null;
  case_number: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  court_name: string | null;
  opposing_party: string | null;
  opposing_counsel: string | null;
  filed_date: string | null;
  next_hearing_date: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  case_type?: CaseType;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  user_id: string;
  document_name: string;
  document_type: string | null;
  file_path: string | null;
  content: string | null;
  is_generated: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CaseReminder {
  id: string;
  case_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  reminder_type: string;
  created_at: string;
}

export interface IntakeConversation {
  id: string;
  user_id: string;
  client_id: string | null;
  case_id: string | null;
  status: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntakeMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CaseTimeline {
  id: string;
  case_id: string;
  user_id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  created_at: string;
}
