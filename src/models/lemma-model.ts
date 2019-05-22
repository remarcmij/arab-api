import mongoose, { Document, Schema } from 'mongoose';

export interface ILemma {
  nl: string;
  ar: string;
  rom?: string;
  filename: string;
  sectionNum: number;
  _topicId?: Schema.Types.ObjectId;
}

const lemmaSchema = new Schema<ILemma>({
  nl: String,
  ar: String,
  rom: String,
  filename: String,
  sectionNum: Number,
  _topicId: Schema.Types.ObjectId,
});

export interface ILemmaDocument extends Document, ILemma {}

export default mongoose.model<ILemmaDocument>('Lemma', lemmaSchema);
