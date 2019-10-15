import { ILemma } from '../models/Lemma';
import lang from './lang/lang';

enum Language {
  Native = 'native',
  Foreign = 'foreign',
  Roman = 'roman',
}

interface IColumnDef {
  header: string;
  field: Language;
  required: boolean;
}

const COLUMN_DEFS: IColumnDef[] = [
  { header: 'nl', field: Language.Native, required: true },
  { header: 'ar', field: Language.Foreign, required: true },
  { header: 'rom', field: Language.Roman, required: false },
];

const TABLE_HEADER_REGEXP = /^[a-z]+(?: \| [a-z]+)+$/;
const TABLE_DIVIDER_REGEXP = /^[ -:|]+$/;

function next(iter: IterableIterator<string>) {
  const item = iter.next();
  return { done: item.done, value: item.done ? '' : item.value.trim() };
}

function extractCells(line: string, expectedCount = 0) {
  const cells = line.trim().split(/ *\| */);
  if (expectedCount !== 0 && cells.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} cells but got ${cells.length}: ${line}.`,
    );
  }
  return cells;
}

function parseLemmaTable(
  iter: IterableIterator<string>,
  columnNames: Language[],
  sectionIndex: number,
) {
  const lemmas: ILemma[] = [];

  let item = next(iter);
  if (item.done) {
    throw new Error('Unexpected end of input');
  }

  if (!TABLE_DIVIDER_REGEXP.test(item.value)) {
    throw new Error(
      `Expected a markdown table divider but found: '${item.value}'`,
    );
  }

  item = next(iter);

  while (!item.done && item.value !== '') {
    const values = extractCells(item.value, columnNames.length);
    const newLemma = values.reduce(
      (lemma, value, index) => {
        lemma[COLUMN_DEFS[index].field] = value;
        return lemma;
      },
      { sectionIndex } as ILemma,
    );
    lemmas.push(newLemma);
    item = next(iter);
  }
  return lemmas;
}

function validateColumnNames(headers: string[]) {
  headers.forEach((header, index) => {
    if (COLUMN_DEFS[index].header !== header) {
      throw new Error(`Unrecognized field name: '${header}'.`);
    }
  });
}

function getLineIterator(body: string) {
  const lines = body.trim().split('\n');
  return lines[Symbol.iterator]();
}

export function parseBody(body: string) {
  const iter = getLineIterator(body);
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = next(iter);

  while (!item.done) {
    if (TABLE_HEADER_REGEXP.test(item.value)) {
      const columnNames = extractCells(item.value) as Language[];
      validateColumnNames(columnNames);
      lemmas = lemmas.concat(
        parseLemmaTable(iter, columnNames, sections.length),
      );
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
