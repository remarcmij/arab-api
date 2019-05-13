import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import util from 'util';
import logger from '../config/logger';
import { ILemma } from '../models/lemma-model';
import * as db from './db';
import { parseTable } from './table-parser';

const glob = util.promisify(_glob);
const fsAccess = util.promisify(fs.access);

export interface IWords {
  source: string[];
  target: string[];
}

export interface IAttributes {
  id?: number;
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

export interface IIndexFile extends IAttributes {
  kind: 'index';
}

export interface IMarkdownFile extends IAttributes {
  kind: 'text';
  body: string;
}

export interface ILemmaFile extends IAttributes {
  kind: 'lemmas';
  lemmas: ILemma[];
}

export type IContentFile = IIndexFile | IMarkdownFile | ILemmaFile;

export interface IFrontMatterFile {
  attributes: IAttributes;
  body: string;
}

const readFile = util.promisify(fs.readFile);

const contentDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'production'
    ? '../../content'
    : '../../../arab-content/content',
);

const parseFilename = (filename: string) => filename.match(/^(.+)\.(.+)\.md$/);

function computeSha(data: string) {
  const shaSum = crypto.createHash('sha1');
  shaSum.update(data);
  return shaSum.digest('hex');
}

async function loadDocument(
  filename: string,
): Promise<IIndexFile | ILemmaFile | IMarkdownFile> {
  const filePath = path.join(contentDir, filename);
  const [, publication, article] = parseFilename(filename);
  const filenameBase = `${publication}.${article}`;

  const docText = await readFile(filePath, 'utf8');

  const sha = computeSha(docText);
  const docSha = await db.getDocumentSha(filenameBase);

  if (sha === docSha) {
    logger.info(`unchanged: ${filename}`);
    return;
  }

  logger.debug(`loading: ${filename}`);

  await db.deleteDocument(filenameBase);

  const doc: IFrontMatterFile = fm<IAttributes>(docText);
  const attr = {
    ...doc.attributes,
    article,
    filename: filenameBase,
    publication,
    sha,
  };

  if (article === 'index') {
    attr.kind = 'index';
  }

  let insertDoc: any;

  switch (attr.kind) {
    case 'index':
      insertDoc = { ...attr, kind: 'index' };
      break;
    case 'lemmas':
      const lemmas = parseTable(doc.body);
      insertDoc = { ...attr, kind: 'lemmas', lemmas };
      break;
    case 'text':
      insertDoc = {
        ...attr,
        body: doc.body,
        kind: 'text',
      };
      break;
    default:
      logger.error(`ignoring unknown document kind: '${attr.kind}'`);
      return;
  }

  db.insertDocument(insertDoc);
}

export async function refreshContent() {
  const filePaths = await glob(`${contentDir}/*.md`);
  filePaths.forEach(async filePath => {
    const [, filename] = filePath.match(/^.*[/\\](.+)$/);
    await loadDocument(filename);
  });
}

export async function watchContent() {
  try {
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
              () => db.deleteDocument(filename),
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
