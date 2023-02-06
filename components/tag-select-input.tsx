import { Combobox, Transition } from '@headlessui/react';
import { TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

interface TagOptionInterface {
  value: string;
  label: string;
  count: number;
}
export interface TagSelectInputProps {
  placeholder?: string;
  selectedOptions?: string[];
  options: { value: string; label: string; count: number }[];
  onValueChange: (value: TagOptionInterface) => void;
  onValueRemove: (value: TagOptionInterface) => void;
  maxTags?: number;
}

const exclude = (baseOptions, arrayToExclude) =>
  baseOptions.filter(
    o1 => arrayToExclude.map(o2 => o2).indexOf(o1.value) === -1,
  );

export default function TagSelectInput({
  placeholder = '',
  selectedOptions = [],
  onValueChange,
  onValueRemove,
  options,
  maxTags = 5,
}: TagSelectInputProps) {
  let validOptions = exclude(options, selectedOptions);
  const [query, setQuery] = useState('');

  validOptions =
    query === ''
      ? validOptions
      : validOptions.filter(option =>
          option.label
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, '')),
        );

  const selectedOptionsObjects = selectedOptions
    .map(value => options.find(option => option.value === value))
    .filter(Boolean) as TagOptionInterface[];
  const onValueChangeCB = useCallback(
    option => {
      if (selectedOptionsObjects.length >= maxTags) {
        alert(`You can only select up to ${maxTags} tags`);
        return;
      }
      onValueChange(option);
    },
    [onValueChange, selectedOptionsObjects, maxTags],
  );

  const onValueRemoveCB = useCallback(
    option => {
      if (confirm('Are you sure you want to remove this tag?')) {
        onValueRemove(option);
      }
    },
    [onValueRemove],
  );

  return (
    <div className="w-full z-10">
      <Combobox onChange={onValueChangeCB}>
        <div className="relative">
          <Combobox.Button className="w-full">
            <Combobox.Input
              onChange={event => setQuery(event.target.value)}
              placeholder={placeholder}
              className="border-none ring-0 relative w-full focus:outline-none 
            focus-visible:ring-0 placeholder-white placeholder-opacity-25
            cursor-pointer rounded-lg h-[40px] bg-input-bg py-2 pl-3 pr-10 text-left"
            />
          </Combobox.Button>

          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-2">
            <TagIcon className="text-white" height={24} aria-hidden="true" />
          </span>
        </div>
        <Transition
          as="div"
          className="relative"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Combobox.Options className="z-10 shadow-lg shadow-yellow-50/50 absolute max-h-60 w-full overflow-auto rounded-md bg-secondary-90 py-1 text-[14px] lg:text-[18px] italic">
            {validOptions.map(option => (
              <Combobox.Option
                key={option.value}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none rounded-sm p-2 ${
                    active ? 'bg-secondary-100 text-white' : 'text-gray-400'
                  }`
                }
              >
                {option.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Transition>
      </Combobox>
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedOptionsObjects.map(option => (
          <span
            key={option.value}
            onClick={() => onValueRemoveCB(option)}
            className="group bg-primary-100 hover:bg-opacity-50 relative text-white uppercase text-xs rounded-md py-2 px-3 cursor-pointer"
          >
            <span className="hover:opacity-50">
              {option.label}{' '}
              <span className="opacity-25 ml-2">{option.count}</span>
            </span>
            <TrashIcon
              className="text-white absolute top-1 mt-[1px] right-1 hidden group-hover:block"
              height={18}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
