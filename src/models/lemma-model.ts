import mongoose, { Document, Schema } from 'mongoose';

export interface ILemma {
  source: string;
  target: string;
  roman?: string;
  filename: string;
  _topicId?: Schema.Types.ObjectId;
}
const lemmaSchema = new Schema<ILemma>({
  source: String,
  target: String,
  roman: String,
  filename: String,
  _topicId: Schema.Types.ObjectId,
});

export interface ILemmaDocument extends Document, ILemma {}

export default mongoose.model<ILemmaDocument>('Lemma', lemmaSchema);
