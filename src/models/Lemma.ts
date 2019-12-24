import { Document, model, Schema } from 'mongoose';

export interface ILemma {
  native: string;
  nativeLang: string;
  foreign: string;
  foreignLang: string;
  roman?: string;
  filename: string;
  sectionIndex: number;
  topic?: Schema.Types.ObjectId;
}

const lemmaSchema = new Schema<ILemma>({
  native: { type: String, required: true },
  nativeLang: { type: String, required: true },
  foreign: { type: String, required: true },
  foreignLang: { type: String, required: true },
  roman: { type: String, required: false },
  filename: { type: String, required: true },
  sectionIndex: { type: Number, required: true },
  topic: { type: Schema.Types.ObjectId, required: true },
});

export interface ILemmaDocument extends Document, ILemma {}

export default model<ILemmaDocument>('Lemma', lemmaSchema);
