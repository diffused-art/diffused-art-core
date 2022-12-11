import { Collection } from '@prisma/client';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  runtime: 'experimental-edge',
};

export enum FontFamilies {
  Roboto = `'Roboto', sans-serif;`,
}

const ROBOTO_FONTS: any[] = [
  {
    name: 'Roboto',
    style: 'normal',
    weight: 900,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 900,
  },
  {
    name: 'Roboto',
    style: 'normal',
    weight: 700,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 700,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 400,
  },
  {
    name: 'Roboto',
    style: 'normal',
    weight: 400,
  },
  {
    name: 'Roboto',
    style: 'normal',
    weight: 300,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 300,
  },
  {
    name: 'Roboto',
    style: 'normal',
    weight: 500,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 500,
  },
  {
    name: 'Roboto',
    style: 'normal',
    weight: 100,
  },
  {
    name: 'Roboto',
    style: 'italic',
    weight: 100,
  },
];

const ROBOTO_FONTS_BINARIES = Promise.all([
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Black.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL(
      '../../../../assets/Roboto/Roboto-BlackItalic.ttf',
      import.meta.url,
    ),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Bold.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-BoldItalic.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Italic.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Regular.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Light.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL(
      '../../../../assets/Roboto/Roboto-LightItalic.ttf',
      import.meta.url,
    ),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Medium.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL(
      '../../../../assets/Roboto/Roboto-MediumItalic.ttf',
      import.meta.url,
    ),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-Thin.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
  fetch(
    new URL('../../../../assets/Roboto/Roboto-ThinItalic.ttf', import.meta.url),
  ).then(res => res.arrayBuffer()),
]);

export default async function handle(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const adminPassword = searchParams.get('adminPassword');
  const isAdmin = adminPassword === process.env.MINT_PREVIEW_ADMIN_PASSWORD;
  if (!isAdmin) {
    const token = await getToken({ req });
    const isExpirated = new Date().getTime() / 1000 > (token as any)?.exp;
    if (token === null) {
      return new ImageResponse(<div>Must be authenticated as artist</div>);
    }
    if (isExpirated) {
      return new ImageResponse(<div>Token expirated</div>);
    }
  }

  if (req.method !== 'POST') {
    return new ImageResponse(<div>Only POST method is supported.</div>);
  }
  const ALL_FONTS_BINARIES = await ROBOTO_FONTS_BINARIES;

  const collectionId = searchParams.get('id');

  const extraParam = adminPassword ? `adminPassword=${adminPassword}` : '';
  // TODO: When adding trustless candy machine, this will break if token submission does not work
  const resCollection = await fetch(
    new URL(
      `${origin}/api/collection/${collectionId}?${extraParam}`,
      import.meta.url,
    ),
  ).then(res => res);

  if (resCollection.status !== 200) {
    return new ImageResponse(<div>Collection not found</div>);
  }

  const { data: collection } = (await resCollection.json()) as {
    data: Collection;
  };
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
                display: 'flex',
                fontFamily: font_family || undefined,
                color: textColor || undefined,
                width: '80%',
                textAlign: 'center',
                marginTop: '10px',
                marginBottom: '10px',
                justifyContent: 'center',
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
      fonts: ROBOTO_FONTS.map((font, i) => ({
        ...font,
        data: ALL_FONTS_BINARIES[i],
      })),
    },
  );
}
