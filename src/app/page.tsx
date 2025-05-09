import CharlestonDecoderClientPage from '@/components/charleston-decoder/CharlestonDecoderClientPage';
import AppHeader from '@/components/charleston-decoder/AppHeader';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 md:p-8">
      <AppHeader />
      <main className="w-full max-w-2xl mt-8">
        <Card className="shadow-2xl">
          <CharlestonDecoderClientPage />
        </Card>
      </main>
      <footer className="py-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Charleston Decoder. All rights reserved.
      </footer>
    </div>
  );
}
