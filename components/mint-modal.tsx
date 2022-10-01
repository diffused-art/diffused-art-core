import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Mint } from '@prisma/client';
import { throwConfetti } from '../utils/throwConfetti';

interface ModalProps {
  open: boolean;
  closeModal: () => void;
  isMinting: boolean;
  mintHash: string | null;
  nftPlaceholderURL: string;
  mint: Mint | null;
}

export default function MintModal({
  open,
  closeModal,
  nftPlaceholderURL,
  isMinting,
  mintHash,
  mint,
}: ModalProps) {
  const [mintRevealedImage, setMintRevealedImage] = useState<string | null>(
    null,
  );
  const cancelButtonRef = useRef(null);
  let Icon = ArrowsRightLeftIcon;
  let ModalTitle = isMinting ? 'Transaction submitted, please wait...' : '';
  if (!isMinting && mintHash) {
    Icon = CheckIcon;
    ModalTitle = `Transaction confirmed, now revealing your NFT (this may take a few minutes)...`;
  }

  if (mintRevealedImage) {
    ModalTitle = 'Your NFT has been revealed, check it out:';
  }

  const closeButtonText = !mintRevealedImage
    ? `I don't want to wait for the ${
        isMinting ? 'confirmation' : 'revelation'
      } and will check later on my wallet!`
    : 'Close';

  useEffect(() => {
    if (mint?.isRevealed) {
      throwConfetti();
      setMintRevealedImage(mint.image);
    }
    // eslint-disable-next-line
  }, [mint?.isRevealed, mint?.image]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={() => null}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-primary px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Icon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-secondary"
                    >
                      {ModalTitle}
                    </Dialog.Title>
                    {mintHash && (
                      <div className="mt-2">
                        {mintRevealedImage ? (
                          <div>
                            <img
                              src={mintRevealedImage}
                              alt="NFT art"
                              className="rounded-md"
                              height={320}
                            />
                          </div>
                        ) : (
                          <img
                            src={nftPlaceholderURL}
                            alt="Placeholder NFT art"
                            className="rounded-md"
                            height={320}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 flex justify-center">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md 
                    border border-gray-300 bg-secondary text-primary px-4 py-2 text-base
                     font-medium shadow-sm focus:ring-offset-2
                      sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={closeModal}
                    ref={cancelButtonRef}
                  >
                    {closeButtonText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
