import { ReactNode } from 'react';
import SelectInput, { SelectInputProps } from './select-input';

type Props = SelectInputProps & {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
};

export default function LabeledSelectInput({
  label,
  sublabel,
  wrapperClassName,
  ...selectProps
}: Props) {
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px]">
        <h2 className="text-[16px] lg:text-[19px] font-normal text-white">{label}</h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <SelectInput {...selectProps} />
    </div>
  );
}
