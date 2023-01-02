import React, { HTMLProps } from 'react';

export default function TextInput(props: HTMLProps<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-md bg-secondary-100 h-8 py-3 px-4 w-96 outline-none ${
        props.className || ''
      }`}
    />
  );
}
