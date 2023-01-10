import React from 'react';
import {
  AdjustmentsHorizontalIcon,
  CogIcon,
  StarIcon,
  SunIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import IconDiffused from '../icons/icon-diffused';
import TextInput from './text-input';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';

export default function Menu() {
  return (
    <div className="flex items-center justify-evenly space-x-2 h-16">
      <div className="bg-primary-100 rounded-md w-full px-2 flex items-center  h-full">
        <IconDiffused />

        <TextInput
          placeholder="Type your prompt here..."
          aria-label="prompt search"
          className="ml-auto mr-auto w-96"
        />

        <div className="flex items-center space-x-2 h-full">
          {[
            {
              label: 'About',
              href: '/about',
              isActive: false,
            },
            {
              label: 'Explore',
              href: '/',
              isActive: true,
            },
            {
              label: 'Create',
              href: '/create-collection',
              isActive: false,
            },
          ].map(item => (
            <a
              href={item.href}
              key={item.href}
              className={`text-main-yellow w-16 h-full flex items-center justify-center relative ${
                item.isActive
                  ? 'after:absolute after:bottom-0 after:w-full after:h-1 after:bg-main-yellow'
                  : ''
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <HeadlessMenu as="div" className="h-full">
        <HeadlessMenu.Button className="w-16 rounded px-2 h-full bg-primary-100  outline-none flex items-center justify-center">
          <CogIcon className="h-6 w-6 text-main-yellow hover:rotate-180 transition-transform ease-in" />
        </HeadlessMenu.Button>
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <HeadlessMenu.Items
            className="w-48 rounded-md px-2 py-4 space-y-2 bg-secondary-100 text-white absolute right-0
          origin-top-right divide-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            {[
              { icon: UserIcon, label: 'Profile' },
              { icon: StarIcon, label: 'Favorite' },
              { icon: AdjustmentsHorizontalIcon, label: 'Settings' },
              { icon: SunIcon, label: 'Darkmode' },
            ].map(item => (
              <HeadlessMenu.Item key={item.label}>
                <div className="flex items-center cursor-pointer">
                  <item.icon className="h-6 w-6 pr-2 opacity-50" />
                  {item.label}
                </div>
              </HeadlessMenu.Item>
            ))}
          </HeadlessMenu.Items>
        </Transition>
      </HeadlessMenu>
      <button
        aria-label="connect wallet"
        className="rounded-md px-4 h-full bg-main-yellow text-black "
      >
        Connect
      </button>
    </div>
  );
}