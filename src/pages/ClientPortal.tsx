import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, FileText, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PortalData {
  client: {
    full_name: string;
    email: string;
  };
  cases: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    next_hearing_date: string | null;
  }>;
  documents: Array<{
    id: string;
    document_name: string;
    document_type: string;
    status: string;
    created_at: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    due_date: string;
    is_completed: boolean;
  }>;
}

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  useEffect(() => {
    if (token) {
      validateAndFetchData();
    } else {
      setError('Invalid access link. Please contact your attorney for a new link.');
      setLoading(false);
    }
  }, [token]);

  const validateAndFetchData = async () => {
    try {
      // Validate token and get client data
      const { data: access, error: accessError } = await supabase
        .from('client_portal_access')
        .select('*, client:clients(*)')
        .eq('access_token', token)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (accessError || !access) {
        setError('This access link is invalid or has expired. Please contact your attorney.');
        setLoading(false);
        return;
      }

      // Update last accessed
      await supabase
        .from('client_portal_access')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', access.id);

      // Fetch cases for this client
      const { data: cases } = await supabase
        .from('cases')
        .select('id, title, status, created_at, next_hearing_date')
        .eq('client_id', access.client_id)
        .order('created_at', { ascending: false });

      // Fetch documents for these cases
      const caseIds = cases?.map(c => c.id) || [];
      const { data: documents } = await supabase
        .from('case_documents')
        .select('id, document_name, document_type, status, created_at, case_id')
        .in('case_id', caseIds.length > 0 ? caseIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch reminders for these cases
      const { data: reminders } = await supabase
        .from('case_reminders')
        .select('id, title, due_date, is_completed, case_id')
        .in('case_id', caseIds.length > 0 ? caseIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
        .limit(10);

      setPortalData({
        client: access.client as { full_name: string; email: string },
        cases: cases || [],
        documents: documents || [],
        reminders: reminders || [],
      });
    } catch (err) {
      console.error('Portal error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'intake':
        return 'bg-info/10 text-info';
      case 'active':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      case 'completed':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-legal-lg">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="font-display text-xl font-semibold">Client Portal</h1>
              <p className="text-sm text-primary-foreground/80">
                Welcome, {portalData?.client.full_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cases */}
          <Card className="lg:col-span-2 shadow-legal">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Your Cases
              </CardTitle>
              <CardDescription>Overview of your legal matters</CardDescription>
            </CardHeader>
            <CardContent>
              {portalData?.cases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cases found. Your attorney will update this when available.
                </p>
              ) : (
                <div className="space-y-4">
                  {portalData?.cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Opened: {format(new Date(caseItem.created_at), 'MMM d, yyyy')}
                          </p>
                          {caseItem.next_hearing_date && (
                            <p className="text-sm text-secondary mt-1">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Next hearing: {format(new Date(caseItem.next_hearing_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(caseItem.status)}>
                          {caseItem.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="shadow-legal">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary" />
                Important Dates
              </CardTitle>
              <CardDescription>Upcoming deadlines and reminders</CardDescription>
            </CardHeader>
            <CardContent>
              {portalData?.reminders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {portalData?.reminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{reminder.title}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card className="mt-6 shadow-legal">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Recent Documents
            </CardTitle>
            <CardDescription>Documents related to your cases</CardDescription>
          </CardHeader>
          <CardContent>
            {portalData?.documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No documents available yet.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portalData?.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-lg border bg-card flex items-start gap-3"
                  >
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_type || 'Document'}
                      </p>
                      <Badge className={`mt-2 ${getStatusColor(doc.status || 'pending')}`}>
                        {doc.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {doc.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This portal is read-only. Please contact your attorney directly for any questions or updates.</p>
          <p className="mt-2">Powered by LegalCase Pro</p>
        </div>
      </main>
    </div>
  );
}
