import fs from 'fs'
import _glob from 'glob'
import yaml from 'js-yaml'
import path from 'path'
import * as showdown from 'showdown'
import sqlite3 from 'sqlite3'
import * as util from 'util'
import logger from '../util/logger'

const glob = util.promisify(_glob)

export interface ILemma {
  nl?: string
  ar?: string
  trans?: string
  [index: string]: string
}

export interface IDocument {
  publication?: string
  article?: string
  title: string
  subtitle?: string
  prolog?: string
  epilog?: string
  kind?: 'csv' | 'md'
  fields?: string[]
  data?: string
}

const SQL_CREATE_TABLE = `
  CREATE TABLE docs (
    publication TEXT NOT NULL,
    article TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    prolog TEXT,
    epilog TEXT,
    kind TEXT,
    data TEXT,
    PRIMARY KEY (publication, article)
  )`

const SQL_INSERT = `
  INSERT OR REPLACE INTO docs
    (publication, article, title, subtitle, prolog, epilog, kind, data)
    VALUES (?,?,?,?,?,?,?,?)`

const readFile = util.promisify(fs.readFile)
const contentDir = path.join(__dirname, '../../content')

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

async function loadDocument(filePath: string): Promise<IDocument> {
  logger.debug(`loading ${filePath}`)
  const data = await readFile(filePath, 'utf8')
  const [, publication, article] = parseFilePath(filePath)
  const doc: IDocument = yaml.safeLoad(data)
  if (!doc.title) {
    throw new Error('Missing title')
  }
  doc.publication = publication
  doc.article = article

  if (doc.subtitle) {
    doc.subtitle = stripParaTag(convertor.makeHtml(doc.subtitle))
  }
  if (doc.prolog) {
    doc.prolog = convertor.makeHtml(doc.prolog)
  }
  if (doc.epilog) {
    doc.epilog = convertor.makeHtml(doc.epilog)
  }

  return doc
}

function insertDoc(doc: IDocument) {
  const { publication, article, title, subtitle, prolog, epilog, kind, data } = doc
  return dbRun(SQL_INSERT, [publication, article, title, subtitle, prolog, epilog, kind, data])
}

async function loadParsedContent(filePath: string): Promise<IDocument> {
  const doc = await loadDocument(filePath)

  if (doc.kind && !doc.data) {
    const dataFilePath = filePath.replace(/yml$/, doc.kind)
    try {
      logger.debug(`loading ${dataFilePath}`)
      doc.data = await readFile(dataFilePath, 'utf8')
    } catch (_) {
      doc.data = ''
    }
  }

  switch (doc.kind) {
    case 'md':
      return { ...doc, data: convertor.makeHtml(doc.data) }

    case 'csv': {
      const { fields, data } = doc
      const lines = data.trim().split('\n')
      const lemmas: ILemma[] = lines.map(line => {
        const items = line.trim().split(';')
        const lemma: ILemma = {}
        items.forEach((item, index) => {
          lemma[fields[index]] = item
        })
        return lemma
      })
      return { ...doc, data: JSON.stringify(lemmas) }
    }

    default:
      return doc
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
    `SELECT publication, article, title, subtitle, prolog,'meta' as kind
    FROM docs WHERE publication=? ORDER BY article`,
    [publication],
  ).then((docs: IDocument[]) => docs.filter(doc => doc.article !== 'index'))
}

export function getDocument(publication: string, article: string) {
  return dbGet(
    `SELECT *
    FROM docs WHERE publication=? and article=?`,
    [publication, article],
  ).then((doc: IDocument) => {
    if (doc && doc.kind === 'csv') {
      doc.data = JSON.parse(doc.data)
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
    const matches = await glob(`${contentDir}/*.yml`)
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
