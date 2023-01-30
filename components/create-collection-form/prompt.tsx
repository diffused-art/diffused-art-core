import axios from 'axios';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { StableDiffusionVersions } from '../../enums/stable-diffusion';
import useAnonymousNFTStorage from '../../hooks/useAnonymousNFTStorage';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../hooks/useCreateCollectionStore';
import useToast, { ToastIconEnum } from '../../hooks/useToast';
import LabeledImageUploadInput from '../LabeledImageUploadInput';
import LabeledNumberInput from '../LabeledNumberInput';
import LabeledSelectInput from '../LabeledSelectInput';
import LabeledSizeInput from '../LabeledSizeInput';
import PrimaryButton from '../primary-button';
import TextInput from '../text-input';
import Title from '../title';
import { CreateCollectionFormSteps } from '../wizard-steps-header';

const AIOPTIONS = [
  ...(Object.keys(StableDiffusionVersions)
    .map(key =>
      key.startsWith('stable')
        ? null
        : { value: StableDiffusionVersions[key], label: key },
    )
    .filter(Boolean) as { value: string; label: string }[]),
];

export default function CreateCollectionFormPrompt() {
  const toast = useToast();
  const [loadingPreviewImage, setLoadingPreviewImage] = useState(false);
  const { state, dispatch } = useCreateCollectionStore();
  const cfgLabel = useMemo(() => {
    if (state.cfgScale <= 5) return 'Almost nothing like your prompt';
    if (state.cfgScale <= 10) return 'Somewhat like your prompt';
    if (state.cfgScale <= 15) return 'Pretty close to your prompt';
    if (state.cfgScale <= 20) return 'As much like your prompt as possible';
    return 'Almost nothing like your prompt';
  }, [state.cfgScale]);
  const generateAIPreviewImage = useCallback(async () => {
    setLoadingPreviewImage(true);
    return axios
      .post('/api/collection/create/ai-generate', {
        prompt: state.prompt,
        init_image: state.initImage,
        width: state.width,
        height: state.height,
        cfgScale: state.cfgScale,
        engine: state.engine,
      })
      .then(({ data }) => {
        console.log(data.imageURL);
        dispatch({
          type: ActionTypesCreateCollectionStore.SetFieldValue,
          payload: {
            field: 'previewImage',
            value: data.imageURL,
          },
        });
      })
      .catch(error => {
        toast({
          message: error.response.data || 'Server error',
          icon: ToastIconEnum.ERROR,
        });
        setLoadingPreviewImage(false);
      });
  }, [
    dispatch,
    state.cfgScale,
    state.engine,
    state.height,
    state.initImage,
    state.prompt,
    state.width,
    toast,
  ]);

  const { uploadImage } = useAnonymousNFTStorage();

  const uploadInitImage = useCallback(
    async (value: File | null) => {
      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'initImageFile',
          value,
        },
      });

      if (!value) return;
      const imageUrl = await uploadImage(value);
      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'initImage',
          value: imageUrl,
        },
      });
    },
    [dispatch, uploadImage],
  );

  if (state.step !== 'prompt') return null;

  const canGoToNextPage =
    state.prompt &&
    state.engine &&
    state.cfgScale > 0 &&
    state.cfgScale <= 20 &&
    state.width > 0 &&
    state.height > 0;

  return (
    <div className="py-10 flex justify-center">
      <div className="w-full container mx-auto">
        <CreateCollectionFormSteps activeStep={1} />
        <Title className="pt-8">Prompt your imagination</Title>
        <div className="w-full relative mt-5">
          <TextInput
            onChange={e =>
              dispatch({
                type: ActionTypesCreateCollectionStore.SetFieldValue,
                payload: {
                  field: 'prompt',
                  value: e.target.value,
                },
              })
            }
            required
            className="w-full"
            placeholder="A portrait of a cosmonaut riding a cat in the style of Monet"
          />

          <PrimaryButton
            className={classNames(`absolute right-0 w-40 h-full `, {
              'opacity-25': !state.prompt || loadingPreviewImage,
            })}
            disabled={!state.prompt || loadingPreviewImage}
            onClick={generateAIPreviewImage}
          >
            {loadingPreviewImage ? 'Loading preview...' : 'Preview'}
          </PrimaryButton>
        </div>

        <div className="flex space-x-5">
          <div className="flex-1">
            <form
              action="#"
              className="w-full pt-6"
              onSubmit={() =>
                dispatch({
                  type: ActionTypesCreateCollectionStore.SetStep,
                  payload: 'configuration',
                })
              }
            >
              <div className="w-full flex flex-col space-y-5 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 px-8 py-4 border-t-2 border-b-2 rounded-sm">
                <div className="w-full">
                  <LabeledSelectInput
                    label="Engine"
                    sublabel="AI to use for your prompt"
                    options={AIOPTIONS}
                    onValueChange={value =>
                      dispatch({
                        type: ActionTypesCreateCollectionStore.SetFieldValue,
                        payload: {
                          field: 'engine',
                          value: value.value,
                        },
                      })
                    }
                    selectedOption={state.engine}
                  />
                </div>
                <div className="w-full">
                  <LabeledImageUploadInput
                    label="Initial image"
                    sublabel="Reference to start from (optional)"
                    image={state.initImageFile}
                    setImage={uploadInitImage}
                  />
                </div>
                <div className="w-full">
                  <LabeledNumberInput
                    required
                    label="CFG Scale"
                    sublabel="Adjust how much the image will be like your prompt. max: 20; min: 1"
                    min={1}
                    max={20}
                    onChange={e =>
                      dispatch({
                        type: ActionTypesCreateCollectionStore.SetFieldValue,
                        payload: {
                          field: 'cfgScale',
                          value: Number(e.target.value),
                        },
                      })
                    }
                    defaultValue={state.cfgScale}
                    suffixComponent={cfgLabel}
                  />
                </div>
                <div className="w-full">
                  <LabeledSizeInput
                    required
                    label="Size"
                    sublabel="max: 1024px width / 1024 px height"
                    onChangeHeight={e =>
                      dispatch({
                        type: ActionTypesCreateCollectionStore.SetFieldValue,
                        payload: {
                          field: 'height',
                          value: Number(e.target.value),
                        },
                      })
                    }
                    onChangeWidth={e =>
                      dispatch({
                        type: ActionTypesCreateCollectionStore.SetFieldValue,
                        payload: {
                          field: 'width',
                          value: Number(e.target.value),
                        },
                      })
                    }
                    defaultValueHeight={state.height}
                    defaultValueWidth={state.width}
                  />
                </div>
                <div className="w-full md:px-5 z-0">
                  <button
                    className={classNames(
                      `relative mt-5 w-full h-[50px] md:h-[70px] bg-black 
                       text-white rounded-md font-normal text-[18px] leading-[32px]`,
                      {
                        'opacity-25': !canGoToNextPage || loadingPreviewImage,
                        'hover:opacity-70':
                          canGoToNextPage && !loadingPreviewImage,
                      },
                    )}
                    type="submit"
                    disabled={!canGoToNextPage || loadingPreviewImage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="flex-1">
            <div className="pt-6 rounded-sm">
              <div className="relative">
                {loadingPreviewImage && (
                  <>
                    <div className="absolute w-full h-full bg-gray-100 opacity-20"></div>
                    <div className="absolute font-bold ml-[10%] flex justify-center items-center h-full">
                      Loading preview, please wait...
                    </div>
                  </>
                )}
                <img
                  src={state.previewImage}
                  alt="Preview image"
                  onLoad={() => setLoadingPreviewImage(false)}
                  className={classNames('max-h-[530px] w-full rounded-md', {
                    'opacity-25': loadingPreviewImage,
                  })}
                />
              </div>

              <h4 className="opacity-25 text-[16px] font-light italic text-center">
                This is a preview of your prompt
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
