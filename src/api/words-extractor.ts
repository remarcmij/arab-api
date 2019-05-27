import { ILemma } from '../models/Lemma';
import { extractWords as extractTargetWords } from './lang/ar';
import { extractWords as extractSourceWords } from './lang/nl';

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

const removeBracketedText = (text: string) => text.replace(/\[.*]/g, '');
const removeParentheses = (text: string) => text.replace(/[()]/g, '');

export const extractLemmaWords = (lemma: ILemma) => {
  const cleansedText = removeBracketedText(lemma.nl);
  const extractText =
    removeParenthesizedFragments(cleansedText) +
    ' ' +
    removeParentheses(cleansedText);
  const nl = extractSourceWords(extractText);
  const ar = extractTargetWords(lemma.ar);
  return { nl, ar };
};
