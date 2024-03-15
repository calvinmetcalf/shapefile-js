
import express from 'express';
import morgan from 'morgan';
import path from 'path';
const app = express();
console.log('import.meta', import.meta)
console.log('dir', path.join(import.meta.dirname, '..'))
app.use(morgan('dev'));
app.use('/', express.static(path.join(import.meta.dirname, '..')));
app.listen(3000, () => {
  console.log('go to http://localhost:3000/test/ to test in the browser');
  console.log('or `npm run test` in another window');
});
