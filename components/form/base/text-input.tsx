import classNames from 'classnames';
import React, { ChangeEventHandler, HTMLProps } from 'react';

export interface Props extends HTMLProps<HTMLInputElement> {
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  suffixComponent?: string | JSX.Element;
}

export default function TextInput({ suffixComponent, ...props }: Props) {
  return (
    <div
      className={classNames(
        'relative box-border rounded-md bg-input-bg h-[40px]',
        props.className,
      )}
    >
      <input
        {...props}
        className="bg-transparent w-full h-full leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
      />
      <span className="absolute inset-y-0 right-0 flex items-center pr-5 text-[12px] lg:text-[18px]">
        {suffixComponent}
      </span>
    </div>
  );
}
