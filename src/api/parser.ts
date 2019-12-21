import fm from 'front-matter';
import { ILemma } from '../models/Lemma';
import { ITopic } from '../models/Topic';
import { AppError } from '../util';

interface IAttributes {
  title: string;
  subtitle?: string;
  restricted: boolean;
  foreignLang: string;
  nativeLang: string;
  substitutions?: object;
}

const getTableHeaderRegexp = (attr: IAttributes) => {
  // matches:
  // nl | ar | roman
  // nl | ar
  return new RegExp(
    String.raw`^\s*${attr.nativeLang}\s*\|\s*${attr.foreignLang}\s*(?:\|\s*roman\s*)?$`,
  );
};

// Example match target: ---|---:|----
const tableDividerRegexp = /^[- :|]+$/;

const isBlankLine = (line: string) => /^\s*$/.test(line);
const splitByVerticalBar = (line: string) =>
  line.split(/ *\| */).map(str => str.trim());

function parseLemmaTable(
  iter: IterableIterator<string>,
  sectionIndex: number,
  attr: IAttributes,
) {
  let item = iter.next();
  if (item.done) {
    throw new AppError('Unexpected end of input');
  }

  if (!tableDividerRegexp.test(item.value)) {
    throw new AppError(
      `Expected a markdown table divider but found: '${item.value}'`,
    );
  }

  const lemmas: ILemma[] = [];
  item = iter.next();

  while (!item.done && !isBlankLine(item.value)) {
    const cols = splitByVerticalBar(item.value);
    if (cols.length < 2) {
      throw new AppError(`Invalid lemma: ${item.value}`);
    }
    const [native, foreign, roman] = cols;
    const myLemma = {
      sectionIndex,
      native,
      nativeLang: attr.nativeLang,
      foreign,
      foreignLang: attr.foreignLang,
      roman,
    } as ILemma;
    // if (roman) {
    //   myLemma.roman = roman;
    // }
    lemmas.push(myLemma);
    item = iter.next();
  }

  return lemmas;
}

export function parseBody(body: string, attr: IAttributes) {
  const platformIndependentLineSeparator = /\r?\n/;
  const lines = body.trim().split(platformIndependentLineSeparator);
  const iter = lines[Symbol.iterator]();
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = iter.next();

  const tableHeaderRegexp = getTableHeaderRegexp(attr);

  while (!item.done) {
    if (tableHeaderRegexp.test(item.value)) {
      lemmas = lemmas.concat(parseLemmaTable(iter, sections.length, attr));
      sections.push(sectionText);
      sectionText = '';
    } else {
      sectionText += `${item.value}\n`;
    }
    item = iter.next();
  }

  if (sectionText) {
    sections.push(sectionText);
  }

  return { sections, lemmas };
}

export async function parseDocument(
  filename: string,
  content: string,
  computedSha: string,
) {
  const { attributes: attr, body } = fm<IAttributes>(content);

  if (typeof attr.title !== 'string') {
    throw new AppError('Attribute <title> is a required string.');
  }
  if (typeof attr.restricted === 'undefined') {
    attr.restricted = true;
  } else if (typeof attr.restricted !== 'boolean') {
    throw new AppError('Attribute <restricted> must be true or false.');
  }
  if (typeof attr.nativeLang !== 'string') {
    throw new AppError('Attribute <nativeLang> is a required string.');
  }
  if (typeof attr.foreignLang !== 'string') {
    throw new AppError('Attribute <foreignLang> is a required string.');
  }

  const parserResult = parseBody(body, attr);

  const [publication, article] = filename.split('.');

  console.log('attr :', attr);

  const topic: ITopic = {
    ...attr,
    article,
    filename,
    publication,
    substitutions: attr.substitutions,
    sha: computedSha,
    sections: [],
  };

  let lemmas: ILemma[];
  if (article === 'index') {
    lemmas = [];
  } else {
    topic.sections = parserResult.sections;
    lemmas = parserResult.lemmas;
  }

  return {
    topic,
    lemmas,
  };
}
