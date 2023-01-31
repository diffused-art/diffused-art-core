import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../hooks/useCreateCollectionStore';
import LabeledImageUploadInput from '../LabeledImageUploadInput';
import Title from '../title';
import { CreateCollectionFormSteps } from '../wizard-steps-header';
import useResetCreateCollectionStore from '../../hooks/useCreateCollectionStore/useResetCreateCollectionStore';
import LabeledTextInput from '../LabeledTextInput';
import LabeledTextareaInput from '../LabeledTextareInput';
import axios from 'axios';

// TODO: On DB, for relationship of collection to keywords, add a seed to the keywords table
// TODO: Adds keyword selector input (list of keyword ids stored on the store, as this gets requested from BE). On click on the dropdown, show right below
// (and adds keywords to the DB, linking to collections on a one to many relationship)
export default function CreateCollectionFormConfiguration() {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, dispatch } = useCreateCollectionStore();
  const resetNode = useResetCreateCollectionStore(formRef);

  const [uploadingTeaserImage, setUploadingTeaserImage] = useState(false);

  const uploadTeaserImage = useCallback(
    async (value: File | null) => {
      if (!value) {
        dispatch({
          type: ActionTypesCreateCollectionStore.SetFieldValue,
          payload: {
            field: 'teaserImage',
            value: '',
          },
        });
        return;
      }
      setUploadingTeaserImage(true);
      var formData = new FormData();
      formData.append('image', value);
      const result = await axios.post(
        '/api/collection/create/upload-teaser-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const imageUrl = result.data.data;
      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'teaserImage',
          value: imageUrl,
        },
      });
      setUploadingTeaserImage(false);
    },
    [dispatch],
  );

  if (state.step !== 'configuration') return null;

  const canGoToNextPage =
    state.dropName &&
    state.dropDescription &&
    state.teaserImage &&
    state.keywords.length > 0;

  return (
    <>
      <div className="py-10 flex justify-center">
        <div className="w-full container mx-auto">
          <CreateCollectionFormSteps
            activeStep={2}
            goBack={() =>
              dispatch({
                type: ActionTypesCreateCollectionStore.SetStep,
                payload: 'prompt',
              })
            }
          />
          <Title className="pt-8">Configure your drop</Title>
          <form
            ref={formRef}
            action="#"
            onSubmit={e => {
              e.preventDefault();
              dispatch({
                type: ActionTypesCreateCollectionStore.SetStep,
                payload: 'configuration',
              });
            }}
          >
            <div className="grid grid-cols-2 space-x-5">
              <div className="w-full flex pt-6">
                <div className="w-full flex flex-col space-y-5 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 px-2 py-4 border-t-2 border-b-2 rounded-sm">
                  <div className="w-full">
                    <LabeledTextInput
                      label="Title"
                      placeholder="My amazing drop"
                      defaultValue={state.dropName}
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'dropName',
                            value: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="w-full">
                    <LabeledTextareaInput
                      label="Description"
                      placeholder="A dream of a thousand cats..."
                      defaultValue={state.dropDescription}
                      required
                      rows={5}
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'dropDescription',
                            value: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="w-full">
                    <LabeledImageUploadInput
                      label="Image teaser"
                      required
                      imageURL={state.teaserImage}
                      setImage={uploadTeaserImage}
                      loading={uploadingTeaserImage}
                      removeMessage="Are you sure you want to stop using the prompt preview as a image teaser for this drop?"
                    />
                  </div>
                  <div className="w-full">KEYWORDS INPUT HERE</div>
                  <div className="w-full md:px-5 z-0">
                    <button
                      className={classNames(
                        `relative mt-5 w-full h-[50px] md:h-[70px] bg-black 
                       text-white rounded-md font-normal text-[18px] leading-[32px]`,
                        {
                          'opacity-25': !canGoToNextPage,
                          'hover:opacity-70': canGoToNextPage,
                        },
                      )}
                      type="submit"
                      disabled={!canGoToNextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-90 border-t-2 border-b-2 rounded-sm border-t-secondary-100 border-b-secondary-100 px-2 mt-6">
                <div className="rounded-sm py-4 px-3">
                  <h3 className="text-[18px] font-bold my-1">Prompt</h3>
                  <h5 className="opacity-50 text-[16px] font-normal my-2">
                    {state.prompt}
                  </h5>
                  <div className="relative">
                    <img
                      src={state.previewImage}
                      alt="Prompt preview image"
                      className="max-h-[530px] w-full rounded-md"
                    />
                  </div>

                  <h4 className="opacity-50 text-[16px] font-light italic text-center">
                    Prompt preview
                  </h4>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      {resetNode}
    </>
  );
}
