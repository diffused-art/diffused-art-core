import classNames from 'classnames';
import React, { ChangeEventHandler } from 'react';

export interface CheckboxInputProps {
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  className?: string;
  required?: boolean;
  checked?: boolean;
}

export default function CheckboxInput(props: CheckboxInputProps) {
  return (
    <input
      {...props}
      className={classNames(
        'h-6 w-6 rounded border-2 cursor-pointer bg-yellow-opaque text-yellow-opaque ring-2 ring-main-yellow focus:!ring-main-yellow form-checkbox',
        props.className ?? '',
      )}
      type="checkbox"
    />
  );
}
