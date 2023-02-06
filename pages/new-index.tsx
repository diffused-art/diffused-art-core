import React from 'react';
import { InfiniteGrid } from '../components/infinite-grid';
import Menu from '../components/menu';

interface ArtPiece {
  id: string;
  thumbUrl: string;
}

const artPieces = [
  {
    id: '1',
    thumbUrl: '/mocks/photo-1.png',
  },
  {
    id: '2',
    thumbUrl: '/mocks/photo-2.png',
  },
  {
    id: '3',
    thumbUrl: '/mocks/photo-2.png',
  },
  {
    id: '4',
    thumbUrl: '/mocks/photo-4.png',
  },
  {
    id: '5',
    thumbUrl: '/mocks/photo-5.png',
  },
  {
    id: '6',
    thumbUrl: '/mocks/photo-6.png',
  },
  {
    id: '7',
    thumbUrl: '/mocks/photo-7.png',
  },
  {
    id: '8',
    thumbUrl: '/mocks/photo-8.png',
  },
  {
    id: '9',
    thumbUrl: '/mocks/photo-9.png',
  },
];

export default function Home() {
  return (
    <>
      <style jsx global>
        {`
          html {
            overflow: hidden;
          }

          body {
            margin: 0;
          }

          html,
          body {
            overscroll-behavior-x: none;
          }
        `}
      </style>
      <div className="relative overflow-hidden w-screen h-screen">
        <InfiniteGrid>
          <div
            style={{
              gridTemplateAreas: `
    "a a a b b b c c"
    "d d e e e f f f"
    "g g g h h i i i"
              `,
              gridTemplateColumns: 'repeat(8, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              gap: '20px',
              width: '100vw',
              height: '125vh',
            }}
            className="p-4 grid"
          >
            {artPieces.map((artPiece, i) => {
              return (
                <div
                  key={artPiece.id}
                  style={{
                    backgroundImage: `url(${artPiece.thumbUrl})`,
                    gridArea:
                      i === 0
                        ? 'a'
                        : String.fromCharCode('a'.charCodeAt(0) + i),
                  }}
                  className="bg-cover rounded-3xl cursor-pointer"
                />
              );
            })}
          </div>
        </InfiniteGrid>

        <div className="absolute top-5 w-full">
          <Menu />
        </div>
      </div>
    </>
  );
}
