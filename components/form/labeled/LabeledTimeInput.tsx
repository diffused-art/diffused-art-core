import { ChangeEventHandler, ReactNode } from 'react';
import { TimeInput, TimeInputProps } from '../base/time-input';

interface Props extends TimeInputProps {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
  onChange: ChangeEventHandler<HTMLInputElement> | undefined;
}

export default function LabeledTimeInput({
  label,
  sublabel,
  wrapperClassName,
  onChange,
  ...inputProps
}: Props) {
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col mb-[10px] px-3">
        <h2 className="text-[16px] lg:text-[19px] font-normal text-white">{label}</h2>
        <div className="opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </div>
      </div>
      <TimeInput onChange={onChange} {...inputProps} />
    </div>
  );
}
