declare module 'Types' {
  export interface IWords {
    nl: string[];
    ar: string[];
  }

  export interface ILemma {
    nl: string;
    ar: string;
    words: IWords;
    rom?: string;
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
