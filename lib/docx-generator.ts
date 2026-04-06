/**
 * Client-side .docx generator using the `docx` npm package.
 * Uses the browser's built-in DOMParser to convert HTML content to Word paragraphs
 * with proper Heading 1 / Heading 2 / Heading 3 styles.
 *
 * Also exports shared download helpers used by ContentGenerator and ReportsManager.
 */
import { slugify } from '@/lib/utils';
import { ContentVersion } from '@/types';

export interface DocxMetadata {
  clientName: string;
  keyword: string;
  version: string;
  date: string;
}

export async function generateDocxBlob(htmlContent: string, metadata: DocxMetadata): Promise<Blob> {
  const docxModule = await import('docx');
  const { Document, Paragraph, HeadingLevel, TextRun, Packer } = docxModule;

  const { clientName, keyword, version, date } = metadata;

  // Metadata row at top of document
  const metaParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Client: ', bold: true }),
      new TextRun({ text: clientName }),
      new TextRun({ text: '   |   Keyword: ', bold: true }),
      new TextRun({ text: keyword }),
      new TextRun({ text: '   |   Version: ', bold: true }),
      new TextRun({ text: version }),
      new TextRun({ text: '   |   Generated: ', bold: true }),
      new TextRun({ text: date }),
    ],
  });

  const spacer = new Paragraph({ text: '' });

  // Use a plain array — typed as unknown[] to avoid dynamic import type issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentParagraphs: any[] = [];

  // Parse HTML using browser DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  function getText(el: Element): string {
    return (el.textContent || '').trim();
  }

  function processElement(el: Element): void {
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.children);

    switch (tag) {
      case 'h1': {
        const text = getText(el);
        if (text) contentParagraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
        break;
      }
      case 'h2': {
        const text = getText(el);
        if (text) contentParagraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
        break;
      }
      case 'h3': {
        const text = getText(el);
        if (text) contentParagraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
        break;
      }
      case 'p': {
        const text = getText(el);
        if (text) contentParagraphs.push(new Paragraph({ children: [new TextRun(text)] }));
        break;
      }
      case 'ul':
      case 'ol': {
        children.forEach(child => {
          if (child.tagName.toLowerCase() === 'li') {
            const text = getText(child);
            if (text) contentParagraphs.push(new Paragraph({ text, bullet: { level: 0 } }));
          }
        });
        break;
      }
      case 'li': {
        // li encountered outside a ul/ol context
        const text = getText(el);
        if (text) contentParagraphs.push(new Paragraph({ text, bullet: { level: 0 } }));
        break;
      }
      case 'div':
      case 'section':
      case 'article': {
        children.forEach(child => processElement(child as Element));
        break;
      }
      default: {
        if (children.length > 0) {
          children.forEach(child => processElement(child as Element));
        } else {
          const text = getText(el);
          if (text) contentParagraphs.push(new Paragraph({ children: [new TextRun(text)] }));
        }
      }
    }
  }

  Array.from(doc.body.children).forEach(child => processElement(child as Element));

  // Fallback if no structured content was extracted
  if (contentParagraphs.length === 0) {
    const plainText = (doc.body.textContent || '').trim();
    if (plainText) {
      contentParagraphs.push(new Paragraph({ children: [new TextRun(plainText)] }));
    }
  }

  const docxDocument = new Document({
    sections: [
      {
        properties: {},
        children: [metaParagraph, spacer, ...contentParagraphs],
      },
    ],
  });

  return Packer.toBlob(docxDocument);
}

export async function triggerDocxDownload(
  content: string,
  metadata: DocxMetadata,
  fileSlug: string,
): Promise<void> {
  const slug = slugify(metadata.keyword);
  const filename = `${slug}_${fileSlug}.docx`;
  const blob = await generateDocxBlob(content, metadata);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAllAsZip(
  versions: ContentVersion[],
  keyword: string,
  clientName: string,
  date: string,
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const slug = slugify(keyword);

  for (const v of versions) {
    const blob = await generateDocxBlob(v.content, { clientName, keyword, version: v.label, date });
    const arrayBuffer = await blob.arrayBuffer();
    zip.file(`${slug}_${v.fileSlug}.docx`, arrayBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}_package.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
