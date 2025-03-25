import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function convertMarkdownToLatex(
  markdown: string,
  structureMetadata: DocumentStructure = { hasTables: false, hasEquations: false, hasLists: false }
): Promise<string> {
  try {
    if (structureMetadata.documentType === 'resume') {
      const latexContent = await convertWithGemini(markdown, 'resume');
      return enhanceResumeLatex(latexContent);
    }

    if (structureMetadata.hasEquations) {
      return await convertWithGemini(markdown, 'equation');
    }

    if (structureMetadata.hasTables) {
      return await convertWithGemini(markdown, 'table');
    }

    let enhancedMarkdown = markdown;

    if (structureMetadata.hasTables) {
      enhancedMarkdown = enhanceMarkdownTables(enhancedMarkdown);
    }

    if (structureMetadata.hasEquations) {
      enhancedMarkdown = enhanceMarkdownEquations(enhancedMarkdown);
    }

    try {
      const latexContent = await convertWithPandoc(enhancedMarkdown);
      return generateLatexDocument(latexContent, structureMetadata);
    } catch (pandocError) {
      console.log('Pandoc conversion failed, falling back to Gemini AI:', pandocError);
      const latexContent = await convertWithGemini(enhancedMarkdown, 'general');
      return generateLatexDocument(latexContent, structureMetadata);
    }
  } catch (error) {
    console.error('Error in LaTeX conversion:', error);
    return '\\documentclass{article}\\begin{document}Conversion failed\\end{document}';
  }
}

async function convertWithGemini(markdown: string, documentType: string): Promise<string> {
  try {
    console.log(`Converting ${documentType} with Gemini AI...`);

    const prompt = createGeminiPrompt(markdown, documentType);

    const generationConfig = {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8000,
    };

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig,
      });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are a LaTeX expert. You will be converting markdown to LaTeX with perfect formatting and structure." }],
          },
          {
            role: "model",
            parts: [{ text: "I'll convert markdown to LaTeX with precise formatting, following best practices for document structure, mathematical notation, tables, and typography. I'll ensure the output is clean, compilable, and professionally formatted." }],
          },
        ],
      });

      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();

      const latexContent = extractLatexFromResponse(responseText);

      console.log('Gemini 2.0 Flash conversion successful');
      return latexContent;
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback model:', primaryError);

      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig,
      });

      const fallbackResult = await fallbackModel.generateContent(prompt);
      const fallbackResponse = await fallbackResult.response;
      const fallbackResponseText = fallbackResponse.text();

      const fallbackLatexContent = extractLatexFromResponse(fallbackResponseText);

      console.log('Fallback model conversion successful');
      return fallbackLatexContent;
    }
  } catch (error) {
    console.error('Error in Gemini AI conversion:', error);
    throw new Error('Failed to convert with Gemini AI');
  }
}

function createGeminiPrompt(markdown: string, documentType: string): string {
  let prompt = '';

  if (documentType === 'resume') {
    prompt = `
    I need you to convert the following resume markdown to professional LaTeX code.
    
    REQUIREMENTS:
    1. Use a modern, professional layout with clean typography
    2. Format section headers with blue color and horizontal rules
    3. Use bold for company/organization names and job titles
    4. Use italics for dates
    5. Format bullet points with proper indentation
    6. Include hyperlinks for email and websites
    7. Format skills and technologies appropriately
    8. Remove page numbers
    9. Use appropriate spacing between sections
    10. Ensure consistent alignment throughout the document
    
    IMPORTANT: Return ONLY the complete LaTeX code without any explanation or markdown formatting.
    
    Here's the markdown content to convert:
    
    ${markdown}
    `;
  } else if (documentType === 'equation') {
    prompt = `
    I need you to convert the following markdown with mathematical equations to LaTeX code.
    
    REQUIREMENTS:
    1. Ensure all equations are properly formatted with the correct math environments
    2. Use amsmath and other necessary packages
    3. Maintain proper alignment in multi-line equations
    4. Use the appropriate environment for each equation type (inline, display, aligned, etc.)
    5. Ensure proper spacing around operators
    6. Use proper mathematical notation and symbols
    
    IMPORTANT: Return ONLY the complete LaTeX code without any explanation or markdown formatting.
    
    Here's the markdown content to convert:
    
    ${markdown}
    `;
  } else if (documentType === 'table') {
    prompt = `
    I need you to convert the following markdown with tables to LaTeX code.
    
    REQUIREMENTS:
    1. Use proper table environments like tabular, booktabs, etc.
    2. Ensure tables are well-formatted with appropriate column alignment
    3. Add proper spacing between rows and columns
    4. Use horizontal rules appropriately (\\toprule, \\midrule, \\bottomrule)
    5. Handle multi-row and multi-column cells if present
    6. Ensure consistent formatting across all tables
    7. Add captions if appropriate
    
    IMPORTANT: Return ONLY the complete LaTeX code without any explanation or markdown formatting.
    
    Here's the markdown content to convert:
    
    ${markdown}
    `;
  } else {
    prompt = `
    I need you to convert the following markdown to LaTeX code.
    
    REQUIREMENTS:
    1. Use appropriate LaTeX environments and formatting
    2. Ensure proper document structure
    3. Format headings, lists, and paragraphs appropriately
    4. Include necessary packages
    5. Maintain proper spacing and indentation
    
    IMPORTANT: Return ONLY the complete LaTeX code without any explanation or markdown formatting.
    
    Here's the markdown content to convert:
    
    ${markdown}
    `;
  }

  return prompt;
}

function extractLatexFromResponse(response: string): string {
  const codeBlockRegex = /```(?:latex)?\n([\s\S]*?)\n```/;
  const codeBlockMatch = response.match(codeBlockRegex);

  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  if (response.trim().startsWith('\\documentclass')) {
    return response.trim();
  }

  return response.trim();
}

function enhanceResumeLatex(latex: string): string {
  let enhanced = cleanupResumeLatex(latex);

  if (!enhanced.includes('\\begin{document}')) {
    enhanced = applyResumeTemplate(enhanced);
  } else {
    const contentMatch = enhanced.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/);
    if (contentMatch && contentMatch[1]) {
      enhanced = applyResumeTemplate(contentMatch[1]);
    }
  }

  return enhanced;
}

function applyResumeTemplate(content: string): string {
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{fontawesome5}

% Resume styling
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\titleformat{\\section}{\\Large\\bfseries}{}{0em}{\\color{blue}}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{8pt}
\\setlist[itemize]{leftmargin=*,nosep,topsep=0pt}
\\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}

\\begin{document}

${content}

\\end{document}`;
}

function cleanupResumeLatex(latex: string): string {
  let cleaned = latex;

  cleaned = cleaned.replace(/^[\s\S]*?(\\documentclass|\\section|\\begin\{center\})/m, '$1');

  const unwantedCommands = [
    'unicodehypercref', 'hyphenurl', 'article', 'xcolor', 'amsmath',
    'amssymb', 'iftex', 'T1', 'fontenc', 'utf8', 'inputenc', 'textcomp',
    'lmodern', 'npquote', 'microtype', 'protrusion', 'basicmath',
    'parskip', 'bookmark', 'xurl'
  ];

  for (const cmd of unwantedCommands) {
    cleaned = cleaned.replace(new RegExp(`\\\\${cmd}[^\n]*`, 'g'), '');
  }

  cleaned = cleaned
    .replace(/C\+\+/g, 'C{\\texttt{++}}')
    .replace(/\\begin\{itemize\}\s*\\item/g, '\\begin{itemize}\n  \\item')
    .replace(/\\item\s*\\end\{itemize\}/g, '\\item\n\\end{itemize}')
    .replace(/\\section\{([^}]+)\}\s*/g, '\\section{$1}\n');

  return cleaned;
}

async function convertWithPandoc(markdown: string): Promise<string> {
  const tempFilePath = join(tmpdir(), `temp_markdown_${Date.now()}.md`);

  try {
    await writeFile(tempFilePath, markdown);

    return new Promise((resolve, reject) => {
      const command = `pandoc ${tempFilePath} -f markdown -t latex --standalone`;

      exec(command, async (error, stdout, stderr) => {
        try {
          await unlink(tempFilePath).catch(console.error);
        } catch (unlinkError) {
          console.warn('Failed to delete temp file:', unlinkError);
        }

        if (error) {
          console.error('Pandoc conversion error:', error);
          return reject('Failed to convert Markdown to LaTeX');
        }
        
        if (stderr) {
          console.warn('Pandoc stderr:', stderr);
        }

        resolve(stdout);
      });
    });
  } catch (error) {
    console.error('Error in Pandoc conversion process:', error);
    throw new Error('Pandoc conversion failed');
  }
}

function enhanceMarkdownTables(markdown: string): string {
  const lines = markdown.split('\n');
  let inTable = false;
  let tableStart = -1;
  const tables = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inTable && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableStart = i;
    }

    else if (inTable && (!line.trim() || !line.includes('|'))) {
      inTable = false;
      tables.push({ start: tableStart, end: i - 1 });
    }
  }

  if (inTable) {
    tables.push({ start: tableStart, end: lines.length - 1 });
  }

  for (const table of tables) {
    const hasHeaderSeparator = lines[table.start + 1]?.includes('---') || lines[table.start + 1]?.includes('===');

    if (!hasHeaderSeparator && table.end > table.start) {
      const firstRow = lines[table.start];
      const columnCount = (firstRow.match(/\|/g) || []).length - 1;

      const headerSeparator = '|' + ' --- |'.repeat(columnCount);

      lines.splice(table.start + 1, 0, headerSeparator);

      table.end++;
      for (let i = tables.indexOf(table) + 1; i < tables.length; i++) {
        tables[i].start++;
        tables[i].end++;
      }
    }
  }

  return lines.join('\n');
}

function enhanceMarkdownEquations(markdown: string): string {
  let enhanced = markdown.replace(/\$([^\$\n]+)\$/g, '$$$1$$');
  enhanced = enhanced.replace(/\$\$([^\$]+)\$\$/g, '\n\n$$\n$1\n$$\n\n');

  return enhanced;
}

function generateLatexDocument(latexContent: string, structureMetadata: DocumentStructure): string {
  const contentMatch = latexContent.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/);
  const content = contentMatch ? contentMatch[1] : latexContent;

  let documentClass = '\\documentclass{article}';

  let preamble = `${documentClass}\n`;
  preamble += '\\usepackage[utf8]{inputenc}\n';
  preamble += '\\usepackage{amsmath}\n';
  preamble += '\\usepackage{amssymb}\n';
  preamble += '\\usepackage{graphicx}\n';

  if (structureMetadata.hasTables) {
    preamble += '\\usepackage{booktabs}\n';
    preamble += '\\usepackage{tabularx}\n';
    preamble += '\\usepackage{longtable}\n';
  }

  if (structureMetadata.hasLists) {
    preamble += '\\usepackage{enumitem}\n';
  }

  if (structureMetadata.layout === 'complex' || structureMetadata.layout === 'multi-column') {
    preamble += '\\usepackage{multicol}\n';
  }

  return `${preamble}
\\begin{document}
${content}
\\end{document}`;
}