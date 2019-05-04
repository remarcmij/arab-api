import { ILemma } from 'Types';
import { IGNORE_NL } from './nl';
import { IGNORE_AR } from './ar';

export const removeParenthesizedFragments = (line: string) => {
  const regexp = /[()]/g;
  let depth = 0;
  let start = 0;
  let result = '';
  let match = regexp.exec(line);

  while (match) {
    if (match[0] === '(') {
      if (depth++ === 0) {
        result += line.substring(start, match.index);
      }
    } else {
      if (--depth === 0) {
        start = match.index + 1;
      } else if (depth < 0) {
        throw new Error('Unbalanced parentheses.');
      }
    }
    match = regexp.exec(line);
  }

  if (depth > 0) {
    throw new Error('Unbalanced parentheses.');
  }

  if (start === 0) {
    return line;
  }

  result += line.substring(start);
  return result;
};

const extractWords = (regexp: RegExp) => (line: string) => {
  const words: string[] = [];
  let match = regexp.exec(line);

  while (match) {
    words.push(match[0]);
    match = regexp.exec(line);
  }

  return words;
};

const romanWordRegExp = /[a-zA-Z]+[-a-zA-Z]*/g;
export const extractRomanWords = extractWords(romanWordRegExp);

const arabicWordRegExp = /[\u0621-\u0652]+/g;
export const extractArabicWords = extractWords(arabicWordRegExp);

const tashkeelRegExp = /[\u064c-\u065f\u0640\u0670]/g;
export const stripTashkeel = (line: string) => line.replace(tashkeelRegExp, '');

const removeBracketedText = (text: string) => text.replace(/\[.*]/g, '');
const removeParentheses = (text: string) => text.replace(/[()]/g, '');

const alefRegExp = /[\u0622\u0623\u0625\u0671]/;
export const normalizeAlefs = (text: string) =>
  text.replace(alefRegExp, '\u0627');

export const extractLemmaWords = (lemma: ILemma) => {
  const cleansedText = removeBracketedText(lemma.source.toLowerCase());
  const extractText =
    removeParenthesizedFragments(cleansedText) +
    ' ' +
    removeParentheses(cleansedText);
  const source = [...new Set(extractRomanWords(extractText))].filter(
    word => !IGNORE_NL.includes(word),
  );
  const target = extractArabicWords(stripTashkeel(lemma.target))
    .map(word => normalizeAlefs(word))
    .filter(word => !IGNORE_AR.includes(word));
  return { source, target };
};
