import { Document, model, Schema } from 'mongoose';
import { Language } from '../Language';

export interface IAutoComplete {
  word: string;
  lang: Language;
}

const autoCompleteSchema = new Schema<IAutoComplete>({
  word: { type: String, required: true, index: true },
  lang: { type: String, required: true },
});

export interface IAutoCompleteDocument extends Document, IAutoComplete {}

export default model<IAutoCompleteDocument>('AutoComplete', autoCompleteSchema);
