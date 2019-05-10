import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import showdown from 'showdown';
import {
  IAttributes,
  IIndexDocument,
  ILemmaDocument,
  IMarkdownDocument,
} from 'Types';
import util from 'util';
import logger from '../config/logger';
import * as db from './database';
import { parseTable } from './table-parser';

const glob = util.promisify(_glob);
const fsAccess = util.promisify(fs.access);

export interface IFrontMatterDocument {
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

  const docText = await readFile(filePath, 'utf8');

  const sha = computeSha(docText);
  const docSha = await db.getDocumentSha(filenameBase);

  if (sha === docSha) {
    console.log(`unchanged: ${filename}`);
    return;
  }

  logger.debug(`loading: ${filename}`);

  await db.deleteDocument(filenameBase);

  const doc: IFrontMatterDocument = fm<IAttributes>(docText);
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
    case 'lemmas':
      const lemmas = parseTable(doc.body);
      insertDoc = { ...attr, kind: 'lemmas', lemmas };
      break;
    case 'text':
      insertDoc = {
        ...attr,
        body: convertor.makeHtml(doc.body),
        kind: 'text',
      };
      break;
    default:
      console.log(`Ignoring document kind: '${attr.kind}'`);
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
