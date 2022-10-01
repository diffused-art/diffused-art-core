import { launch } from 'puppeteer';

export enum FontFamilies {
  Jura = `'Jura', sans-serif;`,
  Roboto = `'Roboto', sans-serif;`,
  Orbitron = `'Orbitron', sans-serif;`,
  PTMono = `'PT Mono', monospace;`,
  ShareTechMono = `'Share Tech Mono', monospace;`,
  VT323 = `'VT323', monospace;`,
}

export function getTemplate(
  prompt_phrase: string,
  init_image: string,
  font_family: FontFamilies = FontFamilies.Roboto,
  bgColor: string = '#000000',
  textColor: string = '#ffffff',
) {
  const css = `
    html, .title {
      font-size: 12px;
    }
    @media screen and (min-width: 320px) {
      html, .title {
        font-size: calc(16px + 6 * ((100vw - 320px) / 680));
      }
    }
    @media screen and (min-width: 1000px) {
      html, .title {
        font-size: 20px;
      }
    }

    html, body {
      height: 100%;
      width: 100%;
      background-color: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .content {
      font-family: ${font_family}
      color: ${textColor};
      width: 80%;
      text-align: center;
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .fixed_labels {
      font-family: ${font_family}
      color: ${textColor};
      font-size: 1rem;
    }

    .content > div {
      margin-top: 20px;
      margin-bottom: 20px;
    }
    
    .data {
      margin-top: 10px;
      margin-bottom: 10px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      items-align: center;
      justify-content: center;
    }
    
    .init_image {
      border-radius: 10px;
    }
    
    .margin_top {
      margin-top: 40px;
    }`;

  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>PLACEHOLDER IMAGE</title>
      <link href="https://fonts.googleapis.com/css2?family=Jura&family=Orbitron&family=PT+Mono&family=Roboto@1&family=Share+Tech+Mono&family=VT323&display=swap" rel="stylesheet">
    </head>
    <style>${css}</style>
    
    <body>
      <div class="data">
      <div class="content">
      <div class="fixed_labels">PROMPT</div>
      <div>${prompt_phrase}</div>
    </div>
    ${
      init_image
        ? ` <div class="content">
        <img class="init_image" src="${init_image}" height="280" />
      </div>`
        : ''
    }
    <div class="fixed_labels margin_top">Please wait, your AI art is being generated...</div>
    </div>
    </body>
  </html>`;
}

export async function generatePlaceholderImage(
  collectionId,
  prompt_phrase: string,
  init_image: string,
  font_family: FontFamilies = FontFamilies.ShareTechMono,
  bgColor: string,
  textColor: string,
): Promise<Buffer> {
  const browser = await launch({ headless: true });

  const page = await browser.newPage();

  await page.setViewport({ width: 640, height: 640 });

  await page.setContent(
    getTemplate(prompt_phrase, init_image, font_family, bgColor, textColor),
    {
      waitUntil: 'networkidle0',
    },
  );

  const image = await page.screenshot({
    path: `./generate-images/${collectionId}.png`,
  });

  await browser.close();

  return image as Buffer;
}
