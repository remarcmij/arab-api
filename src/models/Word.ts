import mongoose, { Document, Schema, SchemaType } from 'mongoose';

export interface IWord {
  word: string;
  lang: string;
  filename: string;
  order: number;
  _lemmaId: Schema.Types.ObjectId;
  _topicId: Schema.Types.ObjectId;
}

const WordSchema = new Schema<IWord>({
  word: { type: String, required: true, index: true },
  lang: { type: String, required: true },
  filename: { type: String, required: true },
  order: { type: Number, required: true },
  _lemmaId: { type: Schema.Types.ObjectId, required: true, ref: 'Lemma' },
  _topicId: { type: Schema.Types.ObjectId, required: true, ref: 'Topic' },
});

export interface IWordDocument extends Document, IWord {}

export default mongoose.model<IWordDocument>('Word', WordSchema);
