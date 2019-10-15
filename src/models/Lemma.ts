import mongoose, { Document, Schema } from 'mongoose';

export interface ILemma {
  native: string;
  foreign: string;
  roman?: string;
  filename: string;
  sectionIndex: number;
  topic?: Schema.Types.ObjectId;
}

const lemmaSchema = new Schema<ILemma>({
  native: { type: String, required: true },
  foreign: { type: String, required: true },
  roman: { type: String, required: false },
  filename: { type: String, required: true },
  sectionIndex: { type: Number, required: true },
  topic: { type: Schema.Types.ObjectId, required: true },
});

export interface ILemmaDocument extends Document, ILemma {}

export default mongoose.model<ILemmaDocument>('Lemma', lemmaSchema);
