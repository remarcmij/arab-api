import { transformFile } from '@babel/core';
import { ILemma } from '../models/Lemma';

// Matches: nl | ar | rom
const TABLE_HEADER_REGEXP = /^\s*nl\s*\|\s*ar\s*(?:\|\s*roman\s*)$/;

// Example match target: ---|---:|----
const TABLE_DIVIDER_REGEXP = /^[ -:|]+$/;

const isBlankLine = (line: string) => /^\s*$/.test(line);
const splitByVerticalBar = (line: string) =>
  line.split(/ *\| */).map(str => str.trim());

function parseLemmaTable(iter: IterableIterator<string>, sectionIndex: number) {
  let item = iter.next();
  if (item.done) {
    throw new Error('Unexpected end of input');
  }

  if (!TABLE_DIVIDER_REGEXP.test(item.value)) {
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
    const myLemma = { sectionIndex } as ILemma;
    myLemma.native = cols[0];
    myLemma.foreign = cols[1];
    if (cols.length >= 3) {
      myLemma.roman = cols[2];
    }
    lemmas.push(myLemma);
    item = iter.next();
  }

  return lemmas;
}

export function parseBody(body: string) {
  const lines = body.trim().split('\n');
  const iter = lines[Symbol.iterator]();
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = iter.next();

  while (!item.done) {
    if (TABLE_HEADER_REGEXP.test(item.value)) {
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
