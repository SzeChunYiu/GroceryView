import React from 'react';
import { Stack } from 'expo-router';

export default function MobileLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: true, headerLargeTitle: true }} />;
}
