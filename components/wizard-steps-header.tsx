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
        <div key={item.label}>
          <div
            className={`flex items-center ${item.isActive ? '' : 'opacity-50'}`}
          >
            <div className="pr-2">{item.icon}</div>

            {item.label}
          </div>
          {index === items.length - 1 ? null : (
            <div className="h-[1px] w-16 bg-white opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
}
