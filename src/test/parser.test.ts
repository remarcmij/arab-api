import { parseDocument } from '../api/parser';

const text = `---
title: Primary Title
subtitle: Secondary Title
restricted: false
foreignLang: ar
nativeLang: nl
idiom:
  native:
    substitutions:
      - [(m), mannelijk]
    ignores: []
  foreign:
    substitutions: []
    ignores: []
---

## Chapter 1

nl | ar | roman
---|---:|------
voor (vz. van plaats) | أَمَامَ | ʾamāma
onthouden, bewaren, uit het hoofd leren | حَفِظَ | ḥafiẓa
leren | دَرَسَ | darasa

## Chapter 2

nl | ar 
---|---:
ik deed | فَعَلْتُ 
jij (m) deed | فَعَلْتَ 
jij (v) deed | فَعَلْتِ 

`;

describe('parser', () => {
  it('should produce valid output for valid input', async () => {
    const result = await parseDocument('pub.article.md', text, '12345');
    console.log('result :', result);
    expect(result).toHaveProperty('topic.title', 'Primary Title');
    expect(result).toHaveProperty('topic.subtitle', 'Secondary Title');
    expect(result).toHaveProperty('topic.restricted', false);
    expect(result).toHaveProperty('topic.foreignLang', 'ar');
    expect(result).toHaveProperty('topic.nativeLang', 'nl');
    expect(result).toHaveProperty('topic.filename', 'pub.article.md');
    expect(result).toHaveProperty('topic.publication', 'pub');
    expect(result).toHaveProperty('topic.article', 'article');
    expect(result).toHaveProperty('topic.sha', '12345');
    expect(result).toHaveProperty('topic.sections', [
      '## Chapter 1\n\n',
      '## Chapter 2\n\n',
    ]);
    expect(result).toHaveProperty('lemmas');
    expect(result).toHaveProperty(['lemmas', 0, 'sectionIndex'], 0);
  });
});
