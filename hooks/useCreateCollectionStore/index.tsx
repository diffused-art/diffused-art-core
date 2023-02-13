import { useWallet } from '@solana/wallet-adapter-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useImmerReducer } from 'use-immer';
import { StableDiffusionVersions } from '../../enums/stable-diffusion';
import useLocalStorage from '../useLocalStorage';

interface CreateCollectionStorePromptInterface {
  prompt: string;
  initImage: string;
  width: number;
  height: number;
  cfgScale: number;
  previewImage: string;
  engine: `${StableDiffusionVersions}`;
}

interface CreateCollectionStoreConfigurationInterface {
  teaserImage: string;
  dropName: string;
  dropDescription: string;
  keywords: string[];
}

interface CreateCollectionStorePublishInterface {
  quantity: number;
  currencyTotal: number;
  startImediately: boolean;
  startDate: string;
  startTime: string;
  publishStep: 'terms' | 'upload' | 'done';
}

interface CreateCollectionStoreForm
  extends CreateCollectionStorePromptInterface,
    CreateCollectionStoreConfigurationInterface,
    CreateCollectionStorePublishInterface {}

type StepType = 'prompt' | 'configuration' | 'publish';

interface CreateCollectionStoreInterface extends CreateCollectionStoreForm {
  step: StepType;
}

export const createCollectionStoreInitialState: CreateCollectionStoreInterface =
  {
    step: 'prompt',

    prompt: '',
    initImage: '',
    width: 512,
    height: 512,
    cfgScale: 10,
    engine: 'stable-diffusion-512-v2-1',
    previewImage:
      'https://d2zsqulv16efzu.cloudfront.net//image-generation/stable-diffusion-512-v2-1/placeholder-wuiahsduhwdya54656.png',

    teaserImage: '',
    dropName: '',
    dropDescription: '',
    keywords: [],

    quantity: 1,
    currencyTotal: 0,
    startImediately: false,
    startDate: new Date(
      new Date(Date.now()).getTime() -
        new Date(Date.now()).getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split('T')[0],
    startTime: '12:00',
    publishStep: 'terms',
  };

export enum ActionTypesCreateCollectionStore {
  SetFieldValue,
  SetStep,
  Reset,
}

interface FieldData {
  field: keyof CreateCollectionStoreForm;
  value: typeof createCollectionStoreInitialState[keyof CreateCollectionStoreForm];
}

export interface SetFieldValueAction {
  type: ActionTypesCreateCollectionStore.SetFieldValue;
  payload: FieldData;
}

export interface ResetAction {
  type: ActionTypesCreateCollectionStore.Reset;
}

export interface SetStepAction {
  type: ActionTypesCreateCollectionStore.SetStep;
  payload: StepType;
}

export type CreateCollectionStoreActions =
  | SetFieldValueAction
  | SetStepAction
  | ResetAction;

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
    case ActionTypesCreateCollectionStore.Reset:
      return {
        ...createCollectionStoreInitialState,
      };
    default:
      return state;
  }
};

const usePersistReducer = () => {
  const { publicKey } = useWallet();
  const [lsWallet, saveLSWallet] = useLocalStorage(
    'last-connected-wallet-creation-flow',
    null,
  );
  useEffect(() => {
    if (publicKey?.toString?.()?.length) {
      saveLSWallet(publicKey.toString());
    }
  }, [publicKey, saveLSWallet]);

  const lsKey = useMemo(
    () => `create-collection-store-ls-${lsWallet}`,
    [lsWallet],
  );

  const [savedState, saveState] = useLocalStorage(
    lsKey,
    createCollectionStoreInitialState,
  );

  const reducerLocalStorage = useCallback(
    (state, action) => {
      const newState = reducer(state, action);
      const result = {};
      for (const key in createCollectionStoreInitialState) {
        if (newState.hasOwnProperty(key)) {
          result[key] = newState[key];
        } else {
          result[key] = createCollectionStoreInitialState[key];
        }
      }

      saveState(result);

      return result;
    },
    [saveState],
  );

  const [state, dispatch] = useImmerReducer(reducerLocalStorage, savedState);

  return [state, dispatch];
};

const CreateCollectionStoreProvider = ({ children }) => {
  const [state, dispatch] = usePersistReducer();

  return (
    <CreateCollectionStoreContext.Provider value={{ dispatch, state }}>
      {children}
    </CreateCollectionStoreContext.Provider>
  );
};

export const useCreateCollectionStore = () =>
  useContext(CreateCollectionStoreContext);

export default CreateCollectionStoreProvider;
