export default function Title(props) {
  return <h1 {...props} className={`text-4xl text-white ${props.className}`} />;
}
