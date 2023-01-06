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
    <div className={`${wrapperClassName || ''}`}>
      <div className="flex items-baseline">
        <h2 className="text-base font-semibold text-white">{label}</h2>
        <span className="ml-4 opacity-50 text-white text-sm">{sublabel}</span>
      </div>
      <TextInput {...inputProps} />
    </div>
  );
}
