import { ILemma } from 'Types';
import { extractLemmaWords } from './words-extractor';

interface FieldDef {
  name: keyof ILemma;
  required?: boolean;
}

const FIELD_DEFS: FieldDef[] = [
  { name: 'source', required: true },
  { name: 'target', required: true },
  { name: 'roman' },
];

const extractCells = (line: string, expectedCount?: number) => {
  const cells = line.trim().split(/\s*\|\s*/);
  if (expectedCount !== undefined && cells.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} cells but got ${cells.length}: ${line}.`,
    );
  }
  return cells;
};

export function parseTable(body: string) {
  const lines = body.trim().split('\n');
  if (lines.length < 3) {
    throw new Error(
      'Expected at minimum 3 lines (header, separator, data) in table.',
    );
  }

  // First line must contain the field names
  const fieldNames = extractCells(lines[0]);
  fieldNames.forEach(fieldName => {
    if (!FIELD_DEFS.find(fieldDef => fieldDef.name === fieldName)) {
      throw new Error(`Unrecognized field name: '${fieldName}'.`);
    }
  });

  FIELD_DEFS.filter(fieldDef => fieldDef.required).forEach(fieldDef => {
    if (!fieldNames.includes(fieldDef.name as string)) {
      throw new Error(`Required field '${fieldDef.name}' is missing.`);
    }
  });

  // Second line must be a markdown table header separator
  const dividerCells = extractCells(lines[1], fieldNames.length);
  dividerCells.forEach(cell => {
    if (!/^[-:]+/.test(cell)) {
      throw new Error('Invalid markdown table syntax');
    }
  });

  // Remaining lines contain the lemmas
  const lemmas = lines.slice(2).map(line => {
    const lemma = extractCells(line, fieldNames.length).reduce(
      (lemma, cell, index) => {
        switch (fieldNames[index]) {
          case 'source':
            lemma.source = cell;
            break;
          case 'target':
            lemma.target = cell;
            break;
          case 'roman':
            lemma.roman = cell;
            break;
          default:
        }
        return lemma;
      },
      {} as ILemma,
    );
    lemma.words = extractLemmaWords(lemma);
    return lemma;
  });

  return lemmas;
}