import { NextResponse } from "next/server";
import { uploadLocalFiletoCloudinary } from "@/app/lib/cloudinary/uploadImage";
import { processMistralOCR } from "@/app/lib/mistral/client";

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

    const imageUrl = await uploadLocalFiletoCloudinary(file);

    const result = await processMistralOCR(imageUrl);

    return NextResponse.json({
      latexDocument: result.latexDocument,
      structureMetadata: result.structureMetadata,
      confidence: result.confidence,
    });
  } catch (error: any) {
    console.error("OCR processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
