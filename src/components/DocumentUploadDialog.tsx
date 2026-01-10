import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  caseId: string;
  userId: string;
  onUploadComplete: () => void;
}

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  documentName,
  caseId,
  userId,
  onUploadComplete,
}: DocumentUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${caseId}/${timestamp}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('case_documents').insert({
        case_id: caseId,
        user_id: userId,
        document_name: documentName,
        document_type: selectedFile.type,
        file_path: filePath,
        status: 'uploaded',
        is_generated: false,
      });

      if (dbError) throw dbError;

      toast.success(`${documentName} uploaded successfully`);
      setSelectedFile(null);
      onOpenChange(false);
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload {documentName}</DialogTitle>
          <DialogDescription>
            Select a file to upload for this document requirement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-secondary bg-secondary/5' : 'border-muted-foreground/25 hover:border-secondary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleInputChange}
              className="hidden"
              id="doc-upload-input"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-10 w-10 text-secondary" />
                <div className="text-left">
                  <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="doc-upload-input" className="cursor-pointer block">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Drag & drop or <span className="text-secondary font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Max 10MB • PDF, DOC, DOCX, TXT, Images
                </p>
              </label>
            )}
          </div>

          {selectedFile && (
            <Button onClick={uploadFile} disabled={uploading} className="w-full gradient-gold text-primary">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {documentName}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
