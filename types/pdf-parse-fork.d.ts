declare module 'pdf-parse-fork' {
  interface PdfData {
    text: string;
    numpages: number;
    info: any; // The metadata info object
    metadata: any;
    version: string;
  }

  function render_page(pageData: any): string;

  interface Options {
    pagerender?: (pageData: any) => string;
    max?: number;
  }

  function PDFParse(dataBuffer: Buffer, options?: Options): Promise<PdfData>;

  export = PDFParse;
}