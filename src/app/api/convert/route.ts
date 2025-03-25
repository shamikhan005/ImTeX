import { NextResponse } from "next/server";
import { uploadLocalFiletoCloudinary } from "@/app/lib/cloudinary/uploadImage";
import { processMistralOCR } from "@/app/lib/mistral/client";

const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MISTRAL_API_KEY',
  'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Some functionality may not work.`);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images accepted" },
        { status: 415 }
      );
    }

    const documentTypeHint = formData.get("documentType") as string || "auto";

    console.log("Uploading image to Cloudinary...");
    const imageUrl = await uploadLocalFiletoCloudinary(file);

    console.log("Processing with Mistral OCR...");
    const result = await processMistralOCR(imageUrl, documentTypeHint);

    return NextResponse.json({
      latexDocument: result.latexDocument,
      structureMetadata: result.structureMetadata,
      confidence: result.confidence,
      documentType: determineDocumentType(result.structureMetadata),
      processingDetails: {
        imageUrl: imageUrl,
        documentTypeHint: documentTypeHint,
        processingTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("OCR processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}

function determineDocumentType(structureMetadata: any): string {
  if (!structureMetadata) return "unknown";

  if (
    structureMetadata.layout === "complex" &&
    structureMetadata.hasLists &&
    !structureMetadata.hasEquations
  ) {
    return "resume";
  }

  if (structureMetadata.hasEquations) {
    return "equation";
  }

  if (structureMetadata.hasTables && !structureMetadata.hasEquations) {
    return "table";
  }

  return "general";
}
