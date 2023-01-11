import React, { ChangeEventHandler, HTMLProps } from 'react';

export interface Props extends HTMLProps<HTMLInputElement> {
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
}

export default function TextInput(props: Props) {
  return (
    <input
      {...props}
      className={`rounded-md bg-input-bg h-[40px] leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25 ${
        props.className || ''
      }`}
    />
  );
}
