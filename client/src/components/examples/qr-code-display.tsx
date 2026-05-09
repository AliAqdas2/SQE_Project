import { QRCodeDisplay } from '../qr-code-display';

export default function QRCodeDisplayExample() {
  return (
    <div className="p-8">
      <QRCodeDisplay 
        campaignName="Education for All Children"
        url="plegit.app/c/edu123"
      />
    </div>
  );
}
