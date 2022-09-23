import React from 'react';

export default function Footer() {
  return (
    <footer className="!min-h-[20vh] flex flex-col items-center justify-end pb-5">
      <a
        className="hover:text-gray-400 transition-all mb-3"
        href="mailto:info@diffused.art"
      >
        Interested? Drop us a message
      </a>
      <a
        className="hover:text-gray-400 transition-all mb-10"
        href="https://twitter.com/diffused_art"
        target="_blank"
        rel="noreferrer"
      >
        Twitter
      </a>

      <div>Powered by Solana</div>
    </footer>
  );
}
