// @ts-check
const {
  removeParenthesizedFragments,
  extractLemmaWords,
} = require('../dist/api/words-extractor');

describe('removeParenthesizedFragments', () => {
  it('should remove parenthesized fragments', () => {
    const line = 'This is just (a) test(ing).';
    const result = removeParenthesizedFragments(line);
    expect(result).toBe('This is just  test.');
  });

  it('should throw an error for unbalanced parenthesis', () => {
    const line = 'This is just (a test(ing).';
    expect(() => {
      removeParenthesizedFragments(line);
    }).toThrow();
  });
});

describe('extractLemmaWords', () => {
  it('should correctly extract lemma words', () => {
    const lemma = {
      source: 'dat/voorwaar (na)zeggen',
      target: 'إِلَى أَيْنَ؟',
    };
    const expected = {
      source: ['dat', 'voorwaar', 'zeggen', 'nazeggen'],
      target: ['إلى', 'أين', 'الى', 'اين'],
    };
    const result = extractLemmaWords(lemma);
    expect(result).toEqual(expected);
  });
});
