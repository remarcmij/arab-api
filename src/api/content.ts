import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import util from 'util';
import logger from '../config/logger';
import * as db from './db';
import { parseBody } from './parser';

const glob = util.promisify(_glob);
const fsAccess = util.promisify(fs.access);

export interface IWords {
  nl: string[];
  ar: string[];
}

export interface IAttributes {
  id?: number;
  publication?: string;
  article?: string;
  filename?: string;
  sha?: string;
  title: string;
  subtitle?: string;
  restricted: boolean;
  sections?: string[];
}

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

async function loadDocument(filename: string): Promise<any> {
  const filePath = path.join(contentDir, filename);
  const [, publication, article] = parseFilename(filename);
  const filenameBase = `${publication}.${article}`;

  const docText = await readFile(filePath, 'utf8');

  const sha = computeSha(docText);
  const docSha = await db.getTopicSha(filenameBase);

  if (sha === docSha) {
    logger.info(`unchanged: ${filename}`);
    return;
  }

  logger.debug(`loading: ${filename}`);

  await db.deleteTopic(filenameBase);

  const doc: IFrontMatterFile = fm<IAttributes>(docText);

  const attr = {
    ...doc.attributes,
    article,
    filename: filenameBase,
    publication,
    sha,
  };

  let insertDoc: any;

  if (article === 'index') {
    insertDoc = { ...attr };
  } else {
    const { sections, lemmas } = parseBody(doc.body);
    insertDoc = { ...attr, lemmas, sections };
  }

  db.insertTopic(insertDoc);
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
              () => db.deleteTopic(filename),
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
