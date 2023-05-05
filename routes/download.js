const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function extractDomainAndExtension(hostname) {
  const domainParts = hostname.split('.');
  if (domainParts.length > 2 && domainParts[0] === 'www') {
    domainParts.shift();
  }
  return domainParts.join('.');
}

async function saveSVGContent(filename, content, targetDir) {
  fs.writeFileSync(path.join(targetDir, filename), content);
}

router.get('/', async (req, res) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);

  // Set viewport to full width
  const screenWidth = await page.evaluate(() => window.screen.width);
  await page.setViewport({ width: screenWidth, height: 1080 });

  const testURLs = [
    'https://www.lingoapp.com',
    'https://www.nytimes.com',
    'https://www.canva.com',
  ];

  const targetURL = testURLs[1];

  const urlObj = new URL(targetURL);
  const domainAndExtension = extractDomainAndExtension(urlObj.hostname);

  const parentDir = 'images';
  const targetDir = path.join(parentDir, domainAndExtension);

  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  page.on('response', async (response) => {
    const matches = /.*\.(jpg|png|svg)(\?.*)?$/.exec(response.url());
    if (matches) {
      const extension = matches[1];
      const urlPath = new URL(response.url()).pathname;
      const filename = path.basename(urlPath);
      const buffer = await response.buffer();
      fs.writeFileSync(`${targetDir}/${filename}`, buffer);
      console.log('');
      console.log(filename);
      console.log('');
    }
  });

  await page.goto(targetURL, {
    waitUntil: 'networkidle2',
  });

  // Add this new block of code to extract and save all embedded SVGs
  const embeddedSVGs = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    return svgs.map((svg, index) => {
      const serializer = new XMLSerializer();
      const serializedSVG = serializer.serializeToString(svg);
      return {
        filename: `embeddedSVG-${index + 1}.svg`,
        content: serializedSVG,
      };
    });
  });

  for (const { filename, content } of embeddedSVGs) {
    await saveSVGContent(filename, content, targetDir);
  }

  async function scrollToBottom() {
    const delay = 1000;
    const scrollStep = 500;

    await page.evaluate(
      async (scrollStep, delay) => {
        const scrollAndWait = async () => {
          window.scrollBy(0, scrollStep);
          await new Promise((resolve) => setTimeout(resolve, delay));
        };

        const getScrollHeight = () => {
          return Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
          );
        };

        const scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = getScrollHeight();
        const windowHeight = window.innerHeight;

        while (scrollTop + windowHeight < scrollHeight) {
          await scrollAndWait();
        }
      },
      scrollStep,
      delay
    );
  }

  await scrollToBottom();

  await page.evaluate(() => {
    return new Promise((resolve) => {
      const images = Array.from(document.images);
      const imagesLoaded = images.filter((img) => img.complete);
      if (images.length === imagesLoaded.length) {
        resolve();
      } else {
        let loadedCounter = 0;
        images.forEach((img) => {
          img.addEventListener('load', () => {
            loadedCounter += 1;
            if (loadedCounter === images.length) {
              resolve();
            }
          });
        });
      }
    });
  });

  await browser.close();
  res.send('Image URLs printed and downloaded');
});

module.exports = router;
