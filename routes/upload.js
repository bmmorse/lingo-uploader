const Lingo = require('@lingo-app/node').default;
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const dotenv = require('dotenv').config();

// Configure Section Upload ------------

const sections = {
  nyt: process.env.NYT_SECTION_ID,
  lingo: process.env.LINGO_SECTION_ID,
  canva: process.env.CANVA_SECTION_ID,
  nounproject: process.env.NOUNPROJECT_SECTION_ID,
  amazon: process.env.AMAZON_SECTION_ID,
};
const SECTION_ID = sections.amazon;

// ----------------------------------

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
      const fileSizeInBytes = fileStat.size;

      if (fileSizeInBytes < 200) {
        console.log(
          `Skipping file ${filePath} because it is smaller than 200 bytes`
        );
      } else {
        const pathToFile = filePath;
        const fileName = file;

        await Lingo.createFileAsset(
          pathToFile,
          { name: fileName },
          { kitId: process.env.KIT_ID, sectionId: SECTION_ID }
        );
      }
    }
  }
};

router.get('/', async (req, res) => {
  Lingo.setup(process.env.SPACE_ID, process.env.API_TOKEN);

  const imagesDir = path.join(__dirname, '..', 'images');

  try {
    await processImages(imagesDir);
    fs.rm(imagesDir, { recursive: true });
    res.json('All images uploaded and directory deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing image directories');
  }
});

module.exports = router;
