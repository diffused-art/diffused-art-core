import { ChangeEventHandler, ReactNode } from 'react';
import TextInput from '../base/text-input';

interface Props {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
  allowedSizes: number[];
  defaultValueWidth?: number;
  defaultValueHeight?: number;
  onChangeWidth: ChangeEventHandler<HTMLInputElement> | undefined;
  onChangeHeight: ChangeEventHandler<HTMLInputElement> | undefined;
  required?: boolean;
}

export default function LabeledSizeInput({
  label,
  sublabel,
  wrapperClassName,
  allowedSizes,
  defaultValueWidth,
  defaultValueHeight,
  onChangeWidth,
  onChangeHeight,
  required,
}: Props) {
  const validSizesPattern = allowedSizes.join('|');
  const pattern = `^(${validSizesPattern})$`;
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px] px-3">
        <h2 className="text-[16px] lg:text-[19px]  font-normal text-white">
          {label}
        </h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          onChange={onChangeWidth}
          placeholder="width"
          pattern={pattern}
          title={`Allowed widths: ${allowedSizes.join(', ')}`}
          maxLength={4}
          suffixComponent="px"
          defaultValue={defaultValueWidth}
          required={required}
        />
        <TextInput
          onChange={onChangeHeight}
          placeholder="height"
          pattern={pattern}
          maxLength={4}
          suffixComponent="px"
          title={`Allowed heights: ${allowedSizes.join(', ')}`}
          defaultValue={defaultValueHeight}
          required={required}
        />
      </div>
    </div>
  );
}
