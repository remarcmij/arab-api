import mongoose, { Document, Schema, SchemaType } from 'mongoose';

export interface IWord {
  word: string;
  lang: string;
  filename: string;
  order: number;
  lemma: Schema.Types.ObjectId;
  topic: Schema.Types.ObjectId;
}

const wordSchema = new Schema<IWord>({
  word: { type: String, required: true, index: true },
  lang: { type: String, required: true },
  filename: { type: String, required: true },
  order: { type: Number, required: true },
  lemma: { type: Schema.Types.ObjectId, required: true, ref: 'Lemma' },
  topic: { type: Schema.Types.ObjectId, required: true, ref: 'Topic' },
});

export interface IWordDocument extends Document, IWord {}

export default mongoose.model<IWordDocument>('Word', wordSchema);
