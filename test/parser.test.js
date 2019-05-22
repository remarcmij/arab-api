// @ts-check
const { parseBody } = require('../dist/content/parser');

const text = `

nl | ar | rom
------ | -----: | -----
dit, deze (m) | هَذَا | haḏā
dit, deze (v) | هَذِهِ | haḏihi
dat, die (m) | ذَلِكَ | ḏalika
dat, die (v) | تِلْكَ | tilka
deze (mv) | هٰؤُلَاءِ | hāʾulāʾi
die (mv) | أُولٰئِكَ | ʾūlāʾika
`;

describe('table-parser', () => {
  it('should produce valid output for valid input', () => {
    const result = parseBody(text);
    console.log('result :', result);
  });
});
