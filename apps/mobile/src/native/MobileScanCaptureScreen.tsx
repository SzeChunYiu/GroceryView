import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GroceryViewNativeScreen } from './GroceryViewNativeScreen.js';

export type MobileScanCaptureScreenProps = {
  mode: 'barcode' | 'receipt';
  screenName: 'BarcodeScanScreen' | 'ReceiptScanScreen';
};

export function MobileScanCaptureScreen({ mode, screenName }: MobileScanCaptureScreenProps): React.JSX.Element {
  const [permission, requestCameraPermissionsAsync] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedValue, setCapturedValue] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs_permission' | 'captured'>('checking');

  useEffect(() => {
    if (!permission) return;
    setStatus(permission.granted ? 'ready' : 'needs_permission');
  }, [permission]);

  const requestPermission = useCallback(async () => {
    const nextPermission = await requestCameraPermissionsAsync();
    setStatus(nextPermission.granted ? 'ready' : 'needs_permission');
  }, [requestCameraPermissionsAsync]);

  const onBarcodeScanned = useCallback((event: { data: string }) => {
    if (mode !== 'barcode') return;
    setCapturedValue(event.data);
    setStatus('captured');
  }, [mode]);

  const captureReceipt = useCallback(async () => {
    if (mode !== 'receipt') return;
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8, skipProcessing: true });
    if (picture?.uri) {
      setCapturedValue(picture.uri);
      setStatus('captured');
    }
  }, [mode]);

  return (
    <View style={styles.container} testID={`camera-capture:${mode}`}>
      <GroceryViewNativeScreen screenName={screenName} />
      <View style={styles.captureCard}>
        <Text style={styles.title}>{mode === 'barcode' ? 'Live barcode camera' : 'Receipt image capture'}</Text>
        <Text style={styles.body}>
          {status === 'captured'
            ? `Captured ${mode}: ${capturedValue}`
            : status === 'needs_permission'
              ? 'Camera permission is required before capture can continue.'
              : 'Aim the camera at a barcode or receipt to create scan evidence.'}
        </Text>
        {status === 'needs_permission' ? (
          <Pressable accessibilityRole="button" style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow camera</Text>
          </Pressable>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
            onBarcodeScanned={mode === 'barcode' && status !== 'captured' ? onBarcodeScanned : undefined}
          >
            {mode === 'receipt' ? (
              <Pressable accessibilityRole="button" style={styles.shutter} onPress={captureReceipt}>
                <Text style={styles.shutterText}>Capture receipt</Text>
              </Pressable>
            ) : null}
          </CameraView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#4d5a4f',
    fontSize: 15,
    lineHeight: 21
  },
  button: {
    backgroundColor: '#116b3a',
    borderRadius: 14,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  camera: {
    borderRadius: 18,
    height: 260,
    justifyContent: 'flex-end',
    marginTop: 14,
    overflow: 'hidden'
  },
  captureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    bottom: 20,
    left: 20,
    padding: 18,
    position: 'absolute',
    right: 20
  },
  container: {
    backgroundColor: '#f6f7f2',
    flex: 1
  },
  shutter: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#116b3a',
    borderRadius: 999,
    borderWidth: 3,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  shutterText: {
    color: '#116b3a',
    fontWeight: '900'
  },
  title: {
    color: '#172118',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6
  }
});
