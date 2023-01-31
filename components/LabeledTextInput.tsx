import { ReactNode } from 'react';
import TextInput, { Props as TextInputProps } from './text-input';

type Props = TextInputProps & {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
};

export default function LabeledTextInput({
  label,
  sublabel,
  wrapperClassName,
  ...inputProps
}: Props) {
  return (
    <div className={`px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px] px-3">
        <h2 className="text-[19px] font-normal text-white">{label}</h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[16px] leading-[20px]">{sublabel}</span>
      </div>
      <TextInput {...inputProps} />
    </div>
  );
}
