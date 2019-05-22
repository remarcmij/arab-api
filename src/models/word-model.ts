import mongoose, { Document, Schema, SchemaType } from 'mongoose';

export interface IWord {
  word: string;
  lang: string;
  filename: string;
  order: number;
  _lemmaId: Schema.Types.ObjectId;
  _topicId: Schema.Types.ObjectId;
}

const wordSchema = new Schema<IWord>({
  word: { type: String, index: true },
  lang: String,
  filename: String,
  order: Number,
  _lemmaId: { type: Schema.Types.ObjectId, ref: 'Lemma' },
  _topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
});

export interface IWordDocument extends Document, IWord {}

export default mongoose.model<IWordDocument>('Word', wordSchema);
