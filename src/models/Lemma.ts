import mongoose, { Document, Schema } from 'mongoose';

export interface ILemma {
  nl: string;
  ar: string;
  rom?: string;
  filename: string;
  sectionIndex: number;
  topic?: Schema.Types.ObjectId;
}

const LemmaSchema = new Schema<ILemma>({
  nl: { type: String, required: true },
  ar: { type: String, required: true },
  rom: { type: String, required: false },
  filename: { type: String, required: true },
  sectionIndex: { type: Number, required: true },
  topic: { type: Schema.Types.ObjectId, required: true },
});

export interface ILemmaDocument extends Document, ILemma {}

export default mongoose.model<ILemmaDocument>('Lemma', LemmaSchema);
