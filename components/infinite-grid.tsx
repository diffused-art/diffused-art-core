import { useComponentSize } from 'react-use-size';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from 'framer-motion';
import * as React from 'react';
import { Grid, Vector } from './infinite-grid-types';
import { useGesture } from '@use-gesture/react';
// @ts-ignore
import { Lethargy } from 'lethargy';
import produce from 'immer';

const lethargy = new Lethargy(15, 12, 0.05);

const ItemComp = ({ item, children }) => {
  const x = useMotionValue(item.center.x);
  const y = useMotionValue(item.center.y);

  React.useEffect(() => {
    x.set(item.center.x);
    y.set(item.center.y);
  }, [item.center.x, item.center.y]);

  return (
    <motion.div
      className="absolute"
      style={{ x, y, width: item.width, height: item.height }}
    >
      {children}
    </motion.div>
  );
};

interface InfiniteGridProps {
  width?: number | string;
  height?: number | string;
  children: React.ReactNode;
}

export const InfiniteGrid = ({
  width = '100%',
  height = '100%',
  children,
}: InfiniteGridProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const content = useComponentSize();
  const config = { mass: 0.25, damping: 40, stiffness: 200 }; // more damping on large screens

  const [grid, setGrid] = React.useState(
    () =>
      new Grid({
        width: content.width,
        height: content.height,
      }),
  );

  React.useEffect(() => {
    setGrid(
      new Grid({
        width: content.width,
        height: content.height,
      }),
    );
  }, [content.width, content.height]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springs = {
    x: useSpring(0, config),
    y: useSpring(0, config),
  };

  useMotionValueEvent(springs.x, 'change', val => {
    produce(grid, draftGrid => {
      draftGrid.setCameraPosition(
        new Vector({
          x: val,
          y: springs.y.get(),
        }),
      );
    });
  });

  useMotionValueEvent(springs.y, 'change', val => {
    setGrid(
      grid.setCameraPosition(
        new Vector({
          x: springs.x.get(),
          y: val,
        }),
      ),
    );
  });

  const initialOffsetRef = React.useRef({ x: 0, y: 0 });

  useGesture(
    {
      onDragStart: ({ offset: [x, y] }) => {
        initialOffsetRef.current.x = springs.x.get() + x;
        initialOffsetRef.current.y = springs.y.get() + y;
      },
      onDrag: ({ offset: [x, y] }) => {
        springs.x.set(initialOffsetRef.current.x - x);
        springs.y.set(initialOffsetRef.current.y - y);
      },
      onDragEnd: ({
        offset: [x, y],
        velocity: [vx, vy],
        direction: [dx, dy],
      }) => {
        // add some inertia at end of drag
        springs.x.set(initialOffsetRef.current.x - x - dx * vx * 180);
        springs.y.set(initialOffsetRef.current.y - y - dy * vy * 180);
      },
      onWheel: ({ event, delta: [dx, dy] }) => {
        if (lethargy.check(event) !== false) {
          springs.x.set(springs.x.get() + dx * 5);
          springs.y.set(springs.y.get() + dy * 5);
        }
      },
    },
    { target: containerRef, wheel: { eventOptions: { passive: false } } },
  );

  React.useEffect(() => {
    x.set(-grid.cameraPosition.x);
    y.set(-grid.cameraPosition.y);
  }, [grid.cameraPosition.x, grid.cameraPosition.y]);

  return (
    <div
      key={grid.id}
      style={{ width: width, height: height }}
      className="overflow-hidden"
    >
      <motion.div
        ref={containerRef}
        style={{ x, y, touchAction: 'none' }}
        className="w-full h-full relative flex items-center justify-center"
      >
        <div className="absolute inset-0">
          <div
            // to measure the size of the content
            ref={content.ref}
            className="inline-block invisible min-h-full max-w-full"
          >
            {children}
          </div>
        </div>
        {grid.items.map(item => (
          <ItemComp key={item.id} item={item}>
            {children}
          </ItemComp>
        ))}
      </motion.div>
    </div>
  );
};
