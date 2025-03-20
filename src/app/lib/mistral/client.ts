import { Mistral } from '@mistralai/mistralai';
import { convertMarkdownToLatex } from '../latex/converter';

interface StructuredLatexResult {
  latexDocument: string;
  structureMetadata: Record<string, any>;
  confidence: number;
}

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

export async function processMistralOCR(imageUrl: string): Promise<StructuredLatexResult> {
  try {
    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        imageUrl: imageUrl
      },
    })

    const markdownContent = ocrResponse.pages[0]?.markdown || '';
    const latexDocument = await convertMarkdownToLatex(markdownContent)

    return {
      latexDocument,
      structureMetadata: {},
      confidence: 0
    }
  } catch (error: any) {
    console.error('mistral ocr processing failed:', error);
    throw new Error('failed to process document structure');
  }
}