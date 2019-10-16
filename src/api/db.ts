import { Schema } from 'mongoose';
import logger from '../config/logger';
import AutoComplete from '../models/AutoComplete';
import Lemma, { ILemma } from '../models/Lemma';
import Topic, { ITopicDocument } from '../models/Topic';
import Word from '../models/Word';
import { extractLemmaWords } from './word-extractor';

async function insertWords(
  lemmas: ILemma[],
  lemmaIds: Schema.Types.ObjectId[],
  topicDoc: ITopicDocument,
) {
  const inserts: any[] = [];
  lemmas.forEach((lemma, index) => {
    const lemmaId = lemmaIds[index];
    const { nativeWords, foreignWords } = extractLemmaWords(lemma);
    nativeWords.forEach(word =>
      inserts.push({
        insertOne: {
          document: {
            word,
            lang: 'nl',
            filename: topicDoc.filename,
            order: index,
            lemma: lemmaId,
            topic: topicDoc._id,
          },
        },
      }),
    );
    foreignWords.forEach(word =>
      inserts.push({
        insertOne: {
          document: {
            word,
            lang: 'ar',
            filename: topicDoc.filename,
            order: index,
            lemma: lemmaId,
            topic: topicDoc._id,
          },
        },
      }),
    );
  });
  return Word.bulkWrite(inserts);
}

async function insertLemmas(topicDoc: ITopicDocument, lemmas: ILemma[]) {
  if (lemmas.length === 0) {
    return;
  }
  const inserts = lemmas.map(lemma => ({
    insertOne: {
      document: {
        ...lemma,
        filename: topicDoc.filename,
        topic: topicDoc._id,
      },
    },
  }));
  const { insertedIds } = await Lemma.bulkWrite(inserts);
  await insertWords(lemmas, insertedIds, topicDoc);
}

export async function insertTopic(doc: any) {
  const { filename, sha, title, subtitle, restricted, sections, lemmas } = doc;
  const [publication, article] = filename.split('.');
  const topicDoc = await new Topic({
    filename,
    publication,
    article,
    sha,
    title,
    subtitle,
    restricted,
    sections,
  }).save();

  if (article !== 'index') {
    await insertLemmas(topicDoc, lemmas);
  }
}

export async function rebuildAutoCompletions() {
  try {
    await AutoComplete.deleteMany({});
    const lemmas = await Lemma.find({});
    const inserts: Map<string, {}> = new Map();
    lemmas.forEach(lemma => {
      const { nativeWords, foreignWords } = extractLemmaWords(lemma);
      nativeWords.forEach(word =>
        inserts.set(`${word}:nl`, {
          insertOne: {
            document: { word, lang: 'nl' },
          },
        }),
      );
      foreignWords.forEach(word =>
        inserts.set(`${word}:ar`, {
          insertOne: {
            document: { word, lang: 'ar' },
          },
        }),
      );
    });
    await AutoComplete.bulkWrite(Array.from(inserts.values()));
    logger.info('rebuilt auto-complete collection');
  } catch (err) {
    logger.error(`error rebuilding auto-complete collection: ${err.message}`);
  }
}

export function getTopicSha(filename: string) {
  return Topic.findOne({ filename }).then(doc => (doc ? doc.sha : null));
}

export async function deleteTopic(filename: string) {
  const topic = await Topic.findOne({ filename });
  if (topic) {
    await Promise.all([
      Word.deleteMany({ topic: topic._id }),
      Lemma.deleteMany({ topic: topic._id }),
      Topic.deleteOne({ filename }),
    ]);
  }
}

export function getIndexTopics() {
  return Topic.find({ article: 'index' }).sort('title');
}

export function getArticleTopics(publication: string) {
  return Topic.find({ publication })
    .select('-sections')
    .sort('article');
}

export async function getArticle(filename: string) {
  const topic = await Topic.findOne({ filename }).lean();
  topic.lemmas = await Lemma.find({ topic: topic._id });
  return topic;
}

export async function searchWord(word: string, isAuthorized: boolean) {
  const results = await Word.find({ word })
    .sort('filename order')
    .populate('lemma topic')
    .lean();

  return results
    .filter((result: any) => isAuthorized || !result.topic.restricted)
    .map((result: any) => ({
      ...result.lemma,
      title: result.topic.title,
    }));
}

export function lookup(term: string) {
  return AutoComplete.find({ word: { $regex: '^' + term } })
    .sort('word')
    .limit(10);
}
