import mongoose, { Document, Schema } from 'mongoose';

export interface IAutoComplete {
  word: string;
  lang: string;
}

const AutoCompleteSchema = new Schema<IAutoComplete>({
  word: { type: String, required: true, index: true },
  lang: { type: String, required: true },
});

export interface IAutoCompleteDocument extends Document, IAutoComplete {}

export default mongoose.model<IAutoCompleteDocument>(
  'AutoComplete',
  AutoCompleteSchema,
);
