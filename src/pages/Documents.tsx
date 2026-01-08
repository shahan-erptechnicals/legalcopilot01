import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Search, Sparkles, Copy, Download } from 'lucide-react';
import { CaseDocument, Case } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<(CaseDocument & { case?: Case })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CaseDocument | null>(null);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*, case:cases(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(
    (d) =>
      d.document_name.toLowerCase().includes(search.toLowerCase()) ||
      d.case?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-info/10 text-info border-info/20';
      case 'uploaded':
        return 'bg-success/10 text-success border-success/20';
      case 'reviewed':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Documents</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all case documents
          </p>
        </div>

        {/* Search */}
        <Card className="shadow-legal">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-legal">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="shadow-legal">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'Try adjusting your search'
                  : 'Documents will appear here when you generate or upload them'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="shadow-legal hover:shadow-legal-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc.is_generated ? 'gradient-gold' : 'bg-muted'
                      }`}
                    >
                      {doc.is_generated ? (
                        <Sparkles className="h-6 w-6 text-primary" />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{doc.document_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.case?.title || 'No case'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(doc.status)} variant="outline">
                          {doc.status}
                        </Badge>
                        {doc.is_generated && (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary">
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Document Preview Dialog */}
        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                {selectedDoc?.is_generated && (
                  <Sparkles className="h-5 w-5 text-secondary" />
                )}
                {selectedDoc?.document_name}
              </DialogTitle>
              <DialogDescription>
                {selectedDoc?.case?.title || 'No case assigned'}
              </DialogDescription>
            </DialogHeader>
            {selectedDoc?.content && (
              <div className="mt-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedDoc.content!)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-body">
                    {selectedDoc.content}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
