import { Language } from '../Language';
import { ILemma } from '../models/Lemma';

// Matches: nl | ar | rom
const tableHeaderRegexp = new RegExp(
  String.raw`^\s*${Language.Native}\s*\|\s*${Language.Foreign}\s*(?:\|\s*roman\s*)$`,
);

// Example match target: ---|---:|----
const tableDividerRegexp = /^[ -:|]+$/;

const isBlankLine = (line: string) => /^\s*$/.test(line);
const splitByVerticalBar = (line: string) =>
  line.split(/ *\| */).map(str => str.trim());

function parseLemmaTable(iter: IterableIterator<string>, sectionIndex: number) {
  let item = iter.next();
  if (item.done) {
    throw new Error('Unexpected end of input');
  }

  if (!tableDividerRegexp.test(item.value)) {
    throw new Error(
      `Expected a markdown table divider but found: '${item.value}'`,
    );
  }

  const lemmas: ILemma[] = [];
  item = iter.next();

  while (!item.done && !isBlankLine(item.value)) {
    const cols = splitByVerticalBar(item.value);
    if (cols.length < 2) {
      throw new Error(`Invalid lemma: ${item.value}`);
    }
    const [native, foreign, roman] = cols;
    const myLemma = { sectionIndex, native, foreign } as ILemma;
    if (roman) {
      myLemma.roman = roman;
    }
    lemmas.push(myLemma);
    item = iter.next();
  }

  return lemmas;
}

export function parseBody(body: string) {
  const platformIndependentLineSeparator = /\r?\n/;
  const lines = body.trim().split(platformIndependentLineSeparator);
  const iter = lines[Symbol.iterator]();
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = iter.next();

  while (!item.done) {
    if (tableHeaderRegexp.test(item.value)) {
      lemmas = lemmas.concat(parseLemmaTable(iter, sections.length));
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
