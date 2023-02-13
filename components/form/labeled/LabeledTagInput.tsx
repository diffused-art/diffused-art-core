import { ReactNode } from 'react';
import TagSelectInput, { TagSelectInputProps } from '../base/tag-select-input';

type Props = TagSelectInputProps & {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
};

export default function LabeledTagInput({
  label,
  sublabel,
  wrapperClassName,
  ...selectProps
}: Props) {
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px] px-3">
        <h2 className="text-[16px] lg:text-[19px] font-normal text-white">
          {label}
        </h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <TagSelectInput {...selectProps} />
    </div>
  );
}
