import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic {
  filename: string;
  publication: string;
  chapter: string;
  sha: string;
  title: string;
  subtitle: string;
  prolog?: string;
  epilog?: string;
  kind: string;
  body?: string;
}

const topicSchema = new Schema<ITopic>({
  filename: String,
  publication: String,
  chapter: String,
  sha: String,
  title: String,
  subtitle: String,
  prolog: String,
  epilog: String,
  kind: String,
  body: String,
});

export interface ITopicDocument extends ITopic, Document {}

export default mongoose.model<ITopicDocument>('Topic', topicSchema);
