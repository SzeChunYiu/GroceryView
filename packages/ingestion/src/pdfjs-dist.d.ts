declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export type TextContent = {
    items: Array<{ str?: unknown }>;
  };

  export type PdfPage = {
    getTextContent(): Promise<TextContent>;
  };

  export type PdfDocument = {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  };

  export function getDocument(input: { data: Uint8Array }): {
    promise: Promise<PdfDocument>;
  };
}
