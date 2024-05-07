import { Popsicle, QrCode, Backpack } from "@phosphor-icons/react";

const bp = <Backpack size={180} color="indianred" />;

export default function App() {
  return (
    <div>
      <Popsicle size={180} weight="fill" color="pink" />
      {bp}
      <QrCode size={180} weight="duotone" color="blue" />
    </div>
  );
}
