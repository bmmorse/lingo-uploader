const Lingo = require('@lingo-app/node').default;
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const processImages = async (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      await processImages(filePath);
    } else if (
      fileStat.isFile() &&
      (path.extname(file) === '.jpg' ||
        path.extname(file) === '.svg' ||
        path.extname(file) === '.png')
    ) {
      const pathToFile = filePath;
      const fileName = file;

      await Lingo.createFileAsset(
        pathToFile,
        { name: fileName },
        { kitId: process.env.KIT_ID, sectionId: process.env.SECTION_ID }
      );
    }
  }
};

router.get('/', async (req, res) => {
  Lingo.setup(process.env.SPACE_ID, process.env.API_TOKEN);

  const imagesDir = path.join(__dirname, '..', 'images');

  try {
    await processImages(imagesDir);
    res.json('All images uploaded');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing image directories');
  }
});

module.exports = router;
