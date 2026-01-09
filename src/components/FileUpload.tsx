import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  caseId: string;
  userId: string;
  documentName?: string;
  onUploadComplete?: (filePath: string, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  caseId,
  userId,
  documentName,
  onUploadComplete,
  accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg',
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Create unique file path: userId/caseId/timestamp_filename
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${caseId}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from('case_documents').insert({
        case_id: caseId,
        user_id: userId,
        document_name: documentName || selectedFile.name,
        document_type: selectedFile.type,
        file_path: filePath,
        status: 'uploaded',
        is_generated: false,
      });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.(filePath, documentName || selectedFile.name);
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
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-secondary bg-secondary/5' : 'border-muted-foreground/25 hover:border-secondary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-secondary" />
            <div className="text-left">
              <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or <span className="text-secondary font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxSizeMB}MB • PDF, DOC, DOCX, TXT, Images
            </p>
          </label>
        )}
      </div>

      {selectedFile && (
        <Button
          onClick={uploadFile}
          disabled={uploading}
          className="w-full gradient-gold text-primary"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      )}
    </div>
  );
}
