import { Document, model, Schema } from 'mongoose';

export interface ITopic {
  article: string;
  filename: string;
  publication: string;
  restricted: boolean;
  sections: string[];
  sha: string;
  subtitle?: string;
  title: string;
}

const topicSchema = new Schema<ITopic>({
  article: { type: String, required: true },
  filename: { type: String, required: true, unique: true },
  publication: { type: String, required: true },
  restricted: { type: Boolean, default: true },
  sections: [String],
  sha: { type: String, required: true },
  subtitle: { type: String, required: false },
  title: { type: String, required: true },
});

export interface ITopicDocument extends ITopic, Document {}

export default model<ITopicDocument>('Topic', topicSchema);
