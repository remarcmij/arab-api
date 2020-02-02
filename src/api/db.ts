import { Schema } from 'mongoose';
import logger from '../config/logger';
import { Language } from '../Language';
import AutoComplete, { IAutoComplete } from '../models/AutoComplete';
import Lemma, { ILemma } from '../models/Lemma';
import Topic, { ITopic, ITopicDocument } from '../models/Topic';
import Word, { IWord } from '../models/Word';
import { extractLemmaWords } from './word-extractor';
import debounce from 'lodash.debounce';

async function insertWords(
  lemmas: ILemma[],
  lemmaIds: Schema.Types.ObjectId[],
  topicDoc: ITopicDocument,
) {
  const inserts: Array<{ insertOne: { document: IWord } }> = [];

  lemmas.forEach((lemma, index) => {
    const lemmaId = lemmaIds[index];
    const { nativeWords, foreignWords } = extractLemmaWords(lemma);

    nativeWords.forEach(word => {
      const document: IWord = {
        word,
        lang: Language.Native,
        filename: topicDoc.filename,
        order: index,
        lemma: lemmaId,
        topic: topicDoc._id,
      };
      inserts.push({ insertOne: { document } });
    });

    foreignWords.forEach(word => {
      const document: IWord = {
        word,
        lang: Language.Foreign,
        filename: topicDoc.filename,
        order: index,
        lemma: lemmaId,
        topic: topicDoc._id,
      };
      inserts.push({ insertOne: { document } });
    });
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

export async function deleteTopic(filename: string) {
  const topic = await Topic.findOne({ filename });
  if (topic) {
    await Promise.all([
      Word.deleteMany({ topic: topic._id }),
      Lemma.deleteMany({ topic: topic._id }),
      Topic.deleteOne({ filename }),
    ]);
    logger.debug(`deleted topic: ${filename}`);
    return true;
  }
  return false;
}

export async function insertTopic(topic: ITopic, lemmas: ILemma[]) {
  const topicDoc = await new Topic(topic).save();
  await insertLemmas(topicDoc, lemmas);
  logger.debug(`inserted topic: ${topic.filename}`);
}

async function rebuildAutoCompletions() {
  try {
    await AutoComplete.deleteMany({});
    const lemmas = await Lemma.find({});
    if (lemmas.length === 0) {
      return void logger.info(
        'no lemmas for building auto-complete collection',
      );
    }

    const inserts: Map<string, {}> = new Map();
    lemmas.forEach(lemma => {
      const { nativeWords, foreignWords } = extractLemmaWords(lemma);
      nativeWords.forEach(word => {
        const document: IAutoComplete = { word, lang: Language.Native };
        inserts.set(`${word}:${Language.Native}`, { insertOne: { document } });
      });
      foreignWords.forEach(word => {
        const document: IAutoComplete = { word, lang: Language.Foreign };
        inserts.set(`${word}:${Language.Foreign}`, { insertOne: { document } });
      });
    });
    await AutoComplete.bulkWrite(Array.from(inserts.values()));
    logger.info('rebuilt auto-complete collection');
  } catch (err) {
    logger.error(`error rebuilding auto-complete collection: ${err.message}`);
  }
}

export const debouncedRebuildAutoCompletions = debounce(
  rebuildAutoCompletions,
  2000,
);

export function getTopicSha(filename: string) {
  return Topic.findOne({ filename }).then(doc => (doc ? doc.sha : null));
}

export function getAllTopics() {
  return Topic.find({})
    .select('-sections')
    .sort('filename');
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
  if (topic) {
    topic.lemmas = await Lemma.find({ topic: topic._id });
  }
  return topic;
}

type IWordPopulated = IWord<ILemma, ITopic>;

export async function searchWord(word: string, isAuthorized: boolean) {
  const results: IWordPopulated[] = await Word.find({ word })
    .sort('filename order')
    .populate('lemma topic')
    .lean();

  return results
    .filter(
      (result: IWordPopulated) => isAuthorized || !result.topic.restricted,
    )
    .map((result: IWordPopulated) => ({
      ...result.lemma,
      title: result.topic.title,
    }));
}

export function lookup(term: string) {
  return AutoComplete.find({ word: { $regex: '^' + term } })
    .sort('word')
    .limit(10);
}
