declare module '@extractus/article-extractor' {
  export interface ParserOptions {
    wordsPerMinute?: number;
    descriptionTruncateLen?: number;
    descriptionLengthThreshold?: number;
    contentLengthThreshold?: number;
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedIframeDomains?: string[];
  }

  export interface ArticleData {
    url?: string;
    links?: string[];
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    author?: string;
    content?: string;
    source?: string;
    published?: string;
    ttr?: number;
    type?: string;
  }

  export type Fetcher = (url: string) => Promise<Response>;

  export function extract(
    input: string,
    parserOptions?: ParserOptions,
    fetcher?: Fetcher
  ): Promise<ArticleData | null>;

  export function extractFromHtml(
    html: string,
    url?: string,
    parserOptions?: ParserOptions
  ): Promise<ArticleData | null>;

  export function addTransformations(
    transformation: unknown[] | unknown
  ): number;

  export function removeTransformations(patterns?: RegExp[]): number;
}
