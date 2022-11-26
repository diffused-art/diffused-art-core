import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import ActiveLink from './active-link';
import SettingsSVG from 'assets/svg/settings.svg';
import UserSVG from 'assets/svg/user.svg';
import FavoriteSVG from 'assets/svg/star.svg';
import SunSVG from 'assets/svg/sun.svg';
import ConfigSVG from 'assets/svg/settings-sliders.svg';

export default function MobileMenu() {
  return (
    <ul className="">
        <li>
            <ActiveLink activeClassName='active' href="/about">
                <span className="mob-nav-link text-secondary px-2 py-2 block text-xl rounded-md hover:bg-secondary hover:text-primary">About</span>
            </ActiveLink>
        </li>
        <li>
            <ActiveLink activeClassName='active' href="/create">
                <span className="mob-nav-link text-secondary px-2 py-2 block text-xl rounded-md hover:bg-secondary hover:text-primary">Create</span>
            </ActiveLink>
        </li>
        <li className=' pb-2'>
            <ActiveLink activeClassName='active' href="/explore">
                <span className="mob-nav-link text-secondary px-2 py-2 block text-xl rounded-md hover:bg-secondary hover:text-primary">Explore</span>
            </ActiveLink>
        </li>
        <li>
            <button className={`hover:bg-primary text-white group flex w-full items-center rounded-md px-2 py-2 text-xl justify-between`}>
                Profile
                <UserSVG className="mr-3 h-5 w-5" aria-hidden="true" fill="#9F9F9F"/>
            </button>
        </li>
        <li>
            <button className={`hover:bg-primary text-white group flex w-full items-center rounded-md px-2 py-2 text-xl justify-between`}>
                Favorites
                <FavoriteSVG className="mr-3 h-5 w-5" aria-hidden="true" fill="#9F9F9F"/>
            </button>
        </li>
        <li>
            <button className={`hover:bg-primary text-white group flex w-full items-center rounded-md px-2 py-2 text-xl justify-between`}>
                Settings
                <ConfigSVG className="mr-3 h-5 w-5" aria-hidden="true" fill="#9F9F9F"/>
            </button>
        </li>
        <li>
            <button className={`hover:bg-primary text-white group flex w-full items-center rounded-md px-2 py-2 text-xl justify-between`}>
                Darkmode
                <SunSVG className="mr-3 h-5 w-5" aria-hidden="true" fill="#9F9F9F"/>
            </button>
        </li>
    </ul>
  )
}