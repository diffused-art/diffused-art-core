import React from 'react';

interface FooterProps {
  ctaEnabled?: boolean;
  twitterEnabled?: boolean;
}
export default function Footer({
  ctaEnabled = true,
  twitterEnabled = true,
}: FooterProps) {
  return (
    <footer className="justify-self-end flex flex-col items-center justify-end pb-16 lg:pb-5 pt-16">
      {ctaEnabled && (
        <a
          className="hover:text-gray-400 transition-all mb-3"
          href="mailto:info@diffused.art"
        >
          Get in Touch
        </a>
      )}

      {twitterEnabled && (
        <a
          className="hover:text-gray-400 transition-all mb-3"
          href="https://twitter.com/diffused_art"
          target="_blank"
          rel="noreferrer"
        >
          Twitter
        </a>
      )}

      <a
        className="hover:text-gray-400 transition-all mb-10"
        href="https://docs.diffused.art/dream/#diffused-art-whitepaper"
        target="_blank"
        rel="noreferrer"
      >
        Whitepaper
      </a>

      <div>
        ©{new Date(Date.now()).getFullYear()} Diffused Art. All Rights Reserved.
      </div>
    </footer>
  );
}
