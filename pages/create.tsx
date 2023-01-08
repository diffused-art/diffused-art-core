import {
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Head from 'next/head';
import React from 'react';
import LabeledImageUploadInput from '../components/LabeledImageUploadInput';
import LabeledTextInput from '../components/LabeledTextInput';
import Menu from '../components/menu';
import PrimaryButton from '../components/primary-button';
import TextInput from '../components/text-input';
import Title from '../components/title';
import WizardStepsHeader from '../components/wizard-steps-header';

export default function CreatePage() {
  const iconDimension = 16;
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

      <div className="w-full px-20 pt-16">
        <WizardStepsHeader
          items={[
            {
              label: 'Prompt',
              icon: <PencilIcon width={iconDimension} height={iconDimension} />,
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

          <div className="w-full pt-6">
            <h2 className="text-base">More options</h2>

            <div className="w-full grid grid-cols-2 gap-4 bg-secondary-90 px-8 py-4 border-t-2 border-t-secondary-90">
              <div className="w-full">
                <LabeledImageUploadInput
                  label="Initial image"
                  sublabel="Upload a reference for your prompt"
                />
              </div>
              <div className="w-full">
                <LabeledTextInput
                  label="Engine"
                  sublabel="The AI engine use for your prompt"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
