"use client";

import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ProcessingViewProps {
  message: string;
  imagePreviewUrl: string | null;
}

export default function ProcessingView({ message, imagePreviewUrl }: ProcessingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4">
      {imagePreviewUrl && (
        <div className="mb-4">
           <Image 
            src={imagePreviewUrl} 
            alt="Processing image" 
            width={300}
            height={200}
            className="rounded-lg max-h-60 w-auto mx-auto shadow-md object-contain"
            data-ai-hint="processing image"
          />
        </div>
      )}
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">Please wait while we analyze your image...</p>
    </div>
  );
}
