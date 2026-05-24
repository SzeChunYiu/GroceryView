declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export type TextItem = { str: string };
  export type TextMarkedContent = Record<string, unknown>;

  export type TextContent = {
    items: Array<TextItem | TextMarkedContent>;
  };

  export type PdfPage = {
    getTextContent(): Promise<TextContent>;
  };

  export type PdfDocument = {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  };

  export function getDocument(input: { data: Uint8Array }): { promise: Promise<PdfDocument> };
}
