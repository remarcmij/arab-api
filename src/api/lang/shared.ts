export const extractWords = (regexp: RegExp) => (line: string) => {
  const words: string[] = [];
  let match = regexp.exec(line);

  while (match) {
    words.push(match[0]);
    match = regexp.exec(line);
  }

  return words;
};
