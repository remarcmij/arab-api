import { ILemma } from '../models/Lemma';

const COLUMN_DEFS = [
  { name: 'nl', required: true },
  { name: 'ar', required: true },
  { name: 'rom', required: false },
];

const TABLE_HEADER_REGEXP = /^[a-z]+(?: \| [a-z]+)+$/;
const TABLE_DIVIDER_REGEXP = /^[ -:|]+$/;

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

function parseLemmaTable(
  iter: IterableIterator<string>,
  columnNames: string[],
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
      { sectionIndex } as ILemma,
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
      const columnNames = extractCells(item.value);
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
