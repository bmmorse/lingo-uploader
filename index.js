const express = require('express');
const app = express();
const downloadRouter = require('./routes/download');
const uploadRouter = require('./routes/upload');
const detailsRouter = require('./routes/details');

require('dotenv').config();

app.use('/download', downloadRouter);
app.use('/upload', uploadRouter);
app.use('/details', detailsRouter);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
