"use client";

import type React from 'react';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadFormProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  disabled: boolean;
  imagePreviewUrl: string | null;
}

export default function ImageUploadForm({ onImageSelect, disabled, imagePreviewUrl: initialPreviewUrl }: ImageUploadFormProps) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(previewUrl);
      setFileName(file.name);
      onImageSelect(file, previewUrl);
    }
  }, [onImageSelect]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary mb-2">Upload Your Image</h2>
        <p className="text-muted-foreground">
          Select an image file containing text to decode.
        </p>
      </div>
      
      <div className="grid w-full items-center gap-2.5 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors duration-300 bg-secondary/30">
        <Label htmlFor="picture" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground hover:text-primary">
            <UploadCloud className="w-12 h-12" />
            <span className="font-medium">{fileName || "Click or drag to upload image"}</span>
            <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
          </div>
        </Label>
        <Input 
          id="picture" 
          type="file" 
          className="sr-only" 
          onChange={handleFileChange} 
          accept="image/png, image/jpeg, image/gif" 
          disabled={disabled} 
        />
      </div>

      {localPreviewUrl && (
        <div className="mt-6 p-4 border border-border rounded-lg shadow-sm bg-card">
          <h3 className="text-lg font-medium mb-3 text-center text-primary">Image Preview</h3>
          <div className="flex justify-center">
            <Image 
              src={localPreviewUrl} 
              alt="Selected preview" 
              width={400}
              height={300}
              className="rounded-md max-h-80 w-auto object-contain shadow-md" 
              data-ai-hint="uploaded image preview"
            />
          </div>
        </div>
      )}
      {!localPreviewUrl && (
         <div className="mt-6 p-4 border border-border rounded-lg shadow-sm bg-card flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
            <ImageIcon className="w-16 h-16 mb-2" />
            <p>No image selected</p>
         </div>
      )}
    </div>
  );
}
