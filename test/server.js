const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();

app.use(morgan('dev'));
app.use('/', express.static(path.join(__dirname, '..')));
app.listen(3000, () => {
  console.log('go to http://localhost:3000/test/ to test in the browser');
  console.log('or `npm run test` in another window');
});
