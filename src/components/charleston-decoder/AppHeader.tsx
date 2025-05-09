"use client";
import { ScanLine } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex items-center justify-center w-full mb-6 md:mb-10">
      <ScanLine className="w-10 h-10 md:w-12 md:h-12 mr-3 text-primary" />
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
        Charleston Decoder
      </h1>
    </header>
  );
}
