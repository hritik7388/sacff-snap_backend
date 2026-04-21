// src/types/html-pdf-node.d.ts
declare module "html-pdf-node" {
  interface PdfOptions {
    format?: string;
    printBackground?: boolean;
    margin?: any;
  }

  interface HtmlPdfInput {
    content: string;
  }

  export function generatePdf(
    input: HtmlPdfInput,
    options?: PdfOptions
  ): Promise<Buffer>;
}
