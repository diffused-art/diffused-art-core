import { Listbox, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';

export interface SelectInputProps {
  placeholder?: string;
  selectedOption?: string;
  options: { value: string; label: string }[];
  onValueChange: (value: { value: string; label: string }) => void;
}

export default function SelectInput({
  placeholder = '',
  selectedOption,
  onValueChange,
  options,
}: SelectInputProps) {
  const selectedOptionObject = options.find(
    ({ value }) => value === selectedOption,
  );
  return (
    <div className="w-full z-10">
      <Listbox value={selectedOptionObject} onChange={onValueChange}>
        <Listbox.Button className="relative w-full cursor-pointer rounded-lg h-[40px] bg-input-bg py-2 pl-3 pr-10 text-left">
          <span className="block truncate font-light italic text-[14px] lg:text-[18px]">
            {selectedOptionObject?.label ?? placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className="text-white"
              height={10}
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as="div"
          className="relative"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="z-10 shadow-lg shadow-yellow-50/50 absolute max-h-60 w-full overflow-auto rounded-md bg-secondary-90 py-1 text-[14px] lg:text-[18px] italic">
            {options.map(option => (
              <Listbox.Option
                key={option.value}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none rounded-sm p-2 ${
                    active ? 'bg-secondary-100 text-white' : 'text-gray-400'
                  }`
                }
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );
}
