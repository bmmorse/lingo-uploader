const Lingo = require('@lingo-app/node').default;
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/', async (req, res) => {
  // Lingo.setup(process.env.SPACE_ID, process.env.API_TOKEN);
  // const outline = await Lingo.fetchKitOutline(process.env.KIT_ID);
  // res.json(outline);

  const filePath =
    '/Users/brendanmorse/Desktop/lingo-uploader-express/pdf/iowa.pdf';
  const encodedPath = encodeURIComponent(filePath);
  res.send(encodedPath);
});

module.exports = router;
