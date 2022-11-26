import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import React from 'react';
import { Fragment, useRef, useState, useEffect } from "react"
import SettingsMenu from './settings-menu';
import MobileMenu from './mobile-menu';
import ActiveLink from './active-link';
import Tag from './tag';
import { Popover, Transition } from '@headlessui/react'
import LogoSVG from 'assets/svg/logo-diffused.svg';
import UserSVG from 'assets/svg/user.svg';

import Img1 from 'assets/temp/img1.png';
import Img2 from 'assets/temp/img2.png';
import Img3 from 'assets/temp/img3.png';


function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}


export default function Header() {
  const [showMenu, setShowMenu] = useState(false)
  const wallet = useWallet();

  let timeout // NodeJS.Timeout
  const timeoutDuration = 400

  const buttonRef = useRef(null) // useRef<HTMLButtonElement>(null)
  const [openState, setOpenState] = useState(false)

  const toggleMenu = (open) => {
    // log the current open state in React (toggle open state)
    setOpenState((openState) => !openState)
    // toggle the menu by clicking on buttonRef
    buttonRef?.current?.click() // eslint-disable-line
  }

  // Open the menu after a delay of timeoutDuration
  const onHover = (open, action) => {
    // if the modal is currently closed, we need to open it
    // OR
    // if the modal is currently open, we need to close it
    if (
      (!open && !openState && action === "onMouseEnter") ||
      (open && openState && action === "onMouseLeave")
    ) {
      // clear the old timeout, if any
      clearTimeout(timeout)
      // open the modal after a timeout
      timeout = setTimeout(() => toggleMenu(open), timeoutDuration)
    }
    // else: don't click! 😁
  }

  const handleClick = (open) => {
    setOpenState(!open) // toggle open state in React state
    clearTimeout(timeout) // stop the hover timer if it's running
  }

  const LINK_STYLES = classNames(
    "nav-link  hover:text-opacity-75 px-4 py-4 h-[70px] block ",
  )
  const handleClickOutside = (event) => {
    if (buttonRef.current && !buttonRef.current.contains(event.target)) {
      event.stopPropagation()
    }
  }
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  })

  return (
    <div className="sticky md:top-8 max-w-6xl mx-auto md:mt-8 z-50 md:pb-[70px] w-full drop-shadow-md bg-primary md:bg-transparent">
      <div className='flex w-full md:gap-3 px-4 md:px-0 h-full items-center md:items-start'>
        <div className='md:bg-primary md:rounded-[10px] grow flex md:px-8 relative'>
          <div className='flex justify-between self-center w-full h-[70px] items-center'>
            <Link href='/'><div className='hover:opacity-70 cursor-pointer flex items-center'><LogoSVG /></div></Link>
            <div className='md:hidden mr-4'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white bg-fourth hover:bg-third focus:outline-none focus:bg-third focus:text-white"
            >
          
              <svg
                className="block h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
        
              <svg
                className="hidden h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            </div>
            <ul className='nav hidden md:flex gap-4 text-xl'>
              <li>
                <ActiveLink activeClassName='active' href="/about">
                  <span className="nav-link text-secondary hover:text-opacity-75 px-4 py-4 h-[70px] block">About</span>
                </ActiveLink>
              </li>
              <li>
                <Popover>
                  {({ open }) => (
                    <div
                      onMouseEnter={() => onHover(open, "onMouseEnter")}
                      onMouseLeave={() => onHover(open, "onMouseLeave")}
                      className="flex flex-col"
                    >
                      <Popover.Button ref={buttonRef} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-transparent focus-visible:ring-opacity-0">
                        <div
                          className={classNames(
                            open ? "text-secondary text-opacity-75" : "text-secondary",
                            LINK_STYLES
                          )}
                          onClick={() => handleClick(open)}
                        >
                          <span>
                          <ActiveLink activeClassName='active' href="/about">
                           <span> Explore</span>      
                            </ActiveLink>

                          </span>
                        </div>
                      </Popover.Button>

                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 -translate-y-10"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-10"
                      >
                        <Popover.Panel static className="absolute -z-10 w-full h-60 left-0 top-[65px] pt-1 mx-auto bg-third rounded-br-[10px] rounded-bl-[10px] overflow-hidden">
                          <div className='p-8 grid grid-cols-3 gap-8'>
                            <div className='col-span-2'>
                              <section>
                                <h2 className='text-xl text-white mb-8'>The best series</h2>
                                <div className='flex gap-4'>
                                  <div className='card'>
                                    <div className='card-info mb-2 text-base'>
                                      <a href='#' title=''>
                                        <h3 className='text-white'>horizon(te)s #44</h3>
                                        <span className='text-white opacity-50 font-sansLight'>@zachlieberman.tez</span>
                                      </a>
                                    </div>
                                    <div className='card-img object-cover transition-transform ease-in-out duration-300'>
                                      <a href='#' title=''>
                                        <img src={Img1.src} alt='' className='rounded-[10px]' />
                                      </a>
                                    </div>
                                  </div>
                                  <div className='card'>
                                    <div className='card-info mb-2 text-base'>
                                      <a href='#' title=''>
                                        <h3 className='text-white'>Thug Life for ever</h3>
                                        <span className='text-white opacity-50 font-sansLight'>@Rodrigue</span>
                                      </a>
                                    </div>
                                    <div className='card-img object-cover'>
                                      <a href='#' title=''>
                                        <img src={Img2.src} alt='' className='rounded-[10px]' />
                                      </a>
                                    </div>
                                  </div>
                                  <div className='card'>
                                    <div className='card-info mb-2 text-base'>
                                      <a href='#' title=''>
                                        <h3 className='text-white'>Full nudes</h3>
                                        <span className='text-white opacity-50 font-sansLight'>@0xHDJS</span>
                                      </a>
                                    </div>
                                    <div className='card-img object-cover'>
                                      <a href='#' title=''>
                                        <img src={Img3.src} alt='' className='rounded-[10px]' />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </section>
                            </div>
                            <div className='col-span-1'>
                              <section>
                                <h2 className='text-xl text-white mb-8'>Keywords</h2>
                                <div className='inline-flex gap-2 flex-wrap'>
                                <Tag name='Scultpure' count='23' />
                                <Tag name='Noise' count='120' />
                                <Tag name='3D' count='46' />
                                <Tag name='Neo-futurism' count='69' />
                                <Tag name='Impressionism' count='234' />
                                </div>
                              </section>
                            </div>
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </div>
                  )}
                </Popover>
              </li>
              <li>
                <ActiveLink activeClassName='active' href="/create">
                  <span className="nav-link text-secondary hover:text-opacity-75 px-4 py-4 h-[70px] block">Create</span>
                </ActiveLink>
              </li>


            </ul>
          </div>
        </div>
        <div className="hidden md:block flex-none">
          <SettingsMenu /> 
        </div>
        <div className="flex-none">
          {wallet.connected ? (
            <WalletDisconnectButton className="!bg-secondary !text-primary h-[45px] md:!h-[70px] !font-sans !text-lg" />
          ) : (
            <WalletMultiButton className="!bg-secondary !text-primary h-[45px] md:!h-[70px] !font-sans !text-lg" />
          )}
        </div>
      </div>
      {/* Menu open: "block", Menu closed: "hidden" */}
      
      <div className={`md:hidden bg-third ${showMenu ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 sm:px-3">
            <MobileMenu />
        </div>
      </div>
    </div>
    
  );
}
