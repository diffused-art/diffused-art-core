import { useSession } from 'next-auth/react';
import LoginButton from './login-button';

interface ArtistLoginRequiredProps {
  children: JSX.Element;
}

export default function ArtistLoginRequired({
  children,
}: ArtistLoginRequiredProps) {
  const { data: session } = useSession();
  return session ? (
    children
  ) : (
    <div className="flex flex-col items-center h-full justify-center space-y-10">
      <p className="text-center text-xl mt-5">
        This page is exclusive for vetted diffused artists. You can apply by clicking here.
      </p>

      <LoginButton />
    </div>
  );
}
