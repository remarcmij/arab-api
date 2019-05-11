import debounce from 'lodash.debounce';
import { Schema } from 'mongoose';
import logger from '../config/logger';
import AutoComplete from '../models/auto-complete-model';
import Lemma, { ILemma } from '../models/lemma-model';
import Topic, { ITopicDocument } from '../models/topic-model';
import Word from '../models/word-model';
import { ILemmaFile, IMarkdownFile } from './content';
import { extractLemmaWords } from './words-extractor';

const REBUILD_DELAY = 2000;
const debouncedRebuildAutoCompleteCollection = debounce(
  rebuildAutoCompleteCollection,
  REBUILD_DELAY,
);

async function insertWords(
  lemmas: ILemma[],
  lemmaIds: Schema.Types.ObjectId[],
  topicDoc: ITopicDocument,
) {
  const inserts: any[] = [];
  lemmas.forEach((lemma, index) => {
    const lemmaId = lemmaIds[index];
    const { source, target } = extractLemmaWords(lemma);
    source.forEach(word =>
      inserts.push({
        insertOne: {
          document: {
            word,
            lang: 'nl',
            filename: topicDoc.filename,
            order: index,
            _lemmaId: lemmaId,
            _topicId: topicDoc._id,
          },
        },
      }),
    );
    target.forEach(word =>
      inserts.push({
        insertOne: {
          document: {
            word,
            lang: 'ar',
            filename: topicDoc.filename,
            order: index,
            _lemmaId: lemmaId,
            _topicId: topicDoc._id,
          },
        },
      }),
    );
  });
  return Word.bulkWrite(inserts);
}

async function insertLemmas(topicDoc: ITopicDocument, lemmas: ILemma[]) {
  const inserts = lemmas.map(lemma => ({
    insertOne: {
      document: {
        ...lemma,
        filename: topicDoc.filename,
        _topicId: topicDoc._id,
      },
    },
  }));
  const { insertedIds } = await Lemma.bulkWrite(inserts);
  await insertWords(lemmas, insertedIds, topicDoc);
}

export async function insertDocument(doc: IMarkdownFile | ILemmaFile) {
  const { filename, sha, title, subtitle, prolog, epilog, kind, body } = doc;
  const [publication, chapter] = filename.split('.');
  const topicDoc = await new Topic({
    filename,
    publication,
    chapter,
    sha,
    title,
    subtitle,
    prolog,
    epilog,
    kind,
    body,
  }).save();

  if (doc.kind === 'lemmas') {
    await insertLemmas(topicDoc, doc.lemmas);
    await debouncedRebuildAutoCompleteCollection();
  }
}

async function rebuildAutoCompleteCollection() {
  try {
    await AutoComplete.deleteMany({});
    const lemmas = await Lemma.find({});
    const inserts: Map<string, {}> = new Map();
    lemmas.forEach(lemma => {
      const { source, target } = extractLemmaWords(lemma);
      source.forEach(word =>
        inserts.set(`${word}:nl`, {
          insertOne: {
            document: { word, lang: 'nl' },
          },
        }),
      );
      target.forEach(word =>
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

export function getDocumentSha(filename: string) {
  return Topic.findOne({ filename }).then(doc => (doc ? doc.sha : null));
}

export async function deleteDocument(filename: string) {
  const topic = await Topic.findOne({ filename });
  if (topic) {
    await Promise.all([
      Word.deleteMany({ _topicId: topic._id }),
      Lemma.deleteMany({ _topicId: topic._id }),
      Topic.deleteOne({ filename }),
    ]);
  }
}

export function getIndex() {
  return Topic.find({ chapter: 'index' }).sort('title');
}

export function getChapters(publication: string) {
  return Topic.find({ publication }).sort('title');
}

export async function getDocument(filename: string) {
  const topic = await Topic.findOne({ filename }).lean();
  if (topic.kind === 'lemmas') {
    topic.body = await Lemma.find({ _topicId: topic._id });
  }
  return topic;
}

export async function searchWord(word: string) {
  const results = await Word.find({ word })
    .sort('filename order')
    .populate('_lemmaId');
  return results.map(result => (result._lemmaId as unknown) as ILemma);
}

export function lookup(term: string) {
  return AutoComplete.find({ word: { $regex: '^' + term } })
    .sort('word')
    .limit(10);
}
