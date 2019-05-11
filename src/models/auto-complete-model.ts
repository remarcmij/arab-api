import mongoose, { Document, Schema } from 'mongoose';

export interface IAutoComplete {
  word: string;
  lang: string;
}

const autoCompleteSchema = new Schema<IAutoComplete>({
  word: { type: String, index: true },
  lang: String,
});

export interface IAutoCompleteDocument extends Document, IAutoComplete {}

export default mongoose.model<IAutoCompleteDocument>(
  'AutoComplete',
  autoCompleteSchema,
);
