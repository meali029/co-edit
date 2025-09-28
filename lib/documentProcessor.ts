import mammoth from 'mammoth';
import fs from 'fs';

export interface DocumentProcessingResult {
  content: string;
  title?: string;
  isEditable: boolean;
}

export class DocumentProcessor {
  static async processDocument(
    filePath: string, 
    fileType: string, 
    originalName: string
  ): Promise<DocumentProcessingResult> {
    switch (fileType.toLowerCase()) {
      case 'docx':
        return this.processDocx(filePath, originalName);
      case 'pdf':
        return this.processPdf(filePath, originalName);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static async processDocx(
    filePath: string, 
    originalName: string
  ): Promise<DocumentProcessingResult> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({ buffer });

      return {
        content: result.value,
        title: this.extractTitleFromName(originalName),
        isEditable: true,
      };
    } catch (error) {
      console.error('Error processing DOCX:', error);
      throw new Error('Failed to process DOCX file');
    }
  }

  private static async processPdf(
    filePath: string, 
    originalName: string
  ): Promise<DocumentProcessingResult> {
    try {
      // Dynamic import to avoid module resolution issues
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);

      // Convert plain text to HTML with line breaks
      const htmlContent = pdfData.text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => `<p>${this.escapeHtml(line)}</p>`)
        .join('\n');

      return {
        content: htmlContent || '<p>No text content found in PDF</p>',
        title: this.extractTitleFromName(originalName),
        isEditable: false, // PDFs are read-only for now
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  private static extractTitleFromName(fileName: string): string {
    // Remove file extension and clean up the name
    return fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  static async generateDocx(htmlContent: string, title: string): Promise<Buffer> {
    try {
      // Use dynamic import for better compatibility
      const htmlDocx = await import('html-docx-js');
      
      // Create a basic HTML document with the title
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
      
      const converted = htmlDocx.default.asBlob(fullHtml);
      return Buffer.from(converted);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw new Error('Failed to generate DOCX file');
    }
  }

  static generatePdf(htmlContent: string): Buffer {
    // This is a placeholder implementation
    // In a real application, you would use a library like puppeteer or jsPDF
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    return Buffer.from(plainText, 'utf-8');
  }
}