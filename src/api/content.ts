import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import debounce from 'lodash.debounce';
import path from 'path';
import util from 'util';
import logger from '../config/logger';
import * as db from './db';
import { parseBody } from './parser';
import TaskQueue from './TaskQueue';

const glob = util.promisify(_glob);
const CONCURRENCY = 2;

const taskQueue = new TaskQueue(CONCURRENCY, () => {
  db.rebuildAutoCompletions();
});

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

const CONTENT_DIR = path.join(
  __dirname,
  process.env.NODE_ENV === 'production'
    ? '../../content'
    : '../../../arab-content/content',
);

function computeSha(data: string) {
  const shaSum = crypto.createHash('sha1');
  shaSum.update(data);
  return shaSum.digest('hex');
}

async function loadDocument(filePath: string) {
  try {
    const { name: filename } = path.parse(filePath);
    const [publication, article] = filename.split('.');

    if (!article) {
      throw new Error(
        `Expected filename format <publication>.<article> but got: ${filename}`,
      );
    }

    const docText = await fs.promises.readFile(filePath, 'utf8');

    const sha = computeSha(docText);
    const docSha = await db.getTopicSha(filename);

    if (sha === docSha) {
      logger.info(`unchanged: ${filename}`);
      return;
    }

    logger.debug(`loading: ${filename}`);

    await db.deleteTopic(filename);

    const doc: IFrontMatterFile = fm<IAttributes>(docText);

    const attr = {
      ...doc.attributes,
      article,
      filename,
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
  } catch (err) {
    logger.error(err);
  }
}

export async function syncContent() {
  const filePaths = await glob(`${CONTENT_DIR}/*.md`);
  filePaths.forEach(filePath => {
    taskQueue.pushTask(() => loadDocument(filePath));
  });
  // TODO: handle deleted files
}

export function watchContent() {
  const refreshContentDebounced = debounce(syncContent, 5000, {
    trailing: true,
  });
  fs.watch(CONTENT_DIR, () => {
    refreshContentDebounced();
  });
}
