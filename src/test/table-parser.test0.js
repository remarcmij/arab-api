// @ts-check
const { parseTable } = require('../dist/api/table-parser');

describe.skip('table-parser', () => {
  it('should produce valid output for valid input', () => {
    const sampleTable = [
      'source | target | roman',
      '------ | ------:| -----',
      'aarde | أَرْض | ʾarḍ (v)',
      'avond | مَسَاء | masāʾ',
    ].join('\n');
    const expected = [
      {
        source: 'aarde',
        target: 'أَرْض',
        roman: 'ʾarḍ (v)',
        words: { source: ['aarde'], target: ['أرض', 'ارض'] },
      },
      {
        source: 'avond',
        target: 'مَسَاء',
        roman: 'masāʾ',
        words: { source: ['avond'], target: ['مساء'] },
      },
    ];
    const result = parseTable(sampleTable);
    expect(result).toEqual(expected);
  });

  it('should throw an error if the input is an empty string', () => {
    expect(() => {
      parseTable('');
    }).toThrow();
  });

  it('should throw an error if a required field is missing', () => {
    const sampleTable = [
      'source | notes | roman',
      '------ | ------:| -----',
      'aarde | أَرْض | ʾarḍ (v)',
      'avond | مَسَاء | masāʾ',
    ].join('\n');
    expect(() => {
      parseTable(sampleTable);
    }).toThrow();
  });

  it('should throw an error if the header separator is missing', () => {
    const sampleTable = [
      'source | notes | roman',
      'aarde | أَرْض | ʾarḍ (v)',
      'avond | مَسَاء | masāʾ',
    ].join('\n');
    expect(() => {
      parseTable(sampleTable);
    }).toThrow();
  });

  it('should throw an error for a mismatch in the number of fields', () => {
    const sampleTable = [
      'source | target | roman',
      '------ | ------:| -----',
      'aarde | أَرْض',
      'avond | مَسَاء | masāʾ',
    ].join('\n');
    expect(() => {
      parseTable(sampleTable);
    }).toThrow();
  });
});
