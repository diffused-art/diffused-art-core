import React, { useState } from 'react';
import { useCreateCollectionStore } from '../../../hooks/useCreateCollectionStore';
import useLocalStorage from '../../../hooks/useLocalStorage';
import PrimaryButton from '../../primary-button';

export default function PublishUpload() {
  const { state, dispatch } = useCreateCollectionStore();
  const [activeStep, setActiveStep] = useLocalStorage('activeStep', 0);
  const [isLoading, setIsLoading] = useState(false);

  if (state.publishStep !== 'upload') return null;

  return (
    <div>
      <h1 className="my-3">Nice, now lets publish your collection!</h1>
      <h1 className="my-3">
        For uploading your collection, you will need to go through a few
        steps...
      </h1>
      <h1 className="my-3">
        Just keep smashing the buttons as they appear, and it will be done soon
        enough 😁
      </h1>
      {activeStep === 0 && (
        <button
          disabled={isLoading}
          className="bg-main-yellow text-black rounded my-3 p-3"
        >
          {isLoading
            ? 'Loading...'
            : 'Click here to generate the collection data so that diffused.art can track your collection.'}
        </button>
      )}
    </div>
  );
}
