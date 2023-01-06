import React, { HTMLProps } from 'react';

export interface Props extends HTMLProps<HTMLInputElement> {}

export default function TextInput(props: Props) {
  return (
    <input
      {...props}
      className={`rounded-md bg-secondary-100 h-8 py-3 px-4 outline-none ${
        props.className || ''
      }`}
    />
  );
}
