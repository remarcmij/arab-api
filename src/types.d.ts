declare module 'Types' {
  export interface IWords {
    source: string[];
    target: string[];
  }

  export interface ILemma {
    source: string;
    target: string;
    words: IWords;
    roman?: string;
    notes?: string;
  }

  export interface IAttributes {
    id?: number;
    publication?: string;
    article?: string;
    filename?: string;
    sha?: string;
    title: string;
    subtitle?: string;
    prolog?: string;
    epilog?: string;
    kind: string;
    body?: string;
  }

  export interface IIndexDocument extends IAttributes {
    kind: 'index';
  }

  export interface IMarkdownDocument extends IAttributes {
    kind: 'text';
    body: string;
  }

  export interface ILemmaDocument extends IAttributes {
    kind: 'lemmas';
    lemmas: ILemma[];
  }

  export type IDocument = IIndexDocument | IMarkdownDocument | ILemmaDocument;
}
