const CHARCODE_SUPERSCRIPT_ALIF = 0x670;
const CHARCODE_TATWEEL = 0x640;

function isCharTashkeel(letter: string) {
  const code = letter.charCodeAt(0);
  // 1648 - superscript alif
  // 1619 - madd: ~
  return (
    code === CHARCODE_TATWEEL ||
    code === CHARCODE_SUPERSCRIPT_ALIF ||
    (code >= 0x64c && code <= 0x65f)
  );
}

export function stripTashkeel(input: string) {
  let output = '';
  for (const letter of input) {
    if (!isCharTashkeel(letter)) {
      output += letter;
    }
  }
  return output;
}
