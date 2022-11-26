import React from 'react';
import ActiveLink from './active-link';
import TwitterSVG from 'assets/svg/twitter.svg';
import DiscordSVG from 'assets/svg/discord.svg';


interface FooterProps {
  ctaEnabled?: boolean;
  twitterEnabled?: boolean;
  discordEnabled?:boolean;
}
export default function Footer({
  ctaEnabled = true,
  twitterEnabled = true,
  discordEnabled = true,
}: FooterProps) {
  return (
    <footer className="max-w-6xl mx-auto w-full">
        <div className="md:flex text-center md:text-left items-center justify-between h-16">
        <div className="flex items-baseline space-x-2 text-sm">
                <span className='text-snow text-opacity-25'> ©2022 Diffused.art, All rights reserved.</span>
              </div>
          <div className='text-sm flex gap-4 items-center'>
          {ctaEnabled && (
            <div className='flex gap-2 opacity-60'>
                <ActiveLink activeClassName='active' href="/">
                  <span className="px-1 py-2 rounded-md">Bug Bounty</span>
                </ActiveLink>
                <ActiveLink activeClassName='active' href="/">
                  <span className="px-1 py-2 rounded-md">Terms of Service</span>
                </ActiveLink>
                <ActiveLink activeClassName='active' href="/">
                  <span className="px-1 py-2 rounded-md">Privacy Policy</span>
                </ActiveLink>
          </div>
      )}
      {twitterEnabled && (
        <a
          className="hover:text-gray-400 transition-all"
          href="https://twitter.com/diffused_art"
          target="_blank"
          rel="noreferrer"
        >
          <span>
            {/* <TwitterSVG fill="white" className='h-5'/> */}
          </span>
        </a>
      )}
      {discordEnabled && (
        <a
          className="hover:text-gray-400 transition-all"
          href="https://twitter.com/diffused_art"
          target="_blank"
          rel="noreferrer"
        >
          <span>
            {/* <DiscordSVG fill="white" className='h-5'/> */}
          </span>
        </a>
      )}
          </div>
        </div>
    </footer>
  );
}