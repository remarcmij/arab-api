import { Document, model, Schema } from 'mongoose';

export interface ITopic {
  title: string;
  subtitle?: string;
  foreignLang: string;
  nativeLang: string;
  restricted: boolean;
  filename: string;
  publication: string;
  article: string;
  sections: string[];
  substitutions?: object;
  sha: string;
}

export interface ISubstitutions {
  native: Array<[string, string]>;
  foreign: Array<[string, string]>;
}

const substitutionsSchema = new Schema<ISubstitutions>({
  native: [[String]],
  foreign: [[String]],
});

const topicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  subtitle: { type: String, required: false },
  foreignLang: { type: String, required: true },
  nativeLang: { type: String, required: true },
  restricted: { type: Boolean, default: true },
  filename: { type: String, required: true, unique: true },
  publication: { type: String, required: true },
  article: { type: String, required: true },
  sections: [String],
  substitutions: { type: substitutionsSchema, required: false },
  sha: { type: String, required: true },
});

export interface ITopicDocument extends ITopic, Document {}

export default model<ITopicDocument>('Topic', topicSchema);
