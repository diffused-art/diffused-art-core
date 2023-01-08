import { PhotoIcon } from '@heroicons/react/24/outline';
import { ReactNode, useRef, useState } from 'react';

type Props = {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
};

export default function LabeledImageUploadInput({
  label,
  sublabel,
  wrapperClassName,
}: Props) {
  const [image, setImage] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setImage(files ? files[0] : null);
  };

  return (
    <div className={`${wrapperClassName || ''}`}>
      <input
        ref={inputRef}
        onChange={onChange}
        className="hidden"
        type="file"
        accept="image/*"
      />
      <div className="flex items-baseline">
        <h2 className="text-base font-semibold text-white">{label}</h2>
        <span className="ml-4 opacity-50 text-white text-sm">{sublabel}</span>
      </div>
      <div
        onClick={handleClick}
        className="flex items-center w-full rounded-md bg-secondary-100 h-8 py-3 px-4 cursor-pointer"
      >
        <div className={`text-white italic ${image ? '' : 'opacity-25'}`}>
          {image ? image.name : 'select an image'}
        </div>
        <div className="ml-auto">
          <PhotoIcon width={16} height={16} />
        </div>
      </div>
    </div>
  );
}
