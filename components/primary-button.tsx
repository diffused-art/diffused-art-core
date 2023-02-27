import Button, { Props } from './button';

export default function PrimaryButton(props: Props) {
  return (
    <Button
      {...props}
      className={`bg-primary hover:bg-primary-100 text-white ${props.className}`}
    />
  );
}
