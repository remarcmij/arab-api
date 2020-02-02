import crypto from 'crypto';
import { AppError } from '../util';
import * as db from './db';
import { parseDocument } from './parser';

function computeSha(data: string) {
  const shaSum = crypto.createHash('sha1');
  shaSum.update(data);
  return shaSum.digest('hex');
}

export async function addORReplaceTopic(
  filename: string,
  content: string,
): Promise<{ disposition: 'unchanged' | 'success' }> {
  const computedSha = computeSha(content);
  const storedSha = await db.getTopicSha(filename);
  if (computedSha === storedSha) {
    return { disposition: 'unchanged' };
  }

  const result = await parseDocument(filename, content, computedSha);
  await db.deleteTopic(filename);
  await db.insertTopic(result.topic, result.lemmas);
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
