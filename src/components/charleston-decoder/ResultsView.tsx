
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, FileText, Binary, DollarSign, Percent, Info } from 'lucide-react';
import Image from 'next/image';

interface ResultsViewProps {
  imagePreviewUrl: string | null;
  extractedText: string | null;
  numericalCode: string | null;
  originalPrice: number | null;
  calculatedPrice: number | null;
  statusMessage: string | null;
}

const ResultItem: React.FC<{ icon: React.ElementType, title: string, value: string | number | null | undefined, unit?: string, highlight?: boolean }> = ({ icon: Icon, title, value, unit, highlight }) => (
  <div className={`flex items-start space-x-3 p-3 rounded-md ${highlight ? 'bg-accent text-accent-foreground shadow-lg' : 'bg-secondary/50'}`}>
    <Icon className={`w-6 h-6 mt-1 ${highlight ? 'text-accent-foreground' : 'text-primary'}`} />
    <div>
      <p className={`text-sm font-medium ${highlight ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>{title}</p>
      {value !== null && value !== undefined ? (
        <p className={`text-lg font-semibold ${highlight ? 'text-accent-foreground' : 'text-foreground'}`}>
          {typeof value === 'number' ? value.toFixed(2) : value} {unit}
        </p>
      ) : (
        <p className={`text-lg italic ${highlight ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>Not available</p>
      )}
    </div>
  </div>
);


export default function ResultsView({
  imagePreviewUrl,
  extractedText,
  numericalCode,
  originalPrice,
  calculatedPrice,
  statusMessage,
}: ResultsViewProps) {

  const displayExtractedText = extractedText && extractedText.trim() !== "" ? extractedText : "No text relevant for mapping was extracted.";
  const displayNumericalCode = numericalCode && numericalCode.trim() !== "" ? numericalCode : "No code generated.";

  return (
    <div className="space-y-6">
      {statusMessage && (
        <Alert variant={originalPrice !== null ? "default" : "default"} className="bg-primary/10 border-primary/30">
          {originalPrice !== null ? <CheckCircle className="h-5 w-5 text-primary" /> : <Info className="h-5 w-5 text-primary" /> }
          <AlertTitle className="font-semibold text-primary">{originalPrice !== null ? "Success" : "Information"}</AlertTitle>
          <AlertDescription className="text-primary/80">{statusMessage}</AlertDescription>
        </Alert>
      )}

      {imagePreviewUrl && (
        <div className="p-4 border border-border rounded-lg shadow-sm bg-card">
          <h3 className="text-lg font-medium mb-3 text-center text-primary">Processed Image</h3>
          <div className="flex justify-center">
            <Image 
              src={imagePreviewUrl} 
              alt="Processed preview" 
              width={400}
              height={300}
              className="rounded-md max-h-80 w-auto object-contain shadow-md"
              data-ai-hint="processed image"
            />
          </div>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Decoding Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResultItem icon={FileText} title="Extracted Text" value={displayExtractedText} />
          <ResultItem icon={Binary} title="Numerical Code" value={displayNumericalCode} />
          {originalPrice !== null && (
            <>
              <ResultItem icon={DollarSign} title="Cost Price" value={originalPrice} unit="USD" />
              <ResultItem icon={Percent} title="Price with 10% Increase" value={calculatedPrice} unit="USD" highlight={true} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

