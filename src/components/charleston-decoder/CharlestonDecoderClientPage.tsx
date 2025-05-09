"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { extractText, type ExtractTextInput } from '@/ai/flows/ocr-text-extraction';
import { mapLetters, type LetterMappingInput } from '@/ai/flows/letter-mapping';
import ImageUploadForm from './ImageUploadForm';
import ProcessingView from './ProcessingView';
import ResultsView from './ResultsView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type AppStatus = 'idle' | 'processing' | 'results' | 'error' | 'no_mapping_possible';

interface AppState {
  status: AppStatus;
  imagePreviewUrl: string | null;
  imageFile: File | null;
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
      ...initialState, // Reset other fields
      status: 'idle',
      imageFile: file,
      imagePreviewUrl: previewUrl,
    });
  };

  const processImage = useCallback(async () => {
    if (!state.imageFile || !state.imagePreviewUrl) return;

    setState(prevState => ({ ...prevState, status: 'processing', message: 'Reading image data...' }));

    try {
      const reader = new FileReader();
      reader.readAsDataURL(state.imageFile);
      reader.onload = async (event) => {
        const photoDataUri = event.target?.result as string;
        if (!photoDataUri) {
          setState({ status: 'error', message: 'Failed to read image file.', imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, extractedText: null, numericalCode: null, originalPrice: null, calculatedPrice: null });
          return;
        }

        setState(prevState => ({ ...prevState, message: 'Extracting text from image...' }));
        const extractInput: ExtractTextInput = { photoDataUri };
        const ocrResult = await extractText(extractInput);
        
        if (!ocrResult || !ocrResult.extractedText) {
           setState({ status: 'no_mapping_possible', extractedText: ocrResult?.extractedText || "", message: 'No text could be extracted from the image, or extracted text was empty.', imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, numericalCode: null, originalPrice: null, calculatedPrice: null });
          return;
        }
        const extractedTextValue = ocrResult.extractedText;
        setState(prevState => ({ ...prevState, extractedText: extractedTextValue, message: 'Mapping letters to code...' }));

        const letterMappingInput: LetterMappingInput = { extractedText: extractedTextValue };
        const mappingResult = await mapLetters(letterMappingInput);

        if (!mappingResult.shouldMap || !mappingResult.numericalCode) {
          setState({ status: 'no_mapping_possible', extractedText: extractedTextValue, numericalCode: mappingResult.numericalCode, message: mappingResult.shouldMap ? 'Extracted text was mapped to an empty code.' : 'Text not suitable for Charleston mapping.', imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, originalPrice: null, calculatedPrice: null });
          return;
        }
        
        const numericalCodeValue = mappingResult.numericalCode;
        setState(prevState => ({ ...prevState, numericalCode: numericalCodeValue, message: 'Calculating price...' }));

        const originalPriceValue = convertCodeToPrice(numericalCodeValue);
        if (originalPriceValue === null) {
          setState({ status: 'error', extractedText: extractedTextValue, numericalCode: numericalCodeValue, message: `Generated code "${numericalCodeValue}" could not be converted to a price.`, imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, originalPrice: null, calculatedPrice: null });
          return;
        }

        const calculatedPriceValue = originalPriceValue * 1.10;

        setState({
          status: 'results',
          imagePreviewUrl: state.imagePreviewUrl,
          imageFile: state.imageFile,
          extractedText: extractedTextValue,
          numericalCode: numericalCodeValue,
          originalPrice: originalPriceValue,
          calculatedPrice: calculatedPriceValue,
          message: 'Decoding successful!',
        });
      };
      reader.onerror = () => {
        setState({ status: 'error', message: 'Error reading file.', imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, extractedText: null, numericalCode: null, originalPrice: null, calculatedPrice: null });
      };
    } catch (error) {
      console.error("Processing error:", error);
      setState({ status: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred during processing.', imagePreviewUrl: state.imagePreviewUrl, imageFile: state.imageFile, extractedText: state.extractedText, numericalCode: state.numericalCode, originalPrice: null, calculatedPrice: null });
    }
  }, [state.imageFile, state.imagePreviewUrl, state.extractedText, state.numericalCode]);

  const handleReset = () => {
    setState(initialState);
  };

  return (
    <>
      <CardContent className="p-6 md:p-8 space-y-6">
        {state.status === 'idle' && (
          <ImageUploadForm onImageSelect={handleImageSelect} disabled={false} imagePreviewUrl={state.imagePreviewUrl} />
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
              <div className="mb-4">
                <img src={state.imagePreviewUrl} alt="Uploaded preview" className="rounded-lg max-h-60 w-auto mx-auto shadow-md" data-ai-hint="uploaded image" />
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
        {state.status !== 'processing' && state.status !== 'idle' && (
          <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
            Decode Another Image
          </Button>
        )}
        {state.status === 'idle' && state.imageFile && (
          <Button onClick={processImage} className="w-full sm:w-auto" disabled={state.status === 'processing'}>
            Process Image
          </Button>
        )}
      </CardFooter>
    </>
  );
}
