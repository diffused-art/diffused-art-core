import { useEffect, useState } from 'react';

export default function ClientOnly({
  children,
}: {
  children: React.ReactElement;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return children;
}
