import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import showdown from 'showdown';
import util from 'util';
import logger from '../util/logger';
import * as db from './database';
import crypto from 'crypto';
import {
  IAttributes,
  IIndexDocument,
  IWord,
  ILemmaDocument,
  IMarkdownDocument,
} from './database';

const glob = util.promisify(_glob);
const fsAccess = util.promisify(fs.access);

export interface IFrontMatterDocument {
  attributes: IAttributes;
  body: string;
}

const VALID_FIELD_NAMES = ['base', 'foreign', 'trans'];

const readFile = util.promisify(fs.readFile);

const contentDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'development'
    ? '../../../arab-content/content'
    : '../../content',
);

const convertor = new showdown.Converter({
  emoji: true,
  openLinksInNewWindow: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tables: true,
});

const stripParaTag = (text: string) => text.slice(3, -4);

const parseFilename = (filename: string) => filename.match(/^(.+)\.(.+)\.md$/);

function computeSha(data: string) {
  const shaSum = crypto.createHash('sha1');
  shaSum.update(data);
  return shaSum.digest('hex');
}

async function loadDocument(
  filename: string,
): Promise<IIndexDocument | ILemmaDocument | IMarkdownDocument> {
  const filePath = path.join(contentDir, filename);
  const [, publication, article] = parseFilename(filename);
  const filenameBase = `${publication}.${article}`;

  const data = await readFile(filePath, 'utf8');

  const sha = computeSha(data);
  const docSha = await db.getDocumentSha(filenameBase);

  if (sha === docSha) {
    console.log(`unchanged: ${filename}`);
    return;
  }

  logger.debug(`loading: ${filename}`);

  await db.deleteDocument(filenameBase);

  const doc: IFrontMatterDocument = fm<IAttributes>(data);
  const attr = {
    ...doc.attributes,
    filename: filenameBase,
    sha,
    publication,
    article,
  };

  if (article === 'index') {
    attr.kind = 'index';
  }
  if (attr.subtitle) {
    attr.subtitle = stripParaTag(convertor.makeHtml(attr.subtitle));
  }
  if (attr.prolog) {
    attr.prolog = convertor.makeHtml(attr.prolog);
  }
  if (attr.epilog) {
    attr.epilog = convertor.makeHtml(attr.epilog);
  }

  let insertDoc: any;

  switch (attr.kind) {
    case 'index':
      insertDoc = { ...attr, kind: 'index' };
      break;
    case 'wordlist':
      const { fields, words } = parseTable(doc.body);
      insertDoc = { ...attr, kind: 'wordlist', fields, words };
      break;
    default:
      insertDoc = {
        ...attr,
        kind: 'text',
        body: convertor.makeHtml(doc.body),
      };
  }

  db.insertDocument(insertDoc);
}

function parseTable(body: string) {
  const lines = body.trim().split('\n');
  if (lines.length < 3) {
    throw new Error(
      'Expected at minimum 3 lines (header, separator, data) in table',
    );
  }
  const fields = lines[0]
    .trim()
    .split('|')
    .map(field => field.trim())
    .filter(field => field !== '');
  if (fields.length < 2) {
    throw new Error('Expected at minimum 2 fields in table');
  }
  fields.forEach(field => {
    if (!VALID_FIELD_NAMES.includes(field)) {
      throw new Error(`Invalid table field name: ${field}`);
    }
  });
  const words = lines.slice(2).map(line => {
    const word: IWord = {};
    const cells = line.trim().split('|');
    cells.forEach((cell, index) => {
      word[fields[index]] = cell.trim();
    });
    return word;
  });

  return { fields, words: words };
}

async function scanAndLoad() {
  const filePaths = await glob(`${contentDir}/*.md`);
  filePaths.forEach(async filePath => {
    const [, filename] = filePath.match(/^.*[/\\](.+)$/);
    await loadDocument(filename);
  });
}

export async function watchContent() {
  try {
    scanAndLoad();
    fs.watch(contentDir, async (event, filename) => {
      try {
        const filePath = path.join(contentDir, filename);

        switch (event) {
          case 'change':
            await loadDocument(filename);
            break;
          case 'rename': {
            await fsAccess(filePath).then(
              () => loadDocument(filename),
              () => {
                db.deleteDocument(filename);
              },
            );
            break;
          }
          default:
            throw new Error(`Unexpected 'watch' event type: ${event}`);
        }
      } catch (error) {
        logger.error(error);
      }
    });
  } catch (error) {
    logger.error(error);
  }
}
