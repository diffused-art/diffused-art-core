import { ClockIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { ChangeEventHandler } from 'react';

export interface TimeInputProps {
  min?: string;
  max?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  required?: boolean;
}

export function TimeInput({
  defaultValue,
  placeholder = '',
  onChange,
  min,
  max,
  className = '',
  required,
}: TimeInputProps) {
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
        onChange={onChange}
        type="time"
        className="bg-transparent cursor-pointer w-full h-full leading-[18px] font-[400] py-3 px-4 italic outline-none text-[14px] lg:text-[18px] placeholder-white placeholder-opacity-25"
        placeholder={placeholder}
        onClick={e => (e.target as any).showPicker()}
      />
      <span className="absolute inset-y-0 right-0 flex items-center pr-10 text-white opacity-25 text-[12px] lg:text-[18px]">
        <ClockIcon height={24} />
      </span>
    </div>
  );
}
