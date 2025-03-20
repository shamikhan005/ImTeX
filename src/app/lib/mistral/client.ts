interface StructuredLatexResult {
  latexDocument: string,
  structureMetadata: Record<string, any>;
  confidence: number;
}

export async function processMistralOCR(image: File): Promise<StructuredLatexResult> {
  try {
    const base64Image = await fileToBase64(image);

    const response = await fetch('https://api.mistral.ai/v1/ocr/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: "base64",
          content: base64Image,
          mime_type: image.type
        },
        options: {
          include_image_base64: false,
          markdown_compatible: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`mistral OCR error [${errorData.code}]: ${errorData.message}`);
    }

    const result = await response.json();
    const markdownContent = result.pages[0]?.markdown || '';
    const structureMetadata = result.pages[0]?.structure || {};

    return {
      latexDocument: convertMarkdownToLatex(markdownContent),
      structureMetadata,
      confidence: result.pages[0]?.confidence || 0
    };

  } catch (error) {
    console.error('mistral OCR processing failed:', error);
    throw new Error('failed to process document structure');
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64')
}

