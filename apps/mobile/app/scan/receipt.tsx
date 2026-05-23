import React from 'react';
import { MobileScanCaptureScreen } from '../../src/native/MobileScanCaptureScreen';

export default function ReceiptScanRoute(): React.JSX.Element {
  return <MobileScanCaptureScreen mode="receipt" screenName="ReceiptScanScreen" />;
}
