import { ILemma } from '../models/lemma-model';

interface IFieldDef {
  name: keyof ILemma;
  required?: boolean;
}

const COLUMN_DEFS: IFieldDef[] = [
  { name: 'nl', required: true },
  { name: 'ar', required: true },
  { name: 'rom' },
];

const TABLE_HEADER = /^[a-z]+(?: \| [a-z]+)+$/;
const TABLE_DIVIDER = /^[ -:|]+$/;

const next = (iter: IterableIterator<string>) => {
  const item = iter.next();
  return { done: item.done, value: item.done ? '' : item.value.trim() };
};

const extractCells = (line: string, expectedCount?: number) => {
  const cells = line.trim().split(/ *\| */);
  if (expectedCount !== undefined && cells.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} cells but got ${cells.length}: ${line}.`,
    );
  }
  return cells;
};

function parseTable(
  iter: IterableIterator<string>,
  columnNames: string[],
  sectionNum: number,
) {
  const lemmas: ILemma[] = [];

  let item = next(iter);
  if (item.done) {
    throw new Error('Unexpected end of input');
  }

  if (!TABLE_DIVIDER.test(item.value)) {
    throw new Error(
      `Expected a markdown table divider but found: '${item.value}'`,
    );
  }

  item = next(iter);

  while (!item.done && item.value !== '') {
    const values = extractCells(item.value, columnNames.length);
    const lemma = values.reduce(
      (prev, value, index) => {
        switch (columnNames[index]) {
          case 'nl':
            prev.nl = value;
            break;
          case 'ar':
            prev.ar = value;
            break;
          case 'rom':
            prev.rom = value;
            break;
          default:
        }
        return prev;
      },
      { sectionNum } as ILemma,
    );
    lemmas.push(lemma);
    item = next(iter);
  }
  return lemmas;
}

function validateColumnNames(columnNames: string[]) {
  columnNames.forEach(fieldName => {
    if (!COLUMN_DEFS.find(fieldDef => fieldDef.name === fieldName)) {
      throw new Error(`Unrecognized field name: '${fieldName}'.`);
    }
  });

  COLUMN_DEFS.filter(colDef => colDef.required).forEach(colDef => {
    if (!columnNames.includes(colDef.name as string)) {
      throw new Error(`Required field '${colDef.name}' is missing.`);
    }
  });
}

export function parseBody(body: string) {
  const lines = body.trim().split('\n');
  const iter = lines[Symbol.iterator]();
  const sections: string[] = [];
  let lemmas: ILemma[] = [];
  let sectionText = '';
  let item = next(iter);

  while (!item.done) {
    if (TABLE_HEADER.test(item.value)) {
      const columnNames = extractCells(item.value);
      validateColumnNames(columnNames);
      lemmas = lemmas.concat(parseTable(iter, columnNames, sections.length));
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
