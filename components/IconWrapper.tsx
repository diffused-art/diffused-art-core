import { useEffect, useState } from 'react';

interface IconWrapperProps {
  children: JSX.Element;
}
export default function IconWrapper({ children }: IconWrapperProps) {
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  useEffect(() => {
    setInitialRenderComplete(true);
  }, []);
  if (!initialRenderComplete) {
    return null;
  } else {
    return children;
  }
}
