import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export interface Props
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

export default function Button(props: Props) {
  return (
    <button {...props} className={`rounded-md font-light ${props.className}`} />
  );
}
