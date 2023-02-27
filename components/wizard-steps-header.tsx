import {
  AdjustmentsHorizontalIcon,
  ArrowLeftCircleIcon,
  FilmIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface Props {
  items: {
    label: string;
    icon: JSX.Element;
    isActive: boolean;
  }[];
  prefixSlot?: JSX.Element;
}

export default function WizardStepsHeader({ items, prefixSlot }: Props) {
  return (
    <div className="flex items-center justify-center space-x-4 relative">
      {prefixSlot}
      {items.map((item, index) => (
        <div key={item.label} className="hidden md:flex justify-center items-center">
          <div
            className={`flex items-center ${item.isActive ? '' : 'opacity-50'}`}
          >
            <div className="pr-2">{item.icon}</div>

            {item.label}
          </div>
          {index === items.length - 1 ? null : (
            <div className="h-[1px] ml-4 w-16 bg-white opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
}

const ICON_DIMENSION = 16;
interface CreateCollectionFormStepsProps {
  activeStep: 1 | 2 | 3;
  goBack?: () => void;
}

export const CreateCollectionFormSteps = ({
  activeStep,
  goBack,
}: CreateCollectionFormStepsProps) => (
  <>
    <WizardStepsHeader
      prefixSlot={
        goBack && (
          <button
            onClick={goBack}
            className="absolute left-0 opacity-60 flex space-x-1 justify-center items-center"
            type="button"
          >
            <ArrowLeftCircleIcon height={18} />
            <span>Back</span>
          </button>
        )
      }
      items={[
        {
          label: 'Prompt',
          icon: <PencilIcon width={ICON_DIMENSION} height={ICON_DIMENSION} />,
          isActive: activeStep === 1,
        },
        {
          label: 'Configure',
          icon: (
            <AdjustmentsHorizontalIcon
              width={ICON_DIMENSION}
              height={ICON_DIMENSION}
            />
          ),
          isActive: activeStep === 2,
        },
        {
          label: 'Publish',
          icon: <FilmIcon width={ICON_DIMENSION} height={ICON_DIMENSION} />,
          isActive: activeStep === 3,
        },
      ]}
    />
  </>
);
