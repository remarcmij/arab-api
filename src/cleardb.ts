import mongoose from 'mongoose';
import AutoComplete from './models/AutoComplete';
import Lemma from './models/Lemma';
import Topic from './models/Topic';
import Word from './models/Word';

mongoose.connect('mongodb://127.0.0.1/arab', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const { connection } = mongoose;
connection.on('error', err =>
  console.error(`connection error: ${err.message}`),
);
connection.once('open', () => console.info('connected to MongoDB'));

(async () => {
  try {
    await Promise.all([
      AutoComplete.deleteMany({}),
      Word.deleteMany({}),
      Lemma.deleteMany({}),
      Topic.deleteMany({}),
    ]);
    console.log('database cleared');
  } catch (err) {
    console.error(`error clearing database: ${err.message}`);
  } finally {
    process.exit();
  }
})();
