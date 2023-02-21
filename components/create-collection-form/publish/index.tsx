import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../../hooks/useCreateCollectionStore';
import LabeledNumberInput from '../../form/labeled/LabeledNumberInput';
import Title from '../../title';
import { CreateCollectionFormSteps } from '../../wizard-steps-header';
import useResetCreateCollectionStore from '../../../hooks/useCreateCollectionStore/useResetCreateCollectionStore';
import useTags, { UseTagsResultInterface } from '../../../hooks/api/useTags';
import { useSession } from 'next-auth/react';
import LabeledCheckboxInput from '../../form/labeled/LabeledCheckboxInput';
import LabeledDateInput from '../../form/labeled/LabeledDateInput';
import LabeledTimeInput from '../../form/labeled/LabeledTimeInput';
import PublishModal from './publish-modal';
import { getDatetime } from './utils';
import axios from 'axios';

export default function CreateCollectionFormPublish() {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { state, dispatch } = useCreateCollectionStore();
  const resetNode = useResetCreateCollectionStore(formRef);
  const session = useSession();
  const { data: tags } = useTags();

  const selectedTags = state.keywords
    .map(value => tags?.find(tag => tag.id === value))
    .filter(Boolean) as UseTagsResultInterface[];

  if (state.step !== 'publish') return null;

  const canGoToNextPage =
    state.quantity > 0 &&
    state.currencyTotal >= 0 &&
    state.currencyTotal <= 1000 &&
    (state.startImediately ||
      new Date(getDatetime(state.startDate, state.startTime)) > new Date());

  return (
    <>
      <div className="py-10 flex justify-center">
        <div className="w-full container mx-auto">
          <CreateCollectionFormSteps
            activeStep={3}
            goBack={() =>
              dispatch({
                type: ActionTypesCreateCollectionStore.SetStep,
                payload: 'configuration',
              })
            }
          />
          <Title className="pt-8">Publish your drop</Title>
          <form
            ref={formRef}
            action="#"
            onSubmit={async e => {
              e.preventDefault();
              setIsPublishModalOpen(true);

              state.collectionId &&
                (await axios({
                  url: `/api/collection/${state.collectionId}`,
                  method: 'PUT',
                  data: {
                    mintOpenAt: getDatetime(
                      state.startDate,
                      state.startTime,
                    ).getTime(),
                  },
                }));
            }}
          >
            <div className="grid grid-cols-2 space-x-5">
              <div className="w-full flex pt-6">
                <div className="w-full flex flex-col space-y-5 bg-secondary-90 border-t-secondary-100 border-b-secondary-100 px-2 py-4 border-t-2 border-b-2 rounded-sm">
                  <div className="w-full">
                    <LabeledNumberInput
                      label="Quantity"
                      sublabel="Number of NFTs on this drop (currently limited to 100)"
                      placeholder="0"
                      min={1}
                      max={100}
                      defaultValue={state.quantity}
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'quantity',
                            value: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="w-full">
                    <LabeledNumberInput
                      label="Price"
                      sublabel="Price of every NFT"
                      placeholder="0"
                      min={0}
                      max={1000}
                      step={0.01}
                      defaultValue={state.currencyTotal}
                      suffixComponent="SOL"
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'currencyTotal',
                            value: Number(e.target.value),
                          },
                        })
                      }
                      required
                    />
                  </div>

                  <div className="border-[1px] rounded-md border-secondary-110" />

                  <div className="w-full">
                    <LabeledCheckboxInput
                      label="Start immediately"
                      checked={state.startImediately}
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'startImediately',
                            value: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div
                    className={classNames('w-full', {
                      'opacity-50 cursor-not-allowed pointer-events-none':
                        state.startImediately,
                    })}
                  >
                    <LabeledDateInput
                      min={new Date(Date.now()).toDateString()}
                      defaultValue={state.startDate}
                      label="Start date"
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'startDate',
                            value: e.target.value,
                          },
                        })
                      }
                      required={!state.startImediately}
                    />
                  </div>

                  <div
                    className={classNames('w-full', {
                      'opacity-50 cursor-not-allowed pointer-events-none':
                        state.startImediately,
                    })}
                  >
                    <LabeledTimeInput
                      defaultValue={state.startTime}
                      label="Start time (UTC)"
                      onChange={e =>
                        dispatch({
                          type: ActionTypesCreateCollectionStore.SetFieldValue,
                          payload: {
                            field: 'startTime',
                            value: e.target.value,
                          },
                        })
                      }
                      required={!state.startImediately}
                    />
                  </div>

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
                      Publish drop
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-90 border-t-2 border-b-2 rounded-sm border-t-secondary-100 border-b-secondary-100 px-2 mt-6">
                <div className="rounded-sm py-4 px-3 space-y-3">
                  <div>
                    <h3 className="text-[18px]">Drop</h3>
                    <h5 className="opacity-50 text-[16px] font-normal">
                      {state.dropName}
                    </h5>
                  </div>

                  <div>
                    <h3 className="text-[18px]">Prompt</h3>
                    <h5 className="opacity-50 text-[16px] font-normal">
                      {state.prompt}
                    </h5>
                  </div>

                  <div>
                    <h3 className="text-[18px]">Description</h3>
                    <h5 className="opacity-50 text-[16px] font-normal">
                      {state.dropDescription}
                    </h5>
                  </div>

                  <div>
                    <h3 className="text-[18px]">Creator</h3>
                    <h5 className="opacity-50 text-[16px] font-normal">
                      @{(session?.data as any)?.user?.username}
                    </h5>
                  </div>

                  <div>
                    <h3 className="text-[18px]">Keywords</h3>
                    {selectedTags.map(tag => (
                      <div
                        key={tag.id}
                        className="bg-primary-100 relative text-white uppercase text-xs rounded-md py-2 px-3 mr-2 inline-block my-1"
                      >
                        <span>
                          {tag.label}{' '}
                          <span className="opacity-25 ml-2">{tag.count}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <img
                      src={state.previewImage}
                      alt="Prompt preview image"
                      className="max-h-[530px] w-full rounded-md"
                    />
                  </div>

                  <h4 className="opacity-50 text-[16px] font-light italic text-center">
                    Image preview for the drop
                  </h4>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      {resetNode}
      <PublishModal
        open={isPublishModalOpen}
        closeModal={() => {
          setIsPublishModalOpen(false);
          if (state.publishStep === 'done') {
            dispatch({
              type: ActionTypesCreateCollectionStore.Reset,
            });
          }
        }}
      />
    </>
  );
}
