import * as shared from './shared';

/* cSpell: disable */
const IGNORED_WORDS = [
  'م', // vrouwelijk
];
/* cSpell: enable */

const arabicWordRegExp = /[\u0621-\u0652]+/g;
const extractArabicWords = shared.extractWords(arabicWordRegExp);

const tashkeelRegExp = /[\u064c-\u065f\u0640\u0670]/g;
const stripTashkeel = (text: string) => text.replace(tashkeelRegExp, '');

const alefRegExp = /[\u0623\u0625\u0671]/g;
const normalizeAlefs = (text: string) => text.replace(alefRegExp, '\u0627');

export const extractWords = (text: string): string[] => {
  const withoutTashkeel = stripTashkeel(text);
  const withNormalizedAlefs = normalizeAlefs(withoutTashkeel);
  const words = [
    ...new Set([
      ...extractArabicWords(withoutTashkeel),
      ...extractArabicWords(withNormalizedAlefs),
    ]),
  ];
  return words.filter(word => !IGNORED_WORDS.includes(word));
};
