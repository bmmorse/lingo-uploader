const express = require('express');
const app = express();
const downloadRouter = require('./routes/download');
const uploadRouter = require('./routes/upload');
const detailsRouter = require('./routes/details');
const pdfRouter = require('./routes/pdf');

require('dotenv').config();

app.use('/download', downloadRouter);
app.use('/upload', uploadRouter);
app.use('/details', detailsRouter);
app.use('/pdf', pdfRouter);

app.listen(4000, () => {
  console.log('Server listening on port 4000');
});
