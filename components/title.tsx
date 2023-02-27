export default function Title(props) {
  return <h1 {...props} className={`text-3xl text-white ${props.className}`} />;
}
