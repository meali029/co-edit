declare module 'html-docx-js' {
  interface HtmlDocxJS {
    asBlob(htmlString: string, options?: Record<string, unknown>): ArrayBuffer;
  }

  const htmlDocxJS: HtmlDocxJS;
  export = htmlDocxJS;
}