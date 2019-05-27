import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic {
  filename: string;
  publication: string;
  article: string;
  sha: string;
  title: string;
  subtitle: string;
  restricted: boolean;
  sections: string[];
}

const TopicSchema = new Schema<ITopic>({
  filename: { type: String, required: true, unique: true },
  publication: { type: String, required: true },
  article: { type: String, required: true },
  sha: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: false },
  restricted: { type: Boolean, default: true },
  sections: [String],
});

export interface ITopicDocument extends ITopic, Document {}

export default mongoose.model<ITopicDocument>('Topic', TopicSchema);
