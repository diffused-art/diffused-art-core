import classNames from 'classnames';
import React, { ChangeEventHandler, HTMLProps } from 'react';

export interface Props extends HTMLProps<HTMLTextAreaElement> {
  onChange?: ChangeEventHandler<HTMLTextAreaElement> | undefined;
  suffixComponent?: string | JSX.Element;
}

export default function TextareaInput({ suffixComponent, ...props }: Props) {
  return (
    <div className="flex">
      <textarea
        {...props}
        className="relative box-border flex-1 rounded-md bg-input-bg h-[40px] leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
      />
      {suffixComponent}
    </div>
  );
}
