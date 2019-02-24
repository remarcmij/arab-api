import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import * as showdown from 'showdown'
import sqlite3 from 'sqlite3'
import * as util from 'util'
import * as watch from 'watch'
import logger from '../util/logger'

export interface ILemma {
  nl?: string
  ar?: string
  trans?: string
  [index: string]: string
}

export interface IDoc {
  publication?: string
  chapter?: string
  title: string
  description?: string
  kind?: 'csv' | 'md'
  fields?: string[]
  data?: string
}

const SQL_CREATE_TABLE = `
  CREATE TABLE docs (
    publication TEXT NOT NULL,
    chapter TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    kind TEXT,
    data TEXT,
    PRIMARY KEY (publication, chapter)
  )`

const SQL_INSERT = `
  INSERT OR REPLACE INTO docs
    (publication, chapter, title, description, kind, data)
    VALUES (?,?,?,?,?,?)`

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

const parseFilePath = (filePath: string) => filePath.match(/^.*\/(.+)\.(.+)\.(.+)$/)

async function loadDocument(filePath: string): Promise<IDoc> {
  logger.debug(`loading ${filePath}`)
  const data = await readFile(filePath, 'utf8')
  const [, publication, chapter] = parseFilePath(filePath)
  const doc: IDoc = yaml.safeLoad(data)
  if (!doc.title) {
    throw new Error('Missing title')
  }
  doc.publication = publication
  doc.chapter = chapter
  if (doc.description) {
    doc.description = convertor.makeHtml(doc.description)
  }
  return doc
}

function insertDoc(doc: IDoc) {
  const { title, kind, description, publication, chapter, data } = doc
  return dbRun(SQL_INSERT, [publication, chapter, title, description, kind, data])
}

async function loadParsedContent(filePath: string): Promise<IDoc> {
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
    `SELECT publication, chapter, title, description, 'meta' as kind
    FROM docs WHERE chapter="index" ORDER BY publication`,
  )
}

export function getChapters(publication: string) {
  return dbAll(
    `SELECT publication, chapter, title, description, 'meta' as kind
    FROM docs WHERE publication=? ORDER BY chapter`,
    [publication],
  ).then((docs: IDoc[]) => docs.filter(doc => doc.chapter !== 'index'))
}

export function getDocument(publication: string, chapter: string) {
  return dbGet(
    `SELECT *
    FROM docs WHERE publication=? and chapter=?`,
    [publication, chapter],
  ).then((doc: IDoc) => {
    if (doc && doc.kind === 'csv') {
      doc.data = JSON.parse(doc.data)
    }
    return doc
  })
}

async function createDatabase(files: watch.FileOrFiles) {
  await dbRun(SQL_CREATE_TABLE)
  const promises = Object.entries(files)
    .filter(([, stats]) => stats.isFile())
    .map(([filePath]) => loadParsedContent(filePath).then(insertDoc))
  await Promise.all(promises)
}

watch.watchTree(
  contentDir,
  { filter: (file: string) => /\.yml$/.test(file) },
  (file, curr, prev) => {
    if (typeof file === 'object' && prev === null && curr === null) {
      createDatabase(file)
    } else if (prev === null) {
      loadParsedContent((file as unknown) as string).then(insertDoc)
    } else if (curr.nlink === 0) {
      const [, publication, chapter] = parseFilePath((file as unknown) as string)
      dbRun(`DELETE FROM docs WHERE publication=? AND chapter=?`, [publication, chapter])
    } else {
      loadParsedContent((file as unknown) as string).then(insertDoc)
    }
  },
)
