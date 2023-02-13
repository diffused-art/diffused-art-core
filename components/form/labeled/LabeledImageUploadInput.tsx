import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { ReactNode, useRef } from 'react';
import { StableDiffusionValidDimensions } from '../../../enums/stable-diffusion';
import useToast, { ToastIconEnum } from '../../../hooks/useToast';
import Popover from '../../popover';

interface ResizeImageFileArgs {
  file: File;
  width?: number;
  height?: number;
}
function resizeImageFile({
  file,
  width,
  height,
}: ResizeImageFileArgs): Promise<File> {
  return new Promise(function (resolve, reject) {
    let allow = ['jpg', 'bmp', 'png', 'jpeg'];
    try {
      if (
        file.name &&
        file.name.split('.').reverse()[0] &&
        allow.includes(file.name.split('.').reverse()[0].toLowerCase()) &&
        file.size &&
        file.type
      ) {
        let imageType = file.type ? file.type : 'jpeg';
        const imgWidth = width ? width : 512;
        const imgHeight = height ? height : 512;
        const fileName = file.name;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
          const img = new Image();
          (img as any).src = event.target?.result;
          (img.onload = () => {
            const elem = document.createElement('canvas');
            elem.width = imgWidth;
            elem.height = imgHeight;
            const ctx = elem.getContext('2d') as CanvasRenderingContext2D;
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            ctx.canvas.toBlob(
              blob => {
                const file = new File([blob as Blob], fileName, {
                  type: `image/${imageType.toLowerCase()}`,
                  lastModified: Date.now(),
                });
                resolve(file);
              },
              `image/${imageType}`,
              1,
            );
          }),
            (reader.onerror = error => reject(error));
        };
      } else reject('File not supported!');
    } catch (error) {
      console.log('Error while image resize: ', error);
      reject(error);
    }
  });
}
async function getImageObjFromFile(File: File): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(File);
    reader.onload = function (e) {
      if (!e.target?.result) return reject(null);
      let image: HTMLImageElement | null = new Image();
      image.src = e.target?.result as string;
      (image as any).deleteSelf = () => (image = null);
      image.onload = function () {
        resolve(image as HTMLImageElement);
      };
    };
  });
}

type Props = {
  label: ReactNode;
  sublabel?: ReactNode;
  wrapperClassName?: string;
  placeholder?: string;
  imageURL?: string;
  setImage: (image: File | null) => void;
  required?: boolean;
  loading?: boolean;
  removeMessage?: string;
};

export default function LabeledImageUploadInput({
  label,
  sublabel,
  wrapperClassName,
  placeholder = 'select an image',
  imageURL,
  setImage,
  loading,
  required,
  removeMessage = 'Are you sure you want to remove this image?',
}: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const imageFile = files ? files[0] : null;
    if (imageFile) {
      if (imageFile.size > 5_000_000) {
        toast({
          icon: ToastIconEnum.FAILURE,
          message: 'File is too big!',
        });
        if (inputRef.current) inputRef.current.value = '';
      } else {
        const imageFromFile = await getImageObjFromFile(imageFile);

        const newWidth = StableDiffusionValidDimensions.reduce(function (
          prev,
          curr,
        ) {
          return Math.abs(curr - imageFromFile.width) <
            Math.abs(prev - imageFromFile.width)
            ? curr
            : prev;
        });

        const newHeight = StableDiffusionValidDimensions.reduce(function (
          prev,
          curr,
        ) {
          return Math.abs(curr - imageFromFile.height) <
            Math.abs(prev - imageFromFile.height)
            ? curr
            : prev;
        });

        const resizedImageFile = await resizeImageFile({
          file: imageFile,
          width: newWidth,
          height: newHeight,
        });
        (imageFromFile as any).deleteSelf();
        setImage(resizedImageFile);
      }
    }
  };

  const onClick = () => {
    if (!window || loading) return;
    if (imageURL) {
      confirm(removeMessage) && setImage(null);
      return;
    }
    handleClick();
  };

  return (
    <Popover
      panelContent={<img src={imageURL} alt="Init Image" width="300px" />}
      disabled={!imageURL}
    >
      <div className={`md:px-5 ${wrapperClassName || ''}`}>
        {!imageURL && (
          <input
            ref={inputRef}
            onChange={onChange}
            className="hidden"
            type="file"
            accept="image/jpeg, image/bmp, image/png, image/jpg"
            required={required}
          />
        )}
        <div className="flex flex-col items-baseline mb-[10px] px-3">
          <h2 className="text-[16px] lg:text-[19px] font-normal text-white">
            {label}
          </h2>
          <span className="opacity-50 text-white italic font-light text-[12px] lg:text-[16px] leading-[20px]">
            {sublabel}
          </span>
        </div>
        <div
          onClick={onClick}
          className={classNames(
            `flex items-center w-full rounded-md bg-input-bg h-[40px] py-3 px-4 cursor-pointer`,
            { 'opacity-25': loading },
          )}
        >
          <div className="text-white opacity-25 italic text-[14px] lg:text-[18px] max-w-full truncate">
            {imageURL
              ? imageURL
              : loading
              ? 'Uploading, please wait...'
              : placeholder}
          </div>
          <div className="ml-auto">
            {!imageURL ? (
              <PhotoIcon width={20} height={20} color="#FFFFFF" />
            ) : (
              <TrashIcon width={20} height={20} color="#FFFFFF" />
            )}
          </div>
        </div>
      </div>
    </Popover>
  );
}
