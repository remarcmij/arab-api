import latinize from 'latinize';
import * as shared from './shared';

/* cSpell: disable */
export const IGNORED_WORDS = [
  'ev', // enkelvoud
  'mv', // meervoud
];
/* cSpell: enable */

const romanWordRegExp = /[a-zA-Z]+[-a-zA-Z]+/g;
const extractLatinizedWords = shared.extractWords(romanWordRegExp);

export const extractWords = (text: string): string[] => {
  const latinizedText = latinize(text).toLocaleLowerCase();
  const words = extractLatinizedWords(latinizedText).filter(
    word => !IGNORED_WORDS.includes(word),
  );
  return [...new Set(words)];
};
