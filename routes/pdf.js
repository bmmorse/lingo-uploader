const express = require('express');
const router = express.Router();
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
let fetch;

(async () => {
  fetch = await import('node-fetch').then((module) => module.default);
})();

// filepath to the PDF ---------------------------------------------------------
const filePath =
  '/Users/brendanmorse/Desktop/lingo-uploader-express/pdf/switcher.pdf';
// -----------------------------------------------------------------------------

async function getURI() {
  const getURI = await fetch('https://pdf-services.adobe.io/assets', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.ADOBE_API_KEY,
      Authorization: `Bearer ${process.env.ADOBE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mediaType: 'application/pdf',
    }),
  });
  console.log(`\nSuccessfully generated URI: ${getURI.status}\n`);
  const { uploadUri, assetID } = await getURI.json();
  return { uploadUri, assetID };
}

async function uploadPDF(uploadUri) {
  // Read the file into a buffer
  const fileBuffer = fs.readFileSync(filePath);
  try {
    let response = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: fileBuffer,
    });
    console.log(`Successfully uploaded the pdf ${response.status}`);
    let text = await response.text();

    return text;
  } catch (err) {
    console.log(err.name);
  }
}

async function processPDF(assetID) {
  const response = await fetch(
    'https://pdf-services-ue1.adobe.io/operation/extractpdf',
    {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.ADOBE_API_KEY,
        Authorization: `Bearer ${process.env.ADOBE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetID: assetID,
        getCharBounds: 'false',
        includeStyling: 'false',
        elementsToExtract: ['text', 'tables'],
        tableOutputFormat: 'xlsx',
        renditionsToExtract: ['tables', 'figures'],
      }),
    }
  );
  console.log(response.status);
  const location = response.headers.get('location');
  console.log(`\nPDF will be processed at\n${location}\n`);

  return location;
}

async function downloadAssets(location) {
  const response = await fetch(location, {
    method: 'GET',
    headers: {
      'X-API-Key': process.env.ADOBE_API_KEY,
      Authorization: `Bearer ${process.env.ADOBE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await response.json();

  console.log(`the download status is ${json.status}`);

  switch (json.status) {
    case 'done': {
      // console.log(`\ndownloadUri\n${json.resource.downloadUri}\n`);
      const file = fs.createWriteStream(
        '/Users/brendanmorse/Desktop/lingo-uploader-express/images/file.zip'
      );
      https.get(json.resource.downloadUri, function (response) {
        response.pipe(file);

        // after download completed close filestream
        file.on('finish', () => {
          file.close();
          console.log('\nDownload Completed\n');
        });
      });
      console.log('\nfiles are downloaded\n');
      break;
    }
    case 'in progress': {
      setTimeout(() => {
        console.log('PDF is being processed...');
        downloadAssets(location);
      }, 5000);
      break;
    }
    case 'failed': {
      console.log('\nDownloading files has failed\n');
      break;
    }
  }
}

router.get('/', async (req, res) => {
  try {
    // Get upload pre-signed URI
    const { uploadUri, assetID } = await getURI();

    // Upload the file
    await uploadPDF(uploadUri);

    // Start the PDF process
    const location = await processPDF(assetID);

    // const location =
    //   'https://pdf-services-ue1.adobe.io/operation/extractpdf/rwBkjwH1KWN5hNOPA8qaN2cmoQpPq4gF/status';
    await downloadAssets(location);

    res.send('success!');
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
