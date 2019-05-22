import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic {
  filename: string;
  publication: string;
  chapter: string;
  sha: string;
  title: string;
  subtitle: string;
  kind: string;
  sections: string[];
}

const topicSchema = new Schema<ITopic>({
  filename: String,
  publication: String,
  chapter: String,
  sha: String,
  title: String,
  subtitle: String,
  kind: String,
  sections: [String],
});

export interface ITopicDocument extends ITopic, Document {}

export default mongoose.model<ITopicDocument>('Topic', topicSchema);
