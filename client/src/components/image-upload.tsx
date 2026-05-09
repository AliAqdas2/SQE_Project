import { useState, useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  endpoint?: string;
}

export function ImageUpload({ value, onChange, label = "Upload Image", endpoint = "/api/campaigns/upload-image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const inputId = useId();

  // Sync preview with value prop changes (for loading existing campaigns)
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onChange(data.url);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreview(undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium block">{label}</label>
        <p className="text-xs text-muted-foreground">
          Upload an image (max 5MB). Supported formats: JPG, PNG, GIF
        </p>
      </div>
      
      {preview ? (
        <div className="space-y-4">
          <div className="relative w-full rounded-lg overflow-hidden border bg-muted/20">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-image-file"
              id={inputId}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-replace-image"
            >
              <Upload className="mr-2 h-4 w-4" />
              Replace Image
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              data-testid="button-remove-image"
            >
              <X className="mr-2 h-4 w-4" />
              Remove Image
            </Button>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 animate-spin" />
              <span>Uploading image...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">No image uploaded</p>
              <p className="text-xs text-muted-foreground">Click the button below to select an image</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-image-file"
              id={inputId}
            />
            <Button
              type="button"
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-upload-image"
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
