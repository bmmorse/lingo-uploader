const express = require('express');
const app = express();
const downloadRouter = require('./routes/download');
const uploadRouter = require('./routes/upload');
require('dotenv').config();

app.use('/download', downloadRouter);
app.use('/upload', uploadRouter);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
