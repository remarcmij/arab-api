import crypto from 'crypto';
import fm from 'front-matter';
import fs from 'fs';
import _glob from 'glob';
import path from 'path';
import util from 'util';
import logger from '../config/logger';
import { ILemma } from '../models/Lemma';
import Topic, { ITopic } from '../models/Topic';
import * as db from './db';
import { parseBody } from './parser';
import TaskQueue from './TaskQueue';

const glob = util.promisify(_glob);
const removeFile = util.promisify(fs.unlink);
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
  parseBody(data);
  const fmResult = fm<object>(data);

  const hasAttributes = Object.keys(fmResult.attributes).length;
  if (!hasAttributes) {
    throw new Error('invalid empty markdown head file.');
  }

  const hasBody = fmResult.body.replace(/\r?\n/ig, '').trim();
  if (!hasBody) {
    throw new Error('invalid empty markdown body file.');
  }

  return fmResult;
}

export function validateDocumentName(file: { originalname: string }) {
  const hasMDExtension = path.extname(file.originalname) === '.md';

  if (!hasMDExtension) {
    throw new Error(`can't upload a none markdown file.`);
  }

  const [, article] = file.originalname.split('.');

  if (!article || article === 'md') {
    throw new Error(`${file.originalname}: expected filename format <publication>.<article>.md.`);
  }
}

export async function removeContentAndTopic(filename: string) {
  const filePath = path.join(CONTENT_DIR, filename) + '.md';

  const isDeleted = await db.deleteTopic(filename);
  if (!isDeleted) {
    throw new Error('topic not found with the name of: ' + filename);
  }
  await removeFile(filePath);
}

export async function getAllContentFiles() {
  const filePaths = await glob(`${CONTENT_DIR}/*.md`);
  const names = filePaths.map(filePath => path.basename(filePath, '.md'));

  return {
    names, filePaths,
  };
}

export async function dbContentCleanup() {
  try {
    const topics = await Topic.find({});
    const files = await getAllContentFiles();

    const topicsWithNoFile = topics.filter(topic => !files.names.includes(topic.filename));

    const promises = topicsWithNoFile.map(topic => db.deleteTopic(topic.filename));
    await Promise.all(promises);
  } catch (error) {
    logger.error(error);
  }
}
