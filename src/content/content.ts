import fm from 'front-matter'
import fs from 'fs'
import _glob from 'glob'
import path from 'path'
import * as showdown from 'showdown'
import * as util from 'util'
import logger from '../util/logger'
import * as db from './database'
import { IIndexDocument, IMarkdownDocument, ILemmaDocument, IAttributes, ILemma } from './database'

const glob = util.promisify(_glob)

export interface IFrontMatterDocument {
  attributes: IAttributes
  body: string
}

const VALID_FIELD_NAMES = ['base', 'foreign', 'trans']

const readFile = util.promisify(fs.readFile)

const contentDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'development' ? '../../../arab-content/content' : '../../content',
)

const convertor = new showdown.Converter({
  emoji: true,
  openLinksInNewWindow: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tables: true,
})

const stripParaTag = (text: string) => text.slice(3, -4)

const parseFilePath = (filePath: string) => filePath.match(/^.*\/(.+)\.(.+)\.(.+)$/)

async function loadDocument(
  filePath: string,
): Promise<IIndexDocument | ILemmaDocument | IMarkdownDocument> {
  logger.debug(`loading ${filePath}`)
  const data = await readFile(filePath, 'utf8')
  const [, publication, article] = parseFilePath(filePath)

  const doc: IFrontMatterDocument = fm<IAttributes>(data)
  const attr = {
    ...doc.attributes,
    filename: `${publication}.${article}`,
    publication,
    article,
  }

  if (article === 'index') {
    attr.kind = 'index'
  }
  if (attr.subtitle) {
    attr.subtitle = stripParaTag(convertor.makeHtml(attr.subtitle))
  }
  if (attr.prolog) {
    attr.prolog = convertor.makeHtml(attr.prolog)
  }
  if (attr.epilog) {
    attr.epilog = convertor.makeHtml(attr.epilog)
  }

  if (attr.kind === 'index') {
    return { ...attr, kind: 'index' }
  }

  if (attr.kind === 'lemmas') {
    const { fields, lemmas } = parseTable(doc.body)
    return { ...attr, kind: 'lemmas', fields, lemmas }
  }

  return {
    ...attr,
    kind: 'md',
    body: convertor.makeHtml(doc.body),
  }
}

function parseTable(body: string) {
  const lines = body.trim().split('\n')
  if (lines.length < 3) {
    throw new Error('Expected at minimum 3 lines (header, separator, data) in table')
  }
  const fields = lines[0]
    .trim()
    .split('|')
    .map(field => field.trim())
    .filter(field => field !== '')
  if (fields.length < 2) {
    throw new Error('Expected at minimum 2 fields in table')
  }
  fields.forEach(field => {
    if (!VALID_FIELD_NAMES.includes(field)) {
      throw new Error(`Invalid table field name: ${field}`)
    }
  })
  const lemmas = lines.slice(2).map(line => {
    const lemma: ILemma = {}
    const cells = line.trim().split('|')
    cells.forEach((cell, index) => {
      lemma[fields[index]] = cell.trim()
    })
    return lemma
  })

  return { fields, lemmas }
}

async function loadContent(filePaths: string[]) {
  try {
    const promises = filePaths.map(filePath => loadDocument(filePath).then(db.insertDocument))
    await Promise.all(promises)
  } catch (err) {
    console.error(`error: ${err.message}`)
  }
}

async function scanAndLoad() {
  try {
    console.log('wait')
    await db.deleteAllDocuments()
    const matches = await glob(`${contentDir}/*.md`)
    await loadContent(matches)
  } catch (error) {
    logger.error(error)
  }
}

export async function monitor() {
  try {
    scanAndLoad()
    fs.watch(contentDir, () => {
      scanAndLoad()
    })
  } catch (error) {
    logger.error(error)
  }
}
