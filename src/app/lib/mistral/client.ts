import { Mistral } from '@mistralai/mistralai';
import { convertMarkdownToLatex } from '../latex/converter';

interface StructuredLatexResult {
  latexDocument: string;
  structureMetadata: Record<string, any>;
  confidence: number;
}

interface DocumentStructure {
  hasTables: boolean;
  hasEquations: boolean;
  hasLists: boolean;
  tables?: any[];
  equations?: any[];
  lists?: any[];
  layout?: string;
  documentType?: string;
}

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

export async function processMistralOCR(
  imageUrl: string,
  documentTypeHint: string = 'auto'
): Promise<StructuredLatexResult> {
  try {
    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        imageUrl: imageUrl
      },
    });

    const markdownContent = ocrResponse.pages[0]?.markdown || '';
    const rawMetadata = ocrResponse.pages[0] ? (ocrResponse.pages[0] as any).metadata || {} : {};

    console.log('Mistral OCR Response:', JSON.stringify(ocrResponse, null, 2));

    const structureMetadata = analyzeDocumentStructure(markdownContent, rawMetadata, documentTypeHint);

    console.log('Document structure analysis:', structureMetadata);

    const latexDocument = await convertMarkdownToLatex(markdownContent, structureMetadata);

    return {
      latexDocument,
      structureMetadata,
      confidence: calculateConfidence(structureMetadata)
    };
  } catch (error: any) {
    console.error('mistral ocr processing failed:', error);
    throw new Error('failed to process document structure');
  }
}


function analyzeDocumentStructure(
  markdown: string,
  rawMetadata: any,
  documentTypeHint: string = 'auto'
): DocumentStructure {
  const structure: DocumentStructure = {
    hasTables: false,
    hasEquations: false,
    hasLists: false,
    layout: 'simple',
    documentType: documentTypeHint !== 'auto' ? documentTypeHint : undefined
  };

  const tableRegex = /\|[^\|]+\|[^\|]+\|/;
  const tableHeaderRegex = /\|\s*:?-+:?\s*\|/;
  structure.hasTables = tableRegex.test(markdown) && tableHeaderRegex.test(markdown);

  const equationRegex = /\$\$[^\$]+\$\$|\$[^\$]+\$/;
  structure.hasEquations = equationRegex.test(markdown);

  const listRegex = /^\s*[\*\-\+]\s|^\s*\d+\.\s/m;
  structure.hasLists = listRegex.test(markdown);

  if (documentTypeHint !== 'auto') {
    switch (documentTypeHint) {
      case 'table':
        if (markdown.includes('|')) {
          structure.hasTables = true;
        }
        break;
      case 'equation':
        if (markdown.includes('$') || /[a-z]\([a-z]\)/i.test(markdown)) {
          structure.hasEquations = true;
        }
        break;
      case 'resume':
        structure.layout = 'complex';
        structure.documentType = 'resume';
        break;
    }
  }

  if (rawMetadata) {
    if (rawMetadata.tables) {
      structure.tables = rawMetadata.tables;
      structure.hasTables = true;
    }

    if (rawMetadata.equations) {
      structure.equations = rawMetadata.equations;
      structure.hasEquations = true;
    }

    if (rawMetadata.layout) {
      structure.layout = rawMetadata.layout;
    }
  }

  if (!structure.documentType) {
    if (detectResumePattern(markdown)) {
      structure.documentType = 'resume';
      structure.layout = 'complex';
    }
  }

  if (!structure.layout || structure.layout === 'simple') {
    const lines = markdown.split('\n');
    let headerCount = 0;
    for (const line of lines) {
      if (line.startsWith('#')) headerCount++;
    }

    if (headerCount > 5 && lines.length < 100) {
      structure.layout = 'complex';
    }
  }

  return structure;
}

function detectResumePattern(markdown: string): boolean {
  const resumeSectionTitles = [
    'experience', 'education', 'skills', 'work experience',
    'professional experience', 'employment', 'qualifications',
    'projects', 'certifications', 'achievements', 'languages',
    'summary', 'objective', 'profile', 'contact'
  ];

  const lowerMarkdown = markdown.toLowerCase();

  let matchCount = 0;
  for (const title of resumeSectionTitles) {
    const regex = new RegExp(`#\s*${title}|^${title}:`, 'i');
    if (regex.test(lowerMarkdown)) {
      matchCount++;
    }
  }

  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(markdown);
  const hasPhone = /\(\d{3}\)\s*\d{3}[-\s]?\d{4}|\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(markdown);
  const hasLinkedIn = /linkedin\.com/.test(lowerMarkdown);

  const hasDateRanges = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*(-|–|to)\s*(present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}\b/i.test(markdown);

  return (matchCount >= 2) ||
    (matchCount >= 1 && (hasEmail || hasPhone || hasLinkedIn)) ||
    (hasDateRanges && (hasEmail || hasPhone || hasLinkedIn));
}

function calculateConfidence(structureMetadata: DocumentStructure): number {
  let confidence = 0.9;

  if (structureMetadata.hasTables) confidence -= 0.05;
  if (structureMetadata.hasEquations) confidence -= 0.02;
  if (structureMetadata.layout === 'complex' || structureMetadata.layout === 'multi-column') confidence -= 0.1;

  if (structureMetadata.documentType) confidence += 0.05;

  return Math.max(0, Math.min(1, confidence));
}