import crypto from 'crypto';
import fm from 'front-matter';
import logger from '../config/logger';
import { ILemma } from '../models/Lemma';
import { ITopic } from '../models/Topic';
import * as db from './db';
import { parseBody } from './parser';
import { AppError } from '../util';

type TopicDisposition = {
  disposition: 'success' | 'unchanged';
};

interface IAttributes {
  title: string;
  subtitle?: string;
  restricted: boolean;
  index?: boolean;
}

function computeSha(data: string) {
  const shaSum = crypto.createHash('sha1');
  shaSum.update(data);
  return shaSum.digest('hex');
}

export function validateDocumentPayload<T extends { index?: boolean }>(
  data: string,
) {
  const fmResult = fm<T>(data);

  const hasAttributes = !!Object.keys(fmResult.attributes).length;
  if (!hasAttributes) {
    throw new AppError('invalid empty markdown head file.');
  }

  const parserResult = parseBody(fmResult.body);

  return { fmResult, parserResult };
}

export async function addORReplaceTopic(
  filename: string,
  newContent: string,
): Promise<TopicDisposition> {
  const [publication, article] = filename.split('.');
  const computedSha = computeSha(newContent);

  const { fmResult, parserResult } = validateDocumentPayload<IAttributes>(
    newContent,
  );

  const statusCode = 200;

  const storedSha = await db.getTopicSha(filename);
  if (storedSha == null) {
    statusCode;
  }
  if (computedSha === storedSha) {
    logger.info(`unchanged: ${filename}`);
    return { disposition: 'unchanged' };
  }

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
    topic.sections = parserResult.sections;
    lemmas = parserResult.lemmas;
  }

  await db.deleteTopic(filename);
  await db.insertTopic(topic, lemmas);

  return { disposition: 'success' };
}

export function validateDocumentName(file: { originalname: string }) {
  const parts = file.originalname.split('.');
  return parts.length === 3 || parts[2] === 'md';
}

export async function deleteTopic(filename: string) {
  const isDeleted = await db.deleteTopic(filename);
  if (!isDeleted) {
    throw new AppError('topic not found: ' + filename);
  }
}
