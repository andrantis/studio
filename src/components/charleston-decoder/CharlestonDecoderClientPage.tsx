// @ts-nocheck
"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { extractText, type ExtractTextInput } from '@/ai/flows/ocr-text-extraction';
import { mapLetters, type LetterMappingInput } from '@/ai/flows/letter-mapping';
import ImageUploadForm from './ImageUploadForm';
import ProcessingView from './ProcessingView';
import ResultsView from './ResultsView';
import ImageCropper, { type CroppedImageDetails } from './ImageCropper';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import NextImage from 'next/image';


type AppStatus = 'idle' | 'cropping' | 'processing' | 'results' | 'error' | 'no_mapping_possible';

interface AppState {
  status: AppStatus;
  imagePreviewUrl: string | null; // Original or cropped image preview
  imageFile: File | null; // Original image file
  croppedImageDataUrl: string | null; // Data URL of the cropped image
  extractedText: string | null;
  numericalCode: string | null;
  originalPrice: number | null;
  calculatedPrice: number | null;
  message: string | null; // General message for status or error
}

const initialState: AppState = {
  status: 'idle',
  imagePreviewUrl: null,
  imageFile: null,
  croppedImageDataUrl: null,
  extractedText: null,
  numericalCode: null,
  originalPrice: null,
  calculatedPrice: null,
  message: null,
};

function convertCodeToPrice(code: string): number | null {
  if (!/^\d+$/.test(code) || code.length === 0) {
    return null;
  }
  let priceStr: string;
  if (code.length === 1) {
    priceStr = `0.0${code}`;
  } else if (code.length === 2) {
    priceStr = `0.${code}`;
  } else {
    priceStr = `${code.slice(0, -2)}.${code.slice(-2)}`;
  }
  const price = parseFloat(priceStr);
  return isNaN(price) ? null : price;
}

export default function CharlestonDecoderClientPage() {
  const [state, setState] = useState<AppState>(initialState);

  const handleImageSelect = (file: File, previewUrl: string) => {
    setState({
      ...initialState,
      status: 'cropping',
      imageFile: file,
      imagePreviewUrl: previewUrl, // Original full image preview
    });
  };

  const handleCropComplete = (details: CroppedImageDetails) => {
    setState(prevState => ({
      ...prevState,
      status: 'idle', 
      croppedImageDataUrl: details.dataUrl,
      imagePreviewUrl: details.previewUrl, // Update preview to show cropped image
    }));
  };

  const handleCancelCrop = () => {
    setState(initialState); 
  };

  const processCroppedImage = useCallback(async () => {
    if (!state.croppedImageDataUrl) {
      setState(prevState => ({ ...prevState, status: 'error', message: 'No cropped image to process.'}));
      return;
    }

    setState(prevState => ({ ...prevState, status: 'processing', message: 'Processing cropped image...' }));

    try {
      const photoDataUri = state.croppedImageDataUrl;

      setState(prevState => ({ ...prevState, message: 'Extracting text from image...' }));
      const extractInput: ExtractTextInput = { photoDataUri };
      const ocrResult = await extractText(extractInput);
      
      if (!ocrResult || !ocrResult.extractedText) {
         setState(prevState => ({ ...prevState, status: 'no_mapping_possible', extractedText: ocrResult?.extractedText || "", message: 'No text could be extracted from the cropped image, or extracted text was empty.', numericalCode: null, originalPrice: null, calculatedPrice: null }));
        return;
      }
      const extractedTextValue = ocrResult.extractedText;
      setState(prevState => ({ ...prevState, extractedText: extractedTextValue, message: 'Mapping letters to code...' }));

      const letterMappingInput: LetterMappingInput = { extractedText: extractedTextValue };
      const mappingResult = await mapLetters(letterMappingInput);

      if (!mappingResult.shouldMap || !mappingResult.numericalCode) {
        setState(prevState => ({ ...prevState, status: 'no_mapping_possible', extractedText: extractedTextValue, numericalCode: mappingResult.numericalCode, message: mappingResult.shouldMap ? 'Extracted text was mapped to an empty code.' : 'Text not suitable for Charleston mapping.', originalPrice: null, calculatedPrice: null }));
        return;
      }
      
      const numericalCodeValue = mappingResult.numericalCode;
      setState(prevState => ({ ...prevState, numericalCode: numericalCodeValue, message: 'Calculating price...' }));

      const originalPriceValue = convertCodeToPrice(numericalCodeValue);
      if (originalPriceValue === null) {
        setState(prevState => ({ ...prevState, status: 'error', extractedText: extractedTextValue, numericalCode: numericalCodeValue, message: `Generated code "${numericalCodeValue}" could not be converted to a price.`, originalPrice: null, calculatedPrice: null }));
        return;
      }

      const calculatedPriceValue = originalPriceValue * 1.10;

      setState(prevState => ({
        ...prevState,
        status: 'results',
        extractedText: extractedTextValue,
        numericalCode: numericalCodeValue,
        originalPrice: originalPriceValue,
        calculatedPrice: calculatedPriceValue,
        message: 'Decoding successful!',
      }));

    } catch (error) {
      console.error("Processing error:", error);
      setState(prevState => ({ ...prevState, status: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred during processing.', extractedText: state.extractedText, numericalCode: state.numericalCode, originalPrice: null, calculatedPrice: null }));
    }
  }, [state.croppedImageDataUrl, state.extractedText, state.numericalCode]);

  const handleReset = () => {
    if (state.imagePreviewUrl && state.imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.imagePreviewUrl);
    }
    if (state.croppedImageDataUrl && state.croppedImageDataUrl.startsWith('blob:')) {
         URL.revokeObjectURL(state.croppedImageDataUrl);
    }
    setState(initialState);
  };
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
        if (state.imagePreviewUrl && state.imagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(state.imagePreviewUrl);
        }
         if (state.croppedImageDataUrl && state.croppedImageDataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(state.croppedImageDataUrl);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <>
      <CardContent className="p-6 md:p-8 space-y-6">
        {state.status === 'idle' && !state.croppedImageDataUrl && (
          <ImageUploadForm onImageSelect={handleImageSelect} disabled={false} imagePreviewUrl={state.imagePreviewUrl} />
        )}

        {state.status === 'cropping' && state.imagePreviewUrl && state.imageFile && (
          <ImageCropper
            imageSrc={state.imagePreviewUrl}
            originalFile={state.imageFile}
            onCropComplete={handleCropComplete}
            onCancel={handleCancelCrop}
          />
        )}
        
        {state.status === 'idle' && state.croppedImageDataUrl && state.imagePreviewUrl && (
           <div className="space-y-4 text-center">
             <h2 className="text-xl font-semibold text-primary">Image Ready for Processing</h2>
             <div className="flex justify-center">
                <NextImage src={state.imagePreviewUrl} alt="Cropped preview" width={400} height={300} className="rounded-md max-h-80 w-auto object-contain shadow-md" data-ai-hint="cropped image preview" />
             </div>
             <p className="text-muted-foreground">Click "Process Cropped Image" to continue.</p>
           </div>
        )}

        {state.status === 'processing' && state.message && (
          <ProcessingView message={state.message} imagePreviewUrl={state.imagePreviewUrl} />
        )}

        {(state.status === 'results' || state.status === 'no_mapping_possible') && (
          <ResultsView
            imagePreviewUrl={state.imagePreviewUrl} 
            extractedText={state.extractedText}
            numericalCode={state.numericalCode}
            originalPrice={state.originalPrice}
            calculatedPrice={state.calculatedPrice}
            statusMessage={state.message}
          />
        )}
        
        {state.status === 'error' && state.message && (
           <>
            {state.imagePreviewUrl && ( 
              <div className="mb-4 flex justify-center">
                <img src={state.imagePreviewUrl} alt="Image context for error" className="rounded-lg max-h-60 w-auto shadow-md" data-ai-hint="error context image" />
              </div>
            )}
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
           </>
        )}
      </CardContent>
      
      <Separator className="my-6" />

      <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 p-6 md:p-8 pt-0">
        {(state.status === 'results' || state.status === 'no_mapping_possible' || state.status === 'error' || (state.status === 'idle' && state.croppedImageDataUrl)) && state.status !== 'processing' && state.status !== 'cropping' && (
          <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
            Start Over
          </Button>
        )}
        {state.status === 'idle' && state.croppedImageDataUrl && (
          <Button onClick={processCroppedImage} className="w-full sm:w-auto" disabled={state.status === 'processing'}>
            Process Cropped Image
          </Button>
        )}
         {/* Removed the old processImage button as cropping is now mandatory if an image is selected. */}
      </CardFooter>
    </>
  );
}
