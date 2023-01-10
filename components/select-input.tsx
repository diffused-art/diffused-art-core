import { Listbox } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

import IconWrapper from './IconWrapper';

export interface SelectInputProps {
  placeholder?: string;
  selectedOption?: { value: string; label: string };
  options: { value: string; label: string }[];
  onValueChange: (value: { value: string; label: string }) => void;
}

export default function SelectInput({
  placeholder = '',
  selectedOption,
  onValueChange,
  options,
}: SelectInputProps) {
  return (
    <Listbox value={selectedOption} onChange={onValueChange}>
      <Listbox.Button>{selectedOption?.label}</Listbox.Button>
      <Listbox.Options>
        {options.map(option => (
          <Listbox.Option key={option.value} value={option}>
            {option.label}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
}
