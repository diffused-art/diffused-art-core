import React from 'react';
import {
  AdjustmentsHorizontalIcon,
  CogIcon,
  StarIcon,
  SunIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import IconDiffused from '../icons/icon-diffused';

export default function Menu() {
  return (
    <div className="flex items-center justify-evenly space-x-2 h-16">
      <div className="bg-primary-100 rounded-md w-full px-2 flex items-center  h-full">
        <IconDiffused />

        <input
          placeholder="Type your prompt here..."
          className="ml-auto mr-auto rounded-md bg-secondary-100 h-8 py-3 px-4 w-96 outline-none"
          aria-label="prompt search"
        />

        <div className="flex items-center space-x-2 h-full">
          {[
            {
              label: 'About',
            },
            {
              label: 'Explore',
            },
            {
              label: 'Create',
            },
          ].map(item => (
            <a
              href="#"
              className="text-main-yellow border-b-4 border-main-yellow w-16 h-full flex items-center justify-center"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild={true}>
          <button
            aria-label="open menu"
            className="w-16 rounded px-2 h-full bg-primary-100  outline-none flex items-center justify-center"
          >
            <CogIcon className="h-6 w-6 text-main-yellow hover:rotate-180 transition-transform ease-in" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="w-48 rounded-md px-2 py-4 space-y-2 bg-secondary-100 text-white">
            {[
              { icon: UserIcon, label: 'Profile' },
              { icon: StarIcon, label: 'Favorite' },
              { icon: AdjustmentsHorizontalIcon, label: 'Settings' },
              { icon: SunIcon, label: 'Darkmode' },
            ].map(item => (
              <DropdownMenu.Item className="flex items-center">
                <item.icon className="h-6 w-6 pr-2 opacity-50" />
                {item.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        aria-label="connect wallet"
        className="rounded-md px-4 h-full bg-main-yellow text-black "
      >
        Connect
      </button>
    </div>
  );
}
