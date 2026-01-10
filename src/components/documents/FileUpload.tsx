import { useState, useRef } from "react";
import { Upload, X, File, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string, fileType: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({ 
  onUploadComplete, 
  accept = "*/*",
  maxSizeMB = 10 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile);

      clearInterval(progressInterval);

      if (error) throw error;

      // Use signed URL for private bucket (1 year expiry)
      const { data: urlData, error: urlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (urlError) throw urlError;

      setProgress(100);
      
      // Store the file path instead of signed URL (we'll generate fresh URLs when displaying)
      onUploadComplete(fileName, selectedFile.name, selectedFile.type);
      
      toast({ title: "Upload concluído!" });
      
      setTimeout(() => {
        setSelectedFile(null);
        setProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo",
        variant: "destructive",
      });
      setIsUploading(false);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            "hover:border-primary hover:bg-primary/5",
            isDragging && "border-primary bg-primary/10"
          )}
        >
          <Upload className={cn(
            "w-10 h-10 mx-auto mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm font-medium">
            Arraste um arquivo ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo {maxSizeMB}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <File className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!isUploading && (
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="w-4 h-4" />
              </Button>
            )}
            {progress === 100 && (
              <CheckCircle className="w-5 h-5 text-financial-positive" />
            )}
          </div>

          {isUploading && (
            <Progress value={progress} className="h-2" />
          )}

          {!isUploading && progress !== 100 && (
            <Button onClick={uploadFile} className="w-full bg-god-gold text-god-gold-dark hover:bg-god-gold-glow">
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
