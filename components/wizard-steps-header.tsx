import {
  AdjustmentsHorizontalIcon,
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
}

export default function WizardStepsHeader({ items }: Props) {
  return (
    <div className="flex items-center justify-center space-x-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex justify-center items-center">
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
}

export const CreateCollectionFormSteps = ({
  activeStep,
}: CreateCollectionFormStepsProps) => (
  <WizardStepsHeader
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
);
