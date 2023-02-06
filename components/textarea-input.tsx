import classNames from 'classnames';
import React, { ChangeEventHandler, HTMLProps } from 'react';

export interface Props extends HTMLProps<HTMLTextAreaElement> {
  onChange?: ChangeEventHandler<HTMLTextAreaElement> | undefined;
}

export default function TextareaInput(props: Props) {
  return (
    <textarea
      {...props}
      className="box-border rounded-md bg-input-bg w-full leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
    />
  );
}
