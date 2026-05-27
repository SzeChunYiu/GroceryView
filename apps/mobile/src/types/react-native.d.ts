declare module 'react-native' {
  import type * as React from 'react';

  export const Pressable: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const View: React.ComponentType<any>;

  export const StyleSheet: {
    create<T extends Record<string, any>>(styles: T): T;
  };
}
