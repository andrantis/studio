// @ts-nocheck
'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Utility function to draw on canvas (from react-image-crop examples)
// Ensures the canvas is created and context is available before drawing.
function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  // Clarification: translate to center of crop, then draw image.
  // The translate moves the canvas origin to where the top-left of the image should be.
  // Then draw the image at (0,0) relative to this new origin.
  // However, the react-image-crop example logic is more complex for handling rotations etc.
  // For simple cropping, it's:
  // ctx.drawImage(image, cropX, cropY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width * scaleX, crop.height * scaleY);
  // But using their full logic for robustness:

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();
}


export interface CroppedImageDetails {
  dataUrl: string;
  previewUrl: string; 
}

interface ImageCropperProps {
  imageSrc: string; 
  originalFile: File; 
  onCropComplete: (details: CroppedImageDetails) => void;
  onCancel: () => void;
}

const ASPECT_RATIO = undefined; 
const MIN_DIMENSION = 20; // Reduced minimum dimension for smaller selections

export default function ImageCropper({ imageSrc, originalFile, onCropComplete, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (isImageLoaded && imgRef.current) {
      const { width, height } = imgRef.current;
      const cropConfig = { unit: '%', width: 25 } as Crop; // Reduced initial crop width to 25%
      const newCrop = centerCrop(
        makeAspectCrop(
          cropConfig,
          ASPECT_RATIO || width / height,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(newCrop);
      // Also set an initial completedCrop to enable button if user doesn't interact
      // This is tricky as onComplete gives PixelCrop. For now, let user make first move or set initial crop explicitly.
    }
  }, [isImageLoaded]);


  function onImageLoadInternal(e: React.SyntheticEvent<HTMLImageElement>) {
    setIsImageLoaded(true);
    const { width, height } = e.currentTarget;
    const cropConfig = { unit: '%', width: 25 } as Crop; // Reduced initial crop width to 25%
     const newCrop = centerCrop(
        makeAspectCrop(
          cropConfig,
          ASPECT_RATIO || width / height,
          width,
          height,
        ),
        width,
        height,
      );
    setCrop(newCrop);
     // If you want to pre-populate completedCrop (e.g., for immediate confirm without interaction)
     // you'd need to calculate the PixelCrop equivalent or use a default PixelCrop.
     // For simplicity, let's require user interaction or a more complex initial setup.
  }


  const handleConfirmCrop = async () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return;
    }

    canvasPreview(image, canvas, completedCrop);
    
    const croppedDataUrl = canvas.toDataURL(originalFile.type);
    
    onCropComplete({ dataUrl: croppedDataUrl, previewUrl: croppedDataUrl });
  };

  return (
    <Card className="shadow-xl w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Select Area to Decode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Drag on the image to select the region containing the text or code you want to decode.
        </p>
        <div className="flex justify-center items-center max-h-[60vh] overflow-hidden border border-border rounded-md p-2 bg-secondary/20">
          {typeof window !== 'undefined' && ( // Ensure ReactCrop only renders client-side
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT_RATIO}
              minWidth={MIN_DIMENSION}
              minHeight={MIN_DIMENSION}
            >
              {/* Using standard img tag here as required by react-image-crop for the ref */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop me"
                onLoad={onImageLoadInternal}
                style={{ maxHeight: '55vh', objectFit: 'contain', width: 'auto', height: 'auto' }}
                data-ai-hint="image crop selection"
              />
            </ReactCrop>
          )}
        </div>
        <canvas
          ref={previewCanvasRef}
          style={{
            display: 'none',
            objectFit: 'contain',
            width: completedCrop?.width,
            height: completedCrop?.height,
          }}
        />
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-4">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
        <Button 
          onClick={handleConfirmCrop}
          disabled={!completedCrop || completedCrop.width < MIN_DIMENSION || completedCrop.height < MIN_DIMENSION}
          className="w-full sm:w-auto"
        >
          Confirm Selection
        </Button>
      </CardFooter>
    </Card>
  );
}

