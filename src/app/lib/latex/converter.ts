import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function convertMarkdownToLatex(markdown: string): Promise<string> {
  const tempFilePath = join(tmpdir(), `temp_markdown_${Date.now()}.md`);

  try {
    await writeFile(tempFilePath, markdown);

    return new Promise((resolve, reject) => {
      const command = `pandoc ${tempFilePath} -f markdown -t latex`;

      exec(command, async (error, stdout, stderr) => {
        await unlink(tempFilePath).catch(console.error);

        if (error) {
          console.error('Pandoc conversion error:', error);
          reject('Failed to convert Markdown to LaTeX');
        }
        if (stderr) {
          console.warn('Pandoc stderr:', stderr);
        }

        resolve(`\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\begin{document}
${stdout}
\\end{document}`);
      });
    });
  } catch (error) {
    console.error('Error writing temp markdown file:', error);
    return '\\documentclass{article}\\begin{document}Conversion failed\\end{document}';
  }
}