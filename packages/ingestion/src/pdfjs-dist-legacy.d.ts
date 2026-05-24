declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export type TextItem = { str: string };
  export type TextMarkedContent = Record<string, unknown>;
  export type TextContent = { items: Array<TextItem | TextMarkedContent> };
  export type PDFPageProxy = { getTextContent(): Promise<TextContent> };
  export type PDFDocumentProxy = {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  };

  export function getDocument(options: { data: Uint8Array }): { promise: Promise<PDFDocumentProxy> };
}
