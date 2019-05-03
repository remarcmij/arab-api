// @ts-check
const {
  removeParenthesizedFragments,
  extractRomanWords,
  extractArabicWords,
  extractLemmaWords,
  stripTashkeel,
} = require('../dist/content/words-extractor');

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

describe('extractRomanWords', () => {
  it('should extract roman words', () => {
    const line = 'dat/voorwaar (na zeggen)';
    const expected = ['dat', 'voorwaar', 'na', 'zeggen'];
    const result = extractRomanWords(line);
    expect(result).toEqual(expected);
  });
});

describe('extractArabicWords', () => {
  it('should extract arabic words', () => {
    const line = 'إِلَى أَيْنَ؟';
    const expected = ['إِلَى', 'أَيْنَ'];
    const result = extractArabicWords(line);
    expect(result).toEqual(expected);
  });
});

describe('stripTashkeel', () => {
  it('should strip tashkeel from Arabic text', () => {
    const line = 'إِلَى أَيْنَ؟';
    const expected = 'إلى أين؟';
    const result = stripTashkeel(line);
    expect(result).toBe(expected);
  });
});

describe('extractLemmaWords', () => {
  it('should extract lemma words with parentheses in source', () => {
    const lemma = {
      source: 'dat/voorwaar (na)zeggen',
      target: 'إِلَى أَيْنَ؟',
    };
    const expected = {
      source: ['dat', 'voorwaar', 'zeggen', 'nazeggen'],
      target: ['إلى', 'أين'],
    };
    const result = extractLemmaWords(lemma);
    expect(result).toEqual(expected);
  });
});
