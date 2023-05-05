const express = require('express');
const app = express();
const imagesRouter = require('./routes/images'); // Add this line to require the images router

app.use('/', imagesRouter); // Use the images router for the `/` route

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
