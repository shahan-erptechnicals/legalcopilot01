import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, FileText, Calendar, Shield, AlertCircle, Loader2, CheckCircle, Clock } from 'lucide-react';
import ClientIntakeForm from '@/components/client-portal/ClientIntakeForm';
import ClientIntakeChat from '@/components/client-portal/ClientIntakeChat';

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const intakeType = searchParams.get('type') as 'form' | 'chat' | 'view' | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [intakeComplete, setIntakeComplete] = useState(false);

  useEffect(() => {
    if (token) validateAccess();
    else { setError('Invalid or missing access token'); setLoading(false); }
  }, [token]);

  const validateAccess = async () => {
    try {
      const { data: accessData, error: accessError } = await supabase
        .from('client_portal_access').select('*').eq('access_token', token).eq('is_active', true).single();
      if (accessError || !accessData) { setError('Invalid or expired access link'); return; }
      if (accessData.expires_at && new Date(accessData.expires_at) < new Date()) { setError('This access link has expired'); return; }
      setAccess(accessData);
      await supabase.from('client_portal_access').update({ last_accessed_at: new Date().toISOString() }).eq('id', accessData.id);
      const { data: clientData } = await supabase.from('clients').select('id, full_name, email').eq('id', accessData.client_id).single();
      if (clientData) setClient(clientData);
      if (intakeType === 'view' || !intakeType) {
        const { data: casesData } = await supabase.from('cases').select('*').eq('client_id', accessData.client_id).eq('user_id', accessData.lawyer_user_id).order('created_at', { ascending: false });
        if (casesData) setCases(casesData);
        if (casesData && casesData.length > 0) {
          const { data: docsData } = await supabase.from('case_documents').select('*').in('case_id', casesData.map(c => c.id)).order('created_at', { ascending: false });
          if (docsData) setDocuments(docsData);
        }
      }
    } catch (err) { setError('An error occurred. Please try again.'); } finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-background p-4"><Card className="max-w-md w-full"><CardContent className="pt-6 text-center"><AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Access Denied</h2><p className="text-muted-foreground">{error}</p></CardContent></Card></div>;
  if (intakeComplete) return <div className="min-h-screen flex items-center justify-center bg-background p-4"><Card className="max-w-md w-full"><CardContent className="pt-6 text-center"><CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" /><h2 className="text-xl font-semibold mb-2">Thank You!</h2><p className="text-muted-foreground">Your information has been submitted. Your attorney will contact you soon.</p></CardContent></Card></div>;

  const Header = ({ title }: { title: string }) => (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><Scale className="h-6 w-6 text-primary" /><span className="font-display font-semibold">{title}</span></div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" />Secure Portal</div>
      </div>
    </header>
  );

  if (intakeType === 'form' && access) return (
    <div className="min-h-screen bg-background">
      <Header title="Client Intake" />
      <main className="max-w-4xl mx-auto p-4 py-8">
        <ClientIntakeForm clientId={access.client_id} lawyerId={access.lawyer_user_id} accessToken={token!} onComplete={() => setIntakeComplete(true)} />
      </main>
    </div>
  );

  if (intakeType === 'chat' && access) return (
    <div className="min-h-screen bg-background">
      <Header title="Intake Assistant" />
      <main className="max-w-4xl mx-auto p-4 h-[calc(100vh-4rem)]">
        <ClientIntakeChat clientId={access.client_id} lawyerId={access.lawyer_user_id} accessToken={token!} onComplete={() => setIntakeComplete(true)} />
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Client Portal" />
      <main className="max-w-5xl mx-auto p-4 py-8">
        <h1 className="text-2xl font-display font-semibold mb-2">Welcome, {client?.full_name || 'Client'}</h1>
        <p className="text-muted-foreground mb-8">View your case information and documents below.</p>
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList><TabsTrigger value="cases">My Cases</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger></TabsList>
          <TabsContent value="cases" className="space-y-4">
            {cases.length === 0 ? <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No active cases.</p></CardContent></Card> : cases.map((c) => (
              <Card key={c.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{c.title}</CardTitle><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status || 'Pending'}</Badge></div>{c.description && <CardDescription>{c.description}</CardDescription>}</CardHeader><CardContent><div className="flex flex-wrap gap-4 text-sm">{c.next_hearing_date && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Next: {new Date(c.next_hearing_date).toLocaleDateString()}</div>}<div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Opened: {new Date(c.created_at).toLocaleDateString()}</div></div></CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="documents" className="space-y-4">
            {documents.length === 0 ? <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No documents available.</p></CardContent></Card> : <ScrollArea className="h-[500px]"><div className="space-y-3">{documents.map((d) => <Card key={d.id}><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><div><p className="font-medium">{d.document_name}</p><p className="text-sm text-muted-foreground">{d.document_type || 'Document'} • {new Date(d.created_at).toLocaleDateString()}</p></div></div><Badge variant="secondary">{d.status || 'Available'}</Badge></div></CardContent></Card>)}</div></ScrollArea>}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}