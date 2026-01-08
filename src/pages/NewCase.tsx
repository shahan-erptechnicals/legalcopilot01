import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Client, CaseType, IntakeConversation } from '@/types/database';
import { Link } from 'react-router-dom';

export default function NewCase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [intakeSummary, setIntakeSummary] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    case_type_id: '',
    case_number: '',
    status: 'intake',
    priority: 'medium',
    court_name: '',
    opposing_party: '',
    opposing_counsel: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch clients
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('full_name');

    setClients(clientsData || []);

    // Fetch case types
    const { data: caseTypesData } = await supabase
      .from('case_types')
      .select('*')
      .order('name');

    setCaseTypes(caseTypesData || []);

    // Fetch intake summary if conversation ID provided
    if (conversationId) {
      const { data: conversation } = await supabase
        .from('intake_conversations')
        .select('summary')
        .eq('id', conversationId)
        .maybeSingle();

      if (conversation?.summary) {
        setIntakeSummary(conversation.summary);
        setFormData((prev) => ({
          ...prev,
          description: conversation.summary,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { data: newCase, error } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          client_id: formData.client_id || null,
          case_type_id: formData.case_type_id || null,
          case_number: formData.case_number || null,
          status: formData.status,
          priority: formData.priority,
          court_name: formData.court_name || null,
          opposing_party: formData.opposing_party || null,
          opposing_counsel: formData.opposing_counsel || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add timeline entry
      await supabase.from('case_timeline').insert({
        case_id: newCase.id,
        user_id: user.id,
        event_type: 'created',
        title: 'Case Created',
        description: 'Case was created from ' + (conversationId ? 'intake conversation' : 'manual entry'),
      });

      // Link conversation to case if applicable
      if (conversationId) {
        await supabase
          .from('intake_conversations')
          .update({ case_id: newCase.id })
          .eq('id', conversationId);
      }

      toast.success('Case created successfully');
      navigate(`/dashboard/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard/cases"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>
        </div>

        <Card className="shadow-legal-lg">
          <CardHeader>
            <CardTitle className="font-display text-2xl">New Case</CardTitle>
            <CardDescription>
              {conversationId
                ? 'Create a case from your intake conversation'
                : 'Enter the details for a new legal case'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {intakeSummary && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Intake Summary</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {intakeSummary}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Case Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Smith v. Jones - Personal Injury"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link to="/dashboard/clients/new" className="text-xs text-secondary hover:underline">
                    + Add new client
                  </Link>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case_type">Case Type</Label>
                  <Select
                    value={formData.case_type_id}
                    onValueChange={(value) => setFormData({ ...formData, case_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case_number">Case Number</Label>
                  <Input
                    id="case_number"
                    value={formData.case_number}
                    onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                    placeholder="e.g., 2025-CV-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the case..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="court_name">Court</Label>
                  <Input
                    id="court_name"
                    value={formData.court_name}
                    onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                    placeholder="Court name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opposing_party">Opposing Party</Label>
                  <Input
                    id="opposing_party"
                    value={formData.opposing_party}
                    onChange={(e) => setFormData({ ...formData, opposing_party: e.target.value })}
                    placeholder="Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opposing_counsel">Opposing Counsel</Label>
                  <Input
                    id="opposing_counsel"
                    value={formData.opposing_counsel}
                    onChange={(e) => setFormData({ ...formData, opposing_counsel: e.target.value })}
                    placeholder="Attorney name"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !formData.title}
                  className="gradient-gold text-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Case
                    </>
                  )}
                </Button>
                <Link to="/dashboard/cases">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
