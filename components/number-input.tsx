import classNames from 'classnames';
import { ChangeEventHandler } from 'react';

export interface NumberInputProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  placeholder?: string;
  suffixComponent?: string | JSX.Element;
  className?: string;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
}

export function NumberInput({
  defaultValue,
  placeholder = '',
  step,
  onChange,
  min,
  max,
  suffixComponent,
  className = '',
}: NumberInputProps) {
  return (
    <div
      className={classNames(
        'relative rounded-md bg-input-bg h-[40px]',
        className,
      )}
    >
      <input
      defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        type="number"
        className="bg-transparent w-full h-full leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
        placeholder={placeholder}
      />
      <span className="absolute inset-y-0 right-0 flex items-center pr-10 text-white opacity-25 text-[12px] lg:text-[18px]">
        {suffixComponent}
      </span>
    </div>
  );
}
