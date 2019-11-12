import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import util from 'util';
import logger from '../config/logger';
import { ILemma } from '../models/Lemma';
import { ITopic } from '../models/Topic';
import * as db from './db';
import { parseBody } from './parser';
import TaskQueue from './TaskQueue';
import { AppError } from '../util';

const glob = util.promisify(_glob);
const CONCURRENCY = 2;

const taskQueue = new TaskQueue(CONCURRENCY, () => {
  db.rebuildAutoCompletions();
});

interface IAttributes {
  title: string;
  subtitle?: string;
  restricted: boolean;
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
        `${filePath}\n>>> expected filename format <publication>.<article>.md`,
      );
    }

    const text = await fs.promises.readFile(filePath, 'utf8');

    const computedSha = computeSha(text);
    const storedSha = await db.getTopicSha(filename);
    if (computedSha === storedSha) {
      logger.info(`unchanged: ${filename}`);
      return;
    }

    logger.info(`loading: ${filename}`);

    const fmResult = fm<IAttributes>(text);

    const topic: ITopic = {
      ...fmResult.attributes,
      article,
      filename,
      publication,
      sections: [],
      sha: computedSha,
    };

    let lemmas: ILemma[];
    if (article === 'index') {
      lemmas = [];
    } else {
      const result = parseBody(fmResult.body);
      topic.sections = result.sections;
      lemmas = result.lemmas;
    }

    await db.deleteTopic(filename);
    await db.insertTopic(topic, lemmas);
  } catch (err) {
    logger.error(err.message);
  }
}

export async function syncContent(contentDir = CONTENT_DIR) {
  const filePaths = await glob(`${contentDir}/*.md`);
  filePaths.forEach(filePath => {
    taskQueue.pushTask(() => loadDocument(filePath));
  });
}

export function validateDocumentPayload(data: string) {
  const fmResult = fm<object>(data);

  const hasAttributes = !!Object.keys(fmResult.attributes).length;
  if (!hasAttributes) {
    throw new AppError('invalid empty markdown head file.');
  }

  const hasBody = !!fmResult.body.replace(/\r?\n/gi, '').trim();
  if (!hasBody) {
    throw new AppError('invalid empty markdown body file.');
  }

  parseBody(fmResult.body);

  return fmResult;
}

export function validateDocumentName(file: { originalname: string }) {
  const parts = file.originalname.split('.');
  return parts.length === 3 || parts[2] === 'md';
}

export async function removeContentAndTopic(filename: string) {
  const isDeleted = await db.deleteTopic(filename);
  if (!isDeleted) {
    throw new AppError('topic not found with the name of: ' + filename);
  }

  await fs.promises.unlink(path.join(CONTENT_DIR, filename) + '.md');
}
