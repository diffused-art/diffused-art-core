import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import PublishTerms from './terms';
import PublishUpload from './upload';

interface PublishModalProps {
  open: boolean;
  closeModal: () => void;
}

// Should add to data store all steps of the publish modal and continue knowing last user choices
// step 2: save collection to DB (and get back collection id on the store)
// step 3: create collection NFT on chain, create candy machine on chain, and upload candy machine config lines (nfts) (should use collection id from step 2 to fetch data)
// step 4: done, uploaded, redirect to collection page
export default function PublishModal({ open, closeModal }: PublishModalProps) {
  const cancelButtonRef = useRef(null);
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={closeModal}
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-primary px-4 pt-5 pb-4 text-left shadow-xl transition-all mx-5">
                <PublishTerms />
                <PublishUpload />
                <XCircleIcon className="absolute top-3 right-3 cursor-pointer" height={24} onClick={closeModal} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}