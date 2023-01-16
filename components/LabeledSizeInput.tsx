import { ChangeEventHandler, ReactNode } from 'react';
import { NumberInput } from './number-input';

interface Props {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
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
  defaultValueWidth,
  defaultValueHeight,
  onChangeWidth,
  onChangeHeight,
  required,
}: Props) {
  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px]">
        <h2 className="text-[16px] lg:text-[19px]  font-normal text-white">
          {label}
        </h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <div className="flex space-x-5">
        <NumberInput
          onChange={onChangeWidth}
          placeholder="width"
          suffixComponent="px"
          min={512}
          max={1024}
          className="flex-1"
          defaultValue={defaultValueWidth}
          required={required}
        />
        <NumberInput
          onChange={onChangeHeight}
          placeholder="height"
          suffixComponent="px"
          min={512}
          max={1024}
          className="flex-1"
          defaultValue={defaultValueHeight}
          required={required}
        />
      </div>
    </div>
  );
}
