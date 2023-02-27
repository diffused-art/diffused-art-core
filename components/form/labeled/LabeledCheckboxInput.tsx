import { ChangeEventHandler, ReactNode } from 'react';
import CheckboxInput, { CheckboxInputProps } from '../base/checkbox-input';

interface Props extends CheckboxInputProps {
  label: ReactNode;
  wrapperClassName?: string;
  onChange: ChangeEventHandler<HTMLInputElement> | undefined;
}

export default function LabeledCheckboxInput({
  label,
  wrapperClassName,
  onChange,
  ...inputProps
}: Props) {
  return (
    <div className={`md:px-5 flex items-center ${wrapperClassName || ''}`}>
      <div className="flex px-3">
        <h2 className="text-[16px] lg:text-[19px] font-normal text-white">{label}</h2>
      </div>
      <CheckboxInput onChange={onChange} {...inputProps} />
    </div>
  );
}
