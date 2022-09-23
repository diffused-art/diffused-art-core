import React from 'react';

interface CornerCardProps {
  side?: 'left' | 'right';
  children: React.ReactNode;
  title: string;
}

export default function CornerCard({ side = 'left', children, title }) {
  let classes = 'mr-10 rounded-r-lg self-start items-start pl-5 pr-8';
  let titleClasses = 'text-left';
  if (side === 'right') {
    titleClasses = 'text-right';
    classes = 'ml-10 rounded-l-lg self-end items-end pl-8 pr-5';
  }
  return (
    <div
      className={`flex flex-col bg-secondary text-primary py-5 w-[95%] ${classes}`}
    >
      <h1 className={`text-xl w-full font-bold mb-5 ${titleClasses}`}>{title}</h1>
      {children}
    </div>
  );
}
