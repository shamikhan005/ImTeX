function convertMarkdownToLatex(md: string): string {
  const preamble = `\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{listings}
\\usepackage{multirow}
\\usepackage[utf8]{inputenc}

\\title{Converted Document}
\\author{Markdown Converter}
\\date{\\today}

\\begin{document}
\\maketitle
`;
  let latex = preamble;
  const listStack: { type: 'itemize' | 'enumerate', indent: number }[] = [];
  let inCodeBlock = false;
  let inQuote = false;
  let tableSpec = '';
  let tableRows: string[][] = [];
  let currentCodeLang = 'text';

  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%$#_{}~^])/g, '\\$1')
      .replace(/\u00A0/g, '~')
      .replace(/\u2013/g, '--')
      .replace(/\u2014/g, '---')
      .replace(/«/g, '\\guillemotleft{}')
      .replace(/»/g, '\\guillemotright{}');
  };

  const closeListEnvironments = (targetDepth: number) => {
    while (listStack.length > targetDepth) {
      const env = listStack.pop()!;
      latex += `\\end{${env.type}}\n`;
    }
  };

  const processTable = () => {
    if (tableRows.length === 0 || !tableSpec) return;
    latex += `\\begin{tabular}{${tableSpec}}\n\\toprule\n`;
    tableRows.forEach((row, idx) => {
      latex += row.join(' & ') + ' \\\\';
      if (idx === 0 && tableRows.length > 1) {
        latex += ' \\midrule';
      } else if (idx < tableRows.length - 1) {
        latex += ' \\hline';
      }
      latex += '\n';
    });
    latex += '\\bottomrule\n\\end{tabular}\n';
    tableRows = [];
    tableSpec = '';
  };

  const lines = md.split('\n');
  let prevLineEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\s+$/, ''); 

    if (line === '' && (inCodeBlock || tableRows.length > 0)) continue;

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        latex += '\\end{lstlisting}\n';
        inCodeBlock = false;
      } else {
        currentCodeLang = line.slice(3).trim() || 'text';
        latex += `\\begin{lstlisting}[language=${escapeLatex(currentCodeLang)}]\n`;
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      latex += line + '\n';
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      const level = Math.min(headerMatch[1].length, 6);
      const headerTypes = ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'subparagraph'];
      const title = escapeLatex(headerMatch[2]);
      latex += `\\${headerTypes[level - 1]}{${title}}\n`;
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      const [, whitespace, marker, content] = listMatch;
      const indent = whitespace.length;
      const isOrdered = /^\d+\.$/.test(marker);
      const itemText = escapeLatex(content);

      const depth = Math.floor(indent / 2);
      closeListEnvironments(depth);

      while (listStack.length < depth) {
        const newType = isOrdered ? 'enumerate' : 'itemize';
        latex += `\\begin{${newType}}\n`;
        listStack.push({ type: newType, indent });
      }

      latex += `\\item ${itemText}\n`;
      continue;
    }

    if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim());
      if (cells.length < 2) continue;

      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableSpec = cells.slice(1, -1).map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'c';
          if (c.endsWith(':')) return 'r';
          return 'l';
        }).join('');
        continue;
      }

      tableRows.push(cells.slice(1, -1).map(cell => escapeLatex(cell)));

      if (i === lines.length - 1 || !lines[i + 1].includes('|')) {
        processTable();
      }
      continue;
    }

    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      const altText = escapeLatex(imageMatch[1]);
      const path = escapeLatex(imageMatch[2]);
      latex += `\\begin{figure}[ht]\n  \\centering\n  \\includegraphics[width=0.8\\textwidth]{${path}}\n  \\caption{${altText}}\n  \\label{fig:${path.replace(/\W/g, '_')}}\n\\end{figure}\n`;
      continue;
    }

    if (line.startsWith('>')) {
      if (!inQuote) {
        latex += '\\begin{quote}\n';
        inQuote = true;
      }
      latex += escapeLatex(line.slice(1).trim()) + '\n';
      if (i === lines.length - 1 || !lines[i + 1].startsWith('>')) {
        latex += '\\end{quote}\n';
        inQuote = false;
      }
      continue;
    }

    const equationMatch = line.match(/^\$\$(.*?)\$\$$/);
    if (equationMatch) {
      const equationContent = equationMatch[1].trim();
      latex += `\\begin{equation}\n${equationContent}\n\\end{equation}\n`;
      continue;
    }

    line = line.replace(/\[(.*?)\]\((.*?)\)/g, '\\href{$2}{$1}');
    line = line.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
    line = line.replace(/\*(.+?)\*/g, '\\textit{$1}');
    line = line.replace(/`(.+?)`/g, '\\texttt{$1}');

    if (line.trim() === '') {
      if (!prevLineEmpty) {
        latex += '\n\\par\n';
      }
      prevLineEmpty = true;
    } else {
      latex += escapeLatex(line) + '\n';
      prevLineEmpty = false;
    }
  }

  processTable();
  closeListEnvironments(0);
  if (inQuote) {
    latex += '\\end{quote}\n';
  }

  latex += '\\end{document}';
  return latex;
}
