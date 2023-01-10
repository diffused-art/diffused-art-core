import {
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Head from 'next/head';
import React from 'react';
import LabeledImageUploadInput from '../components/LabeledImageUploadInput';
import Menu from '../components/menu';
import PrimaryButton from '../components/primary-button';
import TextInput from '../components/text-input';
import Title from '../components/title';
import WizardStepsHeader from '../components/wizard-steps-header';
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import cns from 'classnames';
import { useLocalStorage } from '@solana/wallet-adapter-react';
import LabeledSelectInput from '../components/LabeledSelectInput';
import { StableDiffusionVersions } from '../enums/stable-diffusion';
import { Disclosure, Transition } from '@headlessui/react';

const AIOPTIONS = [
  ...(Object.keys(StableDiffusionVersions)
    .map(key =>
      key.startsWith('stable')
        ? null
        : { value: StableDiffusionVersions[key], label: key },
    )
    .filter(Boolean) as { value: string; label: string }[]),
];

export default function CreatePage() {
  const iconDimension = 16;
  const [selectedAIOption, setSelectedAIOption] = useLocalStorage(
    'selected-ai-version',
    AIOPTIONS[0],
  );

  return (
    <div className="px-6 py-4 bg-secondary-50">
      <Head>
        <title>diffused.</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Menu />

      <div className="pt-16 flex justify-center">
        <div className="w-full container">
          <WizardStepsHeader
            items={[
              {
                label: 'Prompt',
                icon: (
                  <PencilIcon width={iconDimension} height={iconDimension} />
                ),
                isActive: true,
              },
              {
                label: 'Configure',
                icon: (
                  <AdjustmentsHorizontalIcon
                    width={iconDimension}
                    height={iconDimension}
                  />
                ),
                isActive: false,
              },
              {
                label: 'Publish',
                icon: <EyeIcon width={iconDimension} height={iconDimension} />,
                isActive: false,
              },
            ]}
          />

          <Title className="pt-8">Prompt your imagination</Title>

          <form action="#" className="w-full pt-6">
            <div className="w-full relative">
              <TextInput
                className="w-full"
                placeholder="A portrait of a cosmonaut riding a cat in the style of Monet"
              />

              <PrimaryButton className="absolute right-0 w-32 h-full">
                Preview
              </PrimaryButton>
            </div>

            <Disclosure>
              {({ open }) => (
                <>
                  <div className="w-full pt-6 text-white">
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <h2 className="text-[19px] leading-[23.75px] font-[400]">
                          More options
                        </h2>
                        <Disclosure.Button>
                            {open ? (
                              <MinusCircleIcon width={20} height={20} />
                            ) : (
                              <PlusCircleIcon width={20} height={20} />
                            )}
                        </Disclosure.Button>
                      </div>
                    </>
                  </div>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Disclosure.Panel
                      className={cns(
                        `w-full grid grid-cols-2 gap-4 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 px-8 py-4 border-t-2 border-b-2 rounded-sm`,
                        { '!p-0 !border-none': !open },
                      )}
                    >
                      {open && (
                        <>
                          <div className="w-full">
                            <LabeledImageUploadInput
                              label="Initial image"
                              sublabel="Upload a reference for your prompt"
                            />
                          </div>
                          <div className="w-full">
                            <LabeledSelectInput
                              label="Engine"
                              sublabel="The AI engine use for your prompt"
                              options={AIOPTIONS}
                              onValueChange={setSelectedAIOption}
                              selectedOption={selectedAIOption}
                            />
                          </div>
                        </>
                      )}
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          </form>
        </div>
      </div>
    </div>
  );
}
