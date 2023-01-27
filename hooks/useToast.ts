import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export enum ToastIconEnum {
  SUCCESS = '🚀',
  ERROR = '🚨',
  FAILURE = '😔',
}
interface ToastOptions {
  icon?: ToastIconEnum;
  message: string;
}

export default function useToast() {
  return useCallback(
    ({ icon = ToastIconEnum.SUCCESS, message }: ToastOptions) => {
      if (!message) {
        throw new Error('useToast must receive a message');
      }
      return toast(message, {
        icon,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        position: 'bottom-right'
      });
    },
    [],
  );
}
