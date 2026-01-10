import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Briefcase,
  User,
  Calendar,
  FileText,
  Clock,
  Plus,
  CheckCircle,
  Sparkles,
  Loader2,
  Upload,
  Download,
} from 'lucide-react';
import { Case, CaseDocument, CaseReminder, CaseTimeline, CaseType } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentUploadDialog from '@/components/DocumentUploadDialog';
import AddReminderDialog from '@/components/AddReminderDialog';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [caseType, setCaseType] = useState<CaseType | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [reminders, setReminders] = useState<CaseReminder[]>([]);
  const [timeline, setTimeline] = useState<CaseTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CaseDocument | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCaseData();
    }
  }, [id, user]);

  const fetchCaseData = async () => {
    try {
      // Fetch case with relations
      const { data: caseResult } = await supabase
        .from('cases')
        .select('*, client:clients(*), case_type:case_types(*)')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (caseResult) {
        setCaseData(caseResult);
        setCaseType(caseResult.case_type);
      }

      // Fetch documents
      const { data: docs } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      setDocuments(docs || []);

      // Fetch reminders
      const { data: rems } = await supabase
        .from('case_reminders')
        .select('*')
        .eq('case_id', id)
        .order('due_date', { ascending: true });

      setReminders(rems || []);

      // Fetch timeline
      const { data: timelineData } = await supabase
        .from('case_timeline')
        .select('*')
        .eq('case_id', id)
        .order('event_date', { ascending: false });

      setTimeline(timelineData || []);
    } catch (error) {
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentStatus = async (docId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'uploaded' ? 'pending' : 'uploaded';

    await supabase
      .from('case_documents')
      .update({ status: newStatus })
      .eq('id', docId);

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );
  };

  const toggleReminderComplete = async (remId: string, isCompleted: boolean) => {
    await supabase
      .from('case_reminders')
      .update({ is_completed: !isCompleted })
      .eq('id', remId);

    setReminders((prev) =>
      prev.map((r) => (r.id === remId ? { ...r, is_completed: !isCompleted } : r))
    );
  };

  const generateDocument = async (docType: string) => {
    if (!caseData) return;

    setGeneratingDoc(true);

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a legal document drafting assistant. Generate a professional ${docType} based on the case information provided. Include appropriate legal language, placeholders for specific details (marked with [PLACEHOLDER]), and follow standard legal formatting.`,
            },
            {
              role: 'user',
              content: `Generate a ${docType} for the following case:
              
Case Title: ${caseData.title}
Case Type: ${caseType?.name || 'General'}
Client: ${caseData.client?.full_name || 'Client Name'}
Description: ${caseData.description || 'No description provided'}
Court: ${caseData.court_name || 'To be determined'}
Opposing Party: ${caseData.opposing_party || 'Opposing Party'}`,
            },
          ],
        },
      });

      if (response.error) throw new Error(response.error.message);

      // Save generated document
      const { data: newDoc } = await supabase
        .from('case_documents')
        .insert({
          case_id: caseData.id,
          user_id: user!.id,
          document_name: docType,
          document_type: docType.toLowerCase().replace(/\s+/g, '_'),
          content: response.data.content,
          is_generated: true,
          status: 'generated',
        })
        .select()
        .single();

      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
      }

      // Add timeline entry
      await supabase.from('case_timeline').insert({
        case_id: caseData.id,
        user_id: user!.id,
        event_type: 'document_added',
        title: `${docType} Generated`,
        description: `AI-generated ${docType} added to case`,
      });

      toast.success(`${docType} generated successfully`);
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Failed to generate document');
    } finally {
      setGeneratingDoc(false);
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
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Case Not Found</h2>
          <Link to="/dashboard/cases">
            <Button>Back to Cases</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const documentChecklist = (Array.isArray(caseType?.document_checklist) ? caseType.document_checklist : []) as string[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            to="/dashboard/cases"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-primary">
                  {caseData.title}
                </h1>
                <Badge className={getStatusColor(caseData.status)}>{caseData.status}</Badge>
              </div>
              {caseData.case_number && (
                <p className="text-muted-foreground">#{caseData.case_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-legal">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {caseData.client?.full_name || 'No client assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-legal">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Case Type</p>
                  <p className="font-medium">{caseType?.name || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-legal">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(caseData.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Document Checklist */}
            {documentChecklist.length > 0 && (
              <Card className="shadow-legal">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Document Checklist</CardTitle>
                  <CardDescription>
                    Required documents for {caseType?.name} cases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentChecklist.map((doc, index) => {
                      const uploaded = documents.some(
                        (d) =>
                          d.document_name.toLowerCase() === doc.toLowerCase() &&
                          d.status === 'uploaded'
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            {uploaded ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                            )}
                            <span className={uploaded ? 'line-through text-muted-foreground' : ''}>
                              {doc}
                            </span>
                          </div>
                          {!uploaded && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setUploadDocName(doc);
                                setUploadDialogOpen(true);
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Document Generation */}
            <Card className="shadow-legal">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  AI Document Drafting
                </CardTitle>
                <CardDescription>Generate legal documents with AI assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {['Demand Letter', 'Client Affidavit', 'Notice of Appearance', 'Settlement Agreement'].map(
                    (docType) => (
                      <Button
                        key={docType}
                        variant="outline"
                        onClick={() => generateDocument(docType)}
                        disabled={generatingDoc}
                      >
                        {generatingDoc ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        {docType}
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card className="shadow-legal">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-secondary" />
                  Upload Document
                </CardTitle>
                <CardDescription>Upload files to this case</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  caseId={caseData.id}
                  userId={user!.id}
                  onUploadComplete={() => {
                    fetchCaseData();
                  }}
                />
              </CardContent>
            </Card>

            {/* All Documents List */}
            {documents.length > 0 && (
              <Card className="shadow-legal">
                <CardHeader>
                  <CardTitle className="font-display text-lg">All Documents</CardTitle>
                  <CardDescription>Generated and uploaded documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-lg border hover:border-secondary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center gap-2">
                            {doc.is_generated ? (
                              <Sparkles className="h-4 w-4 text-secondary" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            {doc.document_name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {doc.is_generated ? 'AI Generated' : 'Uploaded'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                        {doc.content && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2 mb-2">
                            {doc.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            View Full Document
                          </Button>
                          {doc.file_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const { data, error } = await supabase.storage
                                  .from('case-files')
                                  .download(doc.file_path!);
                                if (error) {
                                  toast.error('Failed to download');
                                  return;
                                }
                                const url = URL.createObjectURL(data);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.document_name;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success('Downloaded');
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card className="shadow-legal">
              <CardHeader>
                <CardTitle className="font-display text-lg">Case Timeline</CardTitle>
                <CardDescription>History of events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No timeline events yet</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {timeline.map((event) => (
                        <div key={event.id} className="relative pl-10">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-secondary border-2 border-background" />
                          <div className="p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <h4 className="font-medium">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders">
            <Card className="shadow-legal">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display text-lg">Reminders & Deadlines</CardTitle>
                  <CardDescription>Track important dates</CardDescription>
                </div>
                <Button 
                  className="gradient-gold text-primary"
                  onClick={() => setReminderDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reminder
                </Button>
              </CardHeader>
              <CardContent>
                {reminders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No reminders set</p>
                ) : (
                  <div className="space-y-4">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          reminder.is_completed ? 'bg-muted/50' : ''
                        }`}
                      >
                        <Checkbox
                          checked={reminder.is_completed}
                          onCheckedChange={() =>
                            toggleReminderComplete(reminder.id, reminder.is_completed)
                          }
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              reminder.is_completed ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {reminder.title}
                          </h4>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground">{reminder.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="capitalize">
                            {reminder.reminder_type}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card className="shadow-legal">
              <CardHeader>
                <CardTitle className="font-display text-lg">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {caseData.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {caseData.description}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Court Information</h4>
                    <p className="text-muted-foreground">
                      {caseData.court_name || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Opposing Party</h4>
                    <p className="text-muted-foreground">
                      {caseData.opposing_party || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Opposing Counsel</h4>
                    <p className="text-muted-foreground">
                      {caseData.opposing_counsel || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Filed Date</h4>
                    <p className="text-muted-foreground">
                      {caseData.filed_date
                        ? format(new Date(caseData.filed_date), 'MMM d, yyyy')
                        : 'Not filed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Viewer Modal */}
        <DocumentViewer
          document={selectedDocument}
          caseTitle={caseData.title}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />

        {/* Document Upload Dialog */}
        <DocumentUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          documentName={uploadDocName}
          caseId={caseData.id}
          userId={user!.id}
          onUploadComplete={fetchCaseData}
        />

        {/* Add Reminder Dialog */}
        <AddReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          caseId={caseData.id}
          userId={user!.id}
          onReminderAdded={fetchCaseData}
        />
      </div>
    </DashboardLayout>
  );
}
