import { NextResponse } from "next/server";
import { processMistralOCR } from "@/app/lib/mistral/client";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'no image provided' },
        { status: 400 }
      );
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'invalid file type. only images accepted' },
        { status: 415 }
      );
    }

    const result = await processMistralOCR(image);

    return NextResponse.json({
      latexDocument: result.latexDocument,
      structureMetadata: result.structureMetadata,
      confidence: result.confidence
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'failed to process image' },
      { status: 500 }
    );
  }
}