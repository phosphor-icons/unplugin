import { Popsicle, QrCode, Backpack, YinYang } from "@phosphor-icons/react";

const bp = <Backpack size={72} color="indianred" />;

export default function App() {
  return (
    <div>
      <Popsicle size={72} weight="fill" color="pink" />
      {bp}
      <QrCode size={72} weight="duotone" color="blue" />
      <YinYang size={72} weight="light" color="purple" />
    </div>
  );
}
