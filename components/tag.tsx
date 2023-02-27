import classNames from 'classnames';
import React from 'react';

interface TagProps {
  label: string;
  count: number;
  onClick?: () => void;
}
export default function Tag({ label, count, onClick }: TagProps) {
  return (
    <div
      className={classNames(
        'bg-primary-100 relative text-white uppercase text-xs rounded-md py-2 px-3 mr-2 inline-block my-1',
        {
          'cursor-pointer': !!onClick,
        },
      )}
      onClick={onClick ? onClick : () => null}
    >
      <span>
        {label} <span className="opacity-25 ml-2">{count}</span>
      </span>
    </div>
  );
}
