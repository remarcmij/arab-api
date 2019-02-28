import fm from 'front-matter'
import fs from 'fs'
import _glob from 'glob'
import path from 'path'
import * as showdown from 'showdown'
import sqlite3 from 'sqlite3'
import * as util from 'util'
import logger from '../util/logger'

const glob = util.promisify(_glob)

interface ILemma {
  nl?: string
  ar?: string
  trans?: string
  [index: string]: string
}

interface IAttributes {
  publication?: string
  article?: string
  title: string
  subtitle?: string
  prolog?: string
  epilog?: string
  kind?: 'table' | 'md'
  fields?: string[]
}

export interface IMarkdownDocument {
  attributes: IAttributes
  body?: string
}

interface IDatabaseDocument extends IAttributes {
  body: string
}

const VALID_FIELD_NAMES = ['base', 'foreign', 'trans']

const SQL_CREATE_TABLE = `
  CREATE TABLE docs (
    publication TEXT NOT NULL,
    article TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    prolog TEXT,
    epilog TEXT,
    kind TEXT,
    body TEXT,
    PRIMARY KEY (publication, article)
  )`

const SQL_INSERT = `
  INSERT OR REPLACE INTO docs
    (publication, article, title, subtitle, prolog, epilog, kind, body)
    VALUES (?,?,?,?,?,?,?,?)`

const readFile = util.promisify(fs.readFile)

const contentDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'development' ? '../../../arab-content/content' : '../../content',
)

const db = new sqlite3.Database(':memory:')
const dbRun = util.promisify(db.run.bind(db))
const dbGet = util.promisify(db.get.bind(db))
const dbAll = util.promisify(db.all.bind(db))

const convertor = new showdown.Converter({
  emoji: true,
  openLinksInNewWindow: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tables: true,
})

const stripParaTag = (text: string) => text.slice(3, -4)

const parseFilePath = (filePath: string) => filePath.match(/^.*\/(.+)\.(.+)\.(.+)$/)

async function loadDocument(filePath: string): Promise<IMarkdownDocument> {
  logger.debug(`loading ${filePath}`)
  const data = await readFile(filePath, 'utf8')
  const [, publication, article] = parseFilePath(filePath)

  const doc: IMarkdownDocument = fm<IAttributes>(data)
  const attributes = { ...doc.attributes, publication, article }

  if (attributes.subtitle) {
    attributes.subtitle = stripParaTag(convertor.makeHtml(attributes.subtitle))
  }
  if (attributes.prolog) {
    attributes.prolog = convertor.makeHtml(attributes.prolog)
  }
  if (attributes.epilog) {
    attributes.epilog = convertor.makeHtml(attributes.epilog)
  }

  return { attributes, body: doc.body }
}

function insertDoc(doc: IMarkdownDocument) {
  const { publication, article, title, subtitle, prolog, epilog, kind } = doc.attributes
  return dbRun(SQL_INSERT, [publication, article, title, subtitle, prolog, epilog, kind, doc.body])
}

function parseTable(doc: IMarkdownDocument) {
  const { attributes, body } = doc

  const lines = body.trim().split('\n')
  if (lines.length < 3) {
    throw new Error('Expected at minimum 3 lines (header, separator, data) in table')
  }
  const fields = lines[0]
    .trim()
    .split('|')
    .map(field => field.trim())
  if (fields.length < 2) {
    throw new Error('Expected at minimum 2 fields in table')
  }
  fields.forEach(field => {
    if (!VALID_FIELD_NAMES.includes(field)) {
      throw new Error(`Invalid table field name: ${field}`)
    }
  })
  attributes.fields = fields
  const lemmas: ILemma[] = lines.slice(2).map(line => {
    const lemma: ILemma = {}
    const cells = line.trim().split('|')
    cells.forEach((cell, index) => {
      lemma[fields[index]] = cell.trim()
    })
    return lemma
  })
  return { attributes, body: JSON.stringify(lemmas) }
}

async function loadParsedContent(filePath: string): Promise<IMarkdownDocument> {
  const doc = await loadDocument(filePath)
  const { attributes, body } = doc

  switch (attributes.kind) {
    case 'md':
      return { attributes, body: convertor.makeHtml(body) }
    case 'table': {
      return parseTable(doc)
    }
    default:
      if (attributes.article === 'index') {
        return doc
      }
      throw new Error(`Unexpected document kind: ${attributes.kind}`)
  }
}

export function getIndex() {
  return dbAll(
    `SELECT publication, article, title, subtitle, prolog, 'meta' as kind
    FROM docs WHERE article="index" ORDER BY publication`,
  )
}

export function getChapters(publication: string) {
  return dbAll(
    `SELECT publication, article, title, subtitle, prolog, kind
    FROM docs WHERE publication=? ORDER BY article`,
    [publication],
  ).then((docs: IDatabaseDocument[]) => docs.filter(doc => doc.article !== 'index'))
}

export function getDocument(publication: string, article: string) {
  return dbGet(
    `SELECT *
    FROM docs WHERE publication=? and article=?`,
    [publication, article],
  ).then((doc: IDatabaseDocument) => {
    if (doc && doc.kind === 'table') {
      doc.body = JSON.parse(doc.body)
    }
    return doc
  })
}

async function loadContent(filePaths: string[]) {
  try {
    const promises = filePaths.map(filePath => loadParsedContent(filePath).then(insertDoc))
    await Promise.all(promises)
  } catch (err) {
    console.error(`error: ${err.message}`)
  }
}

async function scanAndLoad() {
  try {
    await dbRun('DELETE FROM docs')
    const matches = await glob(`${contentDir}/*.md`)
    await loadContent(matches)
  } catch (error) {
    logger.error(error)
  }
}
async function monitor() {
  try {
    await dbRun(SQL_CREATE_TABLE)
    scanAndLoad()
    fs.watch(contentDir, () => {
      scanAndLoad()
    })
  } catch (error) {
    logger.error(error)
  }
}

monitor()
