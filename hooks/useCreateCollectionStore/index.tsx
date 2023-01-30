import { createContext, useContext } from 'react';
import { useImmerReducer } from 'use-immer';
import { StableDiffusionVersions } from '../../enums/stable-diffusion';

interface CreateCollectionStorePromptInterface {
  prompt: string | undefined;
  initImageFile: File | null;
  initImage: string | undefined;
  width: number;
  height: number;
  cfgScale: number;
  previewImage: string;
  engine: `${StableDiffusionVersions}`;
}

interface CreateCollectionStoreForm
  extends CreateCollectionStorePromptInterface {}

type StepType = 'prompt' | 'configuration' | 'publish';

interface CreateCollectionStoreInterface extends CreateCollectionStoreForm {
  step: StepType;
}

const createCollectionStoreInitialState: CreateCollectionStoreInterface = {
  step: 'prompt',
  prompt: undefined,
  initImageFile: null,
  initImage: undefined,
  width: 512,
  height: 512,
  cfgScale: 10,
  engine: 'stable-diffusion-512-v2-1',
  previewImage:
    'https://d2zsqulv16efzu.cloudfront.net//image-generation/stable-diffusion-512-v2-1/placeholder-wuiahsduhwdya54656.png',
};

export enum ActionTypesCreateCollectionStore {
  SetFieldValue,
  SetStep,
}

interface FieldData {
  field: keyof CreateCollectionStoreForm;
  value: typeof createCollectionStoreInitialState[keyof CreateCollectionStoreForm];
}

export interface SetFieldValueAction {
  type: ActionTypesCreateCollectionStore.SetFieldValue;
  payload: FieldData;
}

export interface SetStepAction {
  type: ActionTypesCreateCollectionStore.SetStep;
  payload: StepType;
}

export type CreateCollectionStoreActions = SetFieldValueAction | SetStepAction;

export const CreateCollectionStoreContext = createContext<{
  state: CreateCollectionStoreInterface;
  dispatch: React.Dispatch<CreateCollectionStoreActions>;
}>({
  state: createCollectionStoreInitialState,
  dispatch: () => undefined,
});

const reducer = (
  state: CreateCollectionStoreInterface,
  action: CreateCollectionStoreActions,
): CreateCollectionStoreInterface => {
  switch (action.type) {
    case ActionTypesCreateCollectionStore.SetFieldValue:
      return {
        ...state,
        [action.payload.field]: action.payload.value,
      };
    case ActionTypesCreateCollectionStore.SetStep:
      return {
        ...state,
        step: action.payload,
      };

    default:
      return state;
  }
};

const CreateCollectionStoreProvider = ({ children }) => {
  const [state, dispatch] = useImmerReducer(
    reducer,
    createCollectionStoreInitialState,
  );

  return (
    <CreateCollectionStoreContext.Provider value={{ dispatch, state }}>
      {children}
    </CreateCollectionStoreContext.Provider>
  );
};

export const useCreateCollectionStore = () =>
  useContext(CreateCollectionStoreContext);

export default CreateCollectionStoreProvider;
