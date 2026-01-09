import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CaseDocument } from '@/types/database';

interface DocumentViewerProps {
  document: CaseDocument | null;
  caseTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentViewer({
  document,
  caseTitle,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  const [downloading, setDownloading] = useState(false);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  const downloadAsDocx = async (content: string, filename: string) => {
    // Create a simple DOCX-compatible document using HTML
    const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
    p { margin: 0 0 12pt 0; }
  </style>
</head>
<body>
${content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${filename}.doc`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document downloaded as DOC');
  };

  const downloadFromStorage = async (filePath: string, filename: string) => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('case-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  if (!document) return null;

  const isGenerated = document.is_generated;
  const hasContent = !!document.content;
  const hasFilePath = !!document.file_path;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {isGenerated ? (
              <Sparkles className="h-5 w-5 text-secondary" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground" />
            )}
            {document.document_name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {caseTitle || 'Document Preview'}
            {isGenerated && (
              <Badge variant="outline" className="bg-secondary/10 text-secondary">
                AI Generated
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hasContent && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(document.content!)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAsText(document.content!, document.document_name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAsDocx(document.content!, document.document_name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download DOC
                </Button>
              </>
            )}
            {hasFilePath && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFromStorage(document.file_path!, document.document_name)}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Original
              </Button>
            )}
          </div>

          {/* Document content */}
          {hasContent ? (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed">
                {document.content}
              </pre>
            </div>
          ) : hasFilePath ? (
            <div className="p-8 bg-muted rounded-lg text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                This is an uploaded file. Click "Download Original" to view.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                File: {document.file_path?.split('/').pop()}
              </p>
            </div>
          ) : (
            <div className="p-8 bg-muted rounded-lg text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
