import mongoose, { Document, Schema } from 'mongoose';
import { Language } from '../Language';

export interface IWord<
  TLemma = Schema.Types.ObjectId,
  TTopic = Schema.Types.ObjectId
> {
  word: string;
  lang: Language;
  filename: string;
  order: number;
  lemma: TLemma;
  topic: TTopic;
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
