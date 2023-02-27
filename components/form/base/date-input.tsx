import { CalendarIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { ChangeEventHandler } from 'react';

export interface DateInputProps {
  min?: string;
  max?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  required?: boolean;
}

export function DateInput({
  defaultValue,
  placeholder = '',
  onChange,
  min,
  max,
  className = '',
  required,
}: DateInputProps) {
  return (
    <div
      className={classNames(
        'relative rounded-md bg-input-bg h-[40px]',
        className,
      )}
    >
      <input
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        onChange={onChange}
        type="date"
        className="bg-transparent w-full h-full cursor-pointer leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
        placeholder={placeholder}
        onClick={e => (e.target as any).showPicker()}
      />
      <span className="absolute inset-y-0 right-0 flex items-center pr-10 text-white opacity-25 text-[12px] lg:text-[18px]">
        <CalendarIcon height={24} />
      </span>
    </div>
  );
}
