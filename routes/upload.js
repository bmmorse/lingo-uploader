const Lingo = require('@lingo-app/node').default;
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const dotenv = require('dotenv').config();

// Configure Section Upload ------------

const sections = {
  nyt: '52F91614-A39D-4BB8-BA57-57534785A3AF',
  lingo: '3796319B-30DE-460F-8B5F-1C3AD074520A',
  canva: '18CEDDC3-DE6A-465B-8C52-FCD13BA0BD7A',
  nounproject: 'D57F9F4E-BB83-4CC9-A484-23BF5CD7D9E1',
  amazon: 'B50CC1BB-3301-4EB8-B5F9-A6B1273CFB7F',
  samsclub: 'A98E5AFF-0FA9-4FAF-A0DA-B8C48BB29CDA',
};
const SECTION_ID = sections.nyt;

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
