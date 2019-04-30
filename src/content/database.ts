import * as mysql from 'mysql';
import util from 'util';
import { stripTashkeel } from './tashkeel';

export interface IWord {
  nl?: string;
  ar?: string;
  trans?: string;
  [index: string]: string;
}

export interface IAttributes {
  publication?: string;
  article?: string;
  filename?: string;
  sha?: string;
  title: string;
  subtitle?: string;
  prolog?: string;
  epilog?: string;
  kind: string;
  body?: string;
}

export interface IIndexDocument extends IAttributes {
  kind: 'index';
}

export interface IMarkdownDocument extends IAttributes {
  kind: 'text';
  body: string;
}

export interface ILemmaDocument extends IAttributes {
  kind: 'wordlist';
  fields: string[];
  words: IWord[];
}

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const queryPromise = util.promisify(pool.query.bind(pool));

export async function insertDocument(doc: IMarkdownDocument | ILemmaDocument) {
  const sql =
    'INSERT INTO `docs` (`filename`, `sha`, `title`, `subtitle`, `prolog`, `epilog`, `kind`, `body`) ' +
    'VALUES (?,?,?,?,?,?,?,?)';
  const sql2 = 'INSERT INTO `dict` (`base`, `foreign`, `doc_id`) VALUES ?';
  const { filename, sha, title, subtitle, prolog, epilog, kind } = doc;
  let { body } = doc;
  if (doc.kind === 'wordlist') {
    body = JSON.stringify(doc.words);
  }
  const docPromise = queryPromise(sql, [
    filename,
    sha,
    title,
    subtitle,
    prolog,
    epilog,
    kind,
    body,
  ]);

  if (doc.kind !== 'wordlist') {
    return docPromise;
  }

  return docPromise.then(({ insertId: doc_id }: { insertId: number }) => {
    const data = doc.words.map(({ base, foreign }) => [
      base,
      stripTashkeel(foreign),
      doc_id,
    ]);
    return queryPromise(sql2, [data]);
  });
}

export function getIndex() {
  return queryPromise(
    `SELECT filename, title, subtitle, prolog, 'meta' as kind
    FROM docs WHERE filename LIKE '%.index' ORDER BY filename`,
  );
}

export function getChapters(publication: string) {
  console.log('publication :', publication);
  return queryPromise(
    `SELECT filename, title, subtitle, prolog, kind
    FROM docs WHERE filename LIKE ? ORDER BY filename`,
    [`${publication}.%`],
  ); // .then((docs: IMarkdownDocument[]) => docs.filter(doc => !doc.filename.endsWith('.index')))
}

export function getDocument(filename: string) {
  return queryPromise('SELECT * FROM docs WHERE filename=?', [filename]).then(
    ([doc]: ILemmaDocument[] | IMarkdownDocument[]) => {
      if (doc && doc.kind === 'wordlist') {
        doc.body = JSON.parse(doc.body);
      }
      return doc;
    },
  );
}

export function getDocumentSha(filename: string) {
  return queryPromise('SELECT sha FROM docs WHERE filename=?', [filename]).then(
    (docs: IAttributes[]) => (docs.length > 0 ? docs[0].sha : null),
  );
}

export function deleteDocument(filename: string) {
  return queryPromise('DELETE FROM docs WHERE filename=?', [filename]);
}

export function dictLookup(term: string) {
  return queryPromise('SELECT * FROM dict WHERE base LIKE ? ORDER BY base', [
    `${term}%`,
  ]);
}
