import React from 'react';

interface CollectionAttributeCardProps {
  title: string;
  content: string;
}
export default function CollectionAttributeCard({
  title,
  content,
  textColor,
  backgroundColor,
}) {
  return (
    <div
      style={{ color: textColor, backgroundColor }}
      className="rounded-md flex flex-col justify-center items-center mx-3 p-3 w-full"
    >
      <div className="font-bold">{title}</div>
      <div>{content}</div>
    </div>
  );
}
