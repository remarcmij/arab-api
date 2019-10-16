import { ILemma } from '../models/Lemma';

// Matches: nl | ar | rom
const TABLE_HEADER_REGEXP = /^\s*nl\s*\|\s*ar\s*(?:\|\s*roman\s*)$/;

// Example match target: ---|---:|----
const TABLE_DIVIDER_REGEXP = /^[ -:|]+$/;

function next(iter: IterableIterator<string>) {
  const item = iter.next();
  return { done: item.done, value: item.done ? '' : item.value.trim() };
}

function parseLemmaTable(iter: IterableIterator<string>, sectionIndex: number) {
  let item = next(iter);
  if (item.done) {
    throw new Error('Unexpected end of input');
  }

  if (!TABLE_DIVIDER_REGEXP.test(item.value)) {
    throw new Error(
      `Expected a markdown table divider but found: '${item.value}'`,
    );
  }

  const lemmas: ILemma[] = [];
  item = next(iter);

  while (!item.done && item.value !== '') {
    const cells = item.value.trim().split(/ *\| */);
    if (cells.length < 2) {
      throw new Error(`Invalid lemma: ${item.value}`);
    }
    const myLemma = { sectionIndex } as ILemma;
    myLemma.native = cells[0];
    myLemma.foreign = cells[1];
    if (cells.length >= 3) {
      myLemma.roman = cells[2];
    }
    lemmas.push(myLemma);
    item = next(iter);
  }

  return lemmas;
}

export function parseBody(body: string) {
  const lines = body.trim().split('\n');
  const iter = lines[Symbol.iterator]();
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = next(iter);

  while (!item.done) {
    if (TABLE_HEADER_REGEXP.test(item.value)) {
      lemmas = lemmas.concat(parseLemmaTable(iter, sections.length));
      if (sectionText) {
        sections.push(sectionText);
        sectionText = '';
      }
    } else {
      sectionText += `${item.value}\n`;
    }
    item = next(iter);
  }

  if (sectionText) {
    sections.push(sectionText);
  }

  return { sections, lemmas };
}
