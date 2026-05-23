import React from 'react';
import { MobileScanCaptureScreen } from '../../src/native/MobileScanCaptureScreen';

export default function BarcodeScanRoute(): React.JSX.Element {
  return <MobileScanCaptureScreen mode="barcode" screenName="BarcodeScanScreen" />;
}
