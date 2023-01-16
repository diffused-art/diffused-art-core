import {
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Head from 'next/head';
import React, { useMemo, useState } from 'react';
import LabeledImageUploadInput from '../components/LabeledImageUploadInput';
import Menu from '../components/menu';
import PrimaryButton from '../components/primary-button';
import TextInput from '../components/text-input';
import Title from '../components/title';
import WizardStepsHeader from '../components/wizard-steps-header';
import { useLocalStorage } from '@solana/wallet-adapter-react';
import LabeledSelectInput from '../components/LabeledSelectInput';
import { StableDiffusionVersions } from '../enums/stable-diffusion';
import ArtistLoginRequired from '../components/artist-login-required';
import LabeledSizeInput from '../components/LabeledSizeInput';
import LabeledNumberInput from '../components/LabeledNumberInput';
import classNames from 'classnames';

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
    AIOPTIONS[AIOPTIONS.length - 1],
  );
  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<File | null>(null);
  const [width, setWidth] = useState<number>(512);
  const [height, setHeight] = useState<number>(512);
  const [cfgScale, setCFGScale] = useState<number>(10);
  const cfgLabel = useMemo(() => {
    if (cfgScale <= 5) return 'Almost nothing like your prompt';
    if (cfgScale <= 10) return 'Somewhat like your prompt';
    if (cfgScale <= 15) return 'Pretty close to your prompt';
    if (cfgScale <= 20) return 'As much like your prompt as possible';
    return 'Almost nothing like your prompt';
  }, [cfgScale]);
  // TODO: Add hook that keeps fetching preview image when it is clicked, as well as useState to track
  // TODO: Inside this hook, track the last time the preview image was fetched, and if it was fetched less than 30 seconds ago, don't fetch again
  // TODO: Introduce rate limiting on the server side using redis
  // TODO: Add overlay over the image "it might take up to 1 minute to render the preview image"
  // TODO: If a image is select, and a preview is clicked, it should upload
  // the image file to NFTSTORAGE using a real time generated seed phrase, thus setting the image_URL state
  // If no preview, when clicking Next should set the image_url (by uploading to NFT storage)
  const [previewImage, setPreviewImage] = useState<string>(
    'https://bafybeihhkdhv6zrupshzlolegygd6bgsyvvkqt7azeqayopkmew5qvkhta.ipfs.nftstorage.link/',
  );

  return (
    <div className="bg-secondary-50">
      <Head>
        <title>diffused.</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Menu />

      <ArtistLoginRequired>
        <div className="py-10 flex justify-center">
          <div className="w-full container mx-auto">
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
                  icon: (
                    <EyeIcon width={iconDimension} height={iconDimension} />
                  ),
                  isActive: false,
                },
              ]}
            />
            <Title className="pt-8">Prompt your imagination</Title>
            <div className="w-full relative mt-5">
              <TextInput
                onChange={e => setPrompt(e.target.value)}
                required
                className="w-full"
                placeholder="A portrait of a cosmonaut riding a cat in the style of Monet"
              />

              <PrimaryButton
                className={classNames(`absolute right-0 w-32 h-full`, {
                  'opacity-25': !prompt,
                })}
                disabled={!prompt}
              >
                Preview
              </PrimaryButton>
            </div>

            <div className="flex space-x-5">
              <div className="flex-1">
                <form action="#" className="w-full pt-6">
                  <div className="w-full flex flex-col space-y-5 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 px-8 py-4 border-t-2 border-b-2 rounded-sm">
                    <div className="w-full">
                      <LabeledSelectInput
                        label="Engine"
                        sublabel="AI to use for your prompt"
                        options={AIOPTIONS}
                        onValueChange={setSelectedAIOption}
                        selectedOption={selectedAIOption}
                      />
                    </div>
                    <div className="w-full">
                      <LabeledImageUploadInput
                        label="Initial image"
                        sublabel="Reference to start from (optional)"
                        image={image}
                        setImage={setImage}
                      />
                    </div>
                    <div className="w-full">
                      <LabeledNumberInput
                        required
                        label="CFG Scale"
                        sublabel="Adjust how much the image will be like your prompt. max: 20; min: 1"
                        min={1}
                        max={20}
                        onChange={e => setCFGScale(Number(e.target.value))}
                        defaultValue={cfgScale}
                        suffixComponent={cfgLabel}
                      />
                    </div>
                    <div className="w-full">
                      <LabeledSizeInput
                        required
                        label="Size"
                        sublabel="max: 1024px width / 1024 px height"
                        onChangeHeight={e => setHeight(Number(e.target.value))}
                        onChangeWidth={e => setWidth(Number(e.target.value))}
                        defaultValueHeight={height}
                        defaultValueWidth={width}
                      />
                    </div>
                    <div className="w-full md:px-5 z-0">
                      <button
                        className="relative mt-5 w-full h-[50px] md:h-[70px] bg-black hover:opacity-70 text-white rounded-md font-normal text-[18px] leading-[32px]"
                        type="submit"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="flex-1">
                <div className="pt-6">
                  <img
                    src={previewImage}
                    alt="Preview image"
                    className="max-h-[530px] w-full rounded-md"
                  />
                  <h4 className="opacity-25 text-[16px] font-light italic text-center">
                    This is a preview of your prompt
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ArtistLoginRequired>
    </div>
  );
}
