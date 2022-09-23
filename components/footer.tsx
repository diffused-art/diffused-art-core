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
    <footer className="justify-self-end flex flex-col items-center justify-end pb-5">
      {ctaEnabled && (
        <a
          className="hover:text-gray-400 transition-all mb-3"
          href="mailto:info@diffused.art"
        >
          Interested? Send us a message
        </a>
      )}

      {twitterEnabled && (
        <a
          className="hover:text-gray-400 transition-all mb-10"
          href="https://twitter.com/diffused_art"
          target="_blank"
          rel="noreferrer"
        >
          Twitter
        </a>
      )}

      <div>Powered by Solana</div>
    </footer>
  );
}
