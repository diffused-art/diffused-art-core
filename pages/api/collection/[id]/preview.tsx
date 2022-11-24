import { Collection } from '@prisma/client';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'experimental-edge',
};

export enum FontFamilies {
  Jura = `'Jura', sans-serif;`,
  Roboto = `'Roboto', sans-serif;`,
  Orbitron = `'Orbitron', sans-serif;`,
  PTMono = `'PT Mono', monospace;`,
  ShareTechMono = `'Share Tech Mono', monospace;`,
  VT323 = `'VT323', monospace;`,
}

export default async function handle(req: NextRequest) {
  if (req.method !== 'POST') {
    return new ImageResponse(<div>Not found</div>);
  }
  const { searchParams, origin } = req.nextUrl;

  const collectionId = searchParams.get('id');

  const res = await fetch(
    new URL(`${origin}/api/collection/${collectionId}`, import.meta.url),
  ).then(res => res);

  if (res.status !== 200) {
    return new ImageResponse(<div>Collection not found</div>);
  }

  const { data: collection } = (await res.json()) as { data: Collection };
  const prompt_phrase = collection.promptPhrase;
  const init_image = collection.promptInitImage;
  const font_family = collection.nftPlaceholderFontFamily;
  const bgColor = collection.nftPlaceholderBackgroundColor;
  const textColor = collection.nftPlaceholderForegroundColor;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: '12px',
          height: '100%',
          width: '100%',
          backgroundColor: bgColor || undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            marginTop: '10px',
            marginBottom: '10px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: font_family || undefined,
              color: textColor || undefined,
              width: '80%',
              textAlign: 'center',
              marginTop: '10px',
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: font_family || undefined,
                color: textColor || undefined,
                fontSize: '1rem',
              }}
            >
              PROMPT
            </div>
            <div
              style={{
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              {prompt_phrase}
            </div>
          </div>
          {init_image ? (
            <div
              style={{
                fontFamily: font_family || undefined,
                color: textColor || undefined,
                width: '80%',
                textAlign: 'center',
                marginTop: '10px',
                marginBottom: '10px',
              }}
            >
              <img
                style={{ borderRadius: '10px' }}
                src={init_image}
                height="280"
                alt="Init image"
              />
            </div>
          ) : (
            ''
          )}
          <div
            style={{
              fontFamily: font_family || undefined,
              color: textColor || undefined,
              fontSize: '1rem',
              marginTop: '40px',
            }}
          >
            Please wait, your AI art is being generated...
          </div>
        </div>
      </div>
    ),
    {
      width: 640,
      height: 640,
    },
  );
}
