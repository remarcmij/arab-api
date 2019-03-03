import * as mysql from 'mysql'
import util from 'util'
import { stripTashkeel } from './tashkeel'

export interface ILemma {
  nl?: string
  ar?: string
  trans?: string
  [index: string]: string
}

export interface IAttributes {
  publication?: string
  article?: string
  filename?: string
  title: string
  subtitle?: string
  prolog?: string
  epilog?: string
  kind: string
  body?: string
}

export interface IIndexDocument extends IAttributes {
  kind: 'index'
}

export interface IMarkdownDocument extends IAttributes {
  kind: 'md'
  body: string
}

export interface ILemmaDocument extends IAttributes {
  kind: 'lemmas'
  fields: string[]
  lemmas: ILemma[]
}

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const queryPromise = util.promisify(pool.query.bind(pool))

export async function insertDocument(doc: IMarkdownDocument | ILemmaDocument) {
  const sql =
    'REPLACE INTO `docs` (`filename`, `title`, `subtitle`, `prolog`, `epilog`, `kind`, `body`) ' +
    'VALUES (?,?,?,?,?,?,?)'
  const sql2 = 'REPLACE INTO `dict` (`base`, `foreign`, `doc_id`) VALUES ?'
  const { filename, title, subtitle, prolog, epilog, kind } = doc
  let { body } = doc
  if (doc.kind === 'lemmas') {
    body = JSON.stringify(doc.lemmas)
  }
  const docPromise = queryPromise(sql, [filename, title, subtitle, prolog, epilog, kind, body])

  if (doc.kind !== 'lemmas') {
    return docPromise
  }

  return docPromise.then(({ insertId: doc_id }: { insertId: number }) => {
    const data = doc.lemmas.map(({ base, foreign }) => [base, stripTashkeel(foreign), doc_id])
    return queryPromise(sql2, [data])
  })
}

export function getIndex() {
  return queryPromise(
    `SELECT filename, title, subtitle, prolog, 'meta' as kind
    FROM docs WHERE filename LIKE '%.index' ORDER BY filename`,
  )
}

export function getChapters(publication: string) {
  console.log('publication :', publication)
  return queryPromise(
    `SELECT filename, title, subtitle, prolog, kind
    FROM docs WHERE filename LIKE ? ORDER BY filename`,
    [`${publication}.%`],
  ) // .then((docs: IMarkdownDocument[]) => docs.filter(doc => !doc.filename.endsWith('.index')))
}

export function getDocument(filename: string) {
  return queryPromise('SELECT * FROM docs WHERE filename=?', [filename]).then(
    ([doc]: ILemmaDocument[] | IMarkdownDocument[]) => {
      if (doc && doc.kind === 'lemmas') {
        doc.body = JSON.parse(doc.body)
      }
      return doc
    },
  )
}

export function deleteAllDocuments() {
  return queryPromise('DELETE FROM docs')
}
