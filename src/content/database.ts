import * as mysql from 'mysql';
import util from 'util';
import { stripTashkeel } from './tashkeel';
import {
  IDocument,
  IAttributes,
  ILemma,
  ILemmaDocument,
  IMarkdownDocument,
} from 'Types';

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const queryPromise = util.promisify(pool.query.bind(pool));
const getConnectionPromise = util.promisify<mysql.PoolConnection>(
  pool.getConnection.bind(pool),
);

async function insertWords(
  connectionQuery: Function,
  lemmas: ILemma[],
  lemmaIds: number[],
) {
  const values: [string, string, number][] = [];
  lemmas.forEach((lemma, index) => {
    const lemmaId = lemmaIds[index];
    lemma.words.source.forEach(sourceWord =>
      values.push([sourceWord, 'nl', lemmaId]),
    );
    lemma.words.target.forEach(targetWord =>
      values.push([targetWord, 'ar', lemmaId]),
    );
  });

  const sql = 'INSERT INTO `words` (`word`, `lang`, `lemma_id`) VALUES ?';
  return connectionQuery(sql, [values]);
}

async function insertLemmas(
  connectionQuery: Function,
  docId: number,
  lemmas: ILemma[],
) {
  const sql =
    'INSERT INTO `lemmas` (`source`, `target`, `roman`, `doc_id`) VALUES (?,?,?,?)';

  const insertIds = await Promise.all<number>(
    lemmas.map(async ({ source, target, roman }) => {
      const { insertId } = await connectionQuery(sql, [
        source,
        target,
        roman,
        docId,
      ]);
      return insertId;
    }),
  );

  return insertWords(connectionQuery, lemmas, insertIds);
}

export async function insertDocument(doc: IMarkdownDocument | ILemmaDocument) {
  const sql =
    'INSERT INTO `docs` (`filename`, `sha`, `title`, `subtitle`, `prolog`, `epilog`, `kind`, `body`) ' +
    'VALUES (?,?,?,?,?,?,?,?)';

  const connection = await getConnectionPromise();
  const connectionQuery = util.promisify(connection.query.bind(connection));

  const { filename, sha, title, subtitle, prolog, epilog, kind, body } = doc;
  const { insertId: docId } = await connectionQuery(sql, [
    filename,
    sha,
    title,
    subtitle,
    prolog,
    epilog,
    kind,
    doc.kind === 'lemmas' ? null : body,
  ]);

  if (doc.kind === 'lemmas') {
    await insertLemmas(connectionQuery, docId, doc.lemmas);
  }

  connection.release();
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

export async function getDocument(filename: string) {
  const [document]: IDocument[] = await queryPromise(
    'SELECT * FROM `docs` WHERE `filename`=?',
    [filename],
  );
  if (document.kind === 'lemmas') {
    document.body = await queryPromise(
      'SELECT * FROM `lemmas` WHERE `doc_id`=?',
      [document.id],
    );
  }
  return document;
}

export function getDocumentSha(filename: string) {
  return queryPromise('SELECT sha FROM docs WHERE filename=?', [filename]).then(
    (docs: IAttributes[]) => (docs.length > 0 ? docs[0].sha : null),
  );
}

export function deleteDocument(filename: string) {
  return queryPromise('DELETE FROM docs WHERE filename=?', [filename]);
}

export function searchWord(word: string) {
  const sql = [
    'SELECT `lemmas`.*, `docs`.`title` FROM `words`',
    'JOIN `lemmas` ON `words`.`lemma_id`=`lemmas`.`id`',
    'JOIN `docs` ON `lemmas`.`doc_id`=`docs`.`id`',
    'WHERE `word`=?',
    'ORDER BY `docs`.`filename`',
  ].join('\n');
  return queryPromise(sql, [word]);
}
