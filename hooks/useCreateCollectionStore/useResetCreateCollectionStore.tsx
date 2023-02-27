import {
  ActionTypesCreateCollectionStore,
  createCollectionStoreInitialState,
  useCreateCollectionStore,
} from '.';
import equal from 'fast-deep-equal';
import { useCallback, useMemo } from 'react';

export default function useResetCreateCollectionStore(formRef) {
  const { state, dispatch } = useCreateCollectionStore();

  const onClickReset = useCallback(() => {
    if (
      confirm('Are you sure you want to reset the form? All data will be lost!')
    ) {
      dispatch({
        type: ActionTypesCreateCollectionStore.Reset,
      });
      formRef.current?.reset();
    }
  }, [dispatch, formRef]);

  const isInitialFormState = useMemo(
    () => equal(state, createCollectionStoreInitialState),
    [state],
  );
  const resetNode = !isInitialFormState && (
    <div className="flex flex-col md:flex-row py-5 md:space-x-2 px-2 items-center justify-center">
      <span className="text-base text-gray-400 self-center">
        While unpublished, your drop is saved locally on your browser.
      </span>
      <span
        className="text-white cursor-pointer text-base font-bold self-center"
        onClick={onClickReset}
      >
        Click here to reset the form.
      </span>
    </div>
  );

  return resetNode;
}
