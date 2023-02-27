import { ReactNode } from 'react';
import TextareaInput, { Props as TextAreaProps } from '../base/textarea-input';

type Props = TextAreaProps & {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
};

export default function LabeledTextareaInput({
  label,
  sublabel,
  wrapperClassName,
  ...inputProps
}: Props) {
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px] px-3">
        <h2 className="text-[19px] font-normal text-white">{label}</h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <TextareaInput {...inputProps} />
    </div>
  );
}
