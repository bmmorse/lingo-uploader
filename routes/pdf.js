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
  console.log(getURI.status);
  const { uploadUri, assetID } = await getURI.json();
  return { uploadUri, assetID };
}

async function uploadPDF(uploadUri) {
  const filePath =
    '/Users/brendanmorse/Desktop/lingo-uploader-express/pdf/iowa.pdf';

  // Read the file into a buffer
  const fileBuffer = fs.readFileSync(filePath);
  try {
    let p = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: fileBuffer,
    });
    console.log(p.status);
    let response = await p.text();

    return response;
  } catch (err) {
    console.log(err.name);
  }
}

async function processPDF(assetID) {
  const result = await fetch(
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
  console.log(result.status);
  const headers = [...result.headers];
  return headers[2][1];
}

async function extractPDF(location) {
  const result = await fetch(location, {
    method: 'GET',
    headers: {
      'X-API-Key': process.env.ADOBE_API_KEY,
      Authorization: `Bearer ${process.env.ADOBE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  const json = await result.json();
  console.log(json.resource.downloadUri);
  const file = fs.createWriteStream(
    '/Users/brendanmorse/Desktop/lingo-uploader-express/images/file.zip'
  );
  const request = https.get(json.resource.downloadUri, function (response) {
    response.pipe(file);

    // after download completed close filestream
    file.on('finish', () => {
      file.close();
      console.log('Download Completed');
    });
  });
  console.log(json);
}

router.get('/', async (req, res) => {
  try {
    // Get upload pre-signed URI
    // const { uploadUri, assetID } = await getURI();

    // Upload the file
    // await uploadPDF(uploadUri);

    // Start the PDF process
    // const location = await processPDF(assetID);
    // console.log(`\n${location}\n`);

    // https://pdf-services-ue1.adobe.io/operation/extractpdf/Q2Xz3anBHjKvmtrtSTj1jXgIMTHdrecr/status
    await extractPDF(
      'https://pdf-services-ue1.adobe.io/operation/extractpdf/Q2Xz3anBHjKvmtrtSTj1jXgIMTHdrecr/status'
    );

    res.send('working');
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
