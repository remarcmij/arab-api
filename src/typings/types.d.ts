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
    body?: string;
  }
}
