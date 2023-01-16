import { PhotoIcon } from '@heroicons/react/24/outline';
import { ReactNode, useRef } from 'react';

type Props = {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
  image: File | null;
  setImage: (image: File | null) => void;
  required?: boolean;
};

export default function LabeledImageUploadInput({
  label,
  sublabel,
  wrapperClassName,
  image,
  setImage,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setImage(files ? files[0] : null);
  };

  return (
    <div className={`md:px-5 ${wrapperClassName || ''}`}>
      <input
        ref={inputRef}
        onChange={onChange}
        className="hidden"
        type="file"
        accept="image/*"
        required={required}
      />
      <div className="flex flex-col lg:flex-row items-baseline mb-[10px]">
        <h2 className="text-[16px] lg:text-[19px] font-normal text-white">{label}</h2>
        <span className="lg:ml-4 opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
          {sublabel}
        </span>
      </div>
      <div
        onClick={handleClick}
        className="flex items-center w-full rounded-md bg-input-bg h-[40px] py-3 px-4 cursor-pointer"
      >
        <div className="text-white opacity-25 italic text-[14px] lg:text-[18px]">
          {image ? image.name : 'select an image'}
        </div>
        <div className="ml-auto">
          <PhotoIcon width={20} height={20} color="#FFFFFF" />
        </div>
      </div>
    </div>
  );
}
