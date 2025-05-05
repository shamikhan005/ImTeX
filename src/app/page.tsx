'use client';

import { Suspense } from 'react';
import ImageUploader from './components/ImageUploader';

export default function Home() {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-5 pt-6">
        <h1 className="text-3xl font-bold">Convert Images to LaTeX</h1>
        <p className="text-gray-600">
          Upload an image containing mathematical equations, tables, or text, 
          and get LaTeX code that you can use in your documents.
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-custom p-6">
        <Suspense fallback={<div className="text-center py-8">Loading image uploader...</div>}>
          <ImageUploader />
        </Suspense>
      </div>
      
      <div className="max-w-3xl mx-auto pt-6">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-custom">
            <div className="font-bold text-lg mb-2">1. Upload</div>
            <p className="text-gray-600">Upload an image</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-custom">
            <div className="font-bold text-lg mb-2">2. Process</div>
            <p className="text-gray-600">Image → OCR (Mistral) → Markdown → LaTeX (Gemini/Pandoc)</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-custom">
            <div className="font-bold text-lg mb-2">3. Download</div>
            <p className="text-gray-600">Get the LaTeX code</p>
          </div>
        </div>
      </div>
    </div>
  );
}
