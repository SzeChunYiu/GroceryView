import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildMobileScreenBlueprints, type MobileScreenAction, type MobileScreenBlueprint } from '../index.js';

export type GroceryViewNativeScreenProps = {
  screenName: string;
};

const palette = {
  background: '#f6f7f2',
  card: '#ffffff',
  ink: '#172118',
  muted: '#5d6b5e',
  primary: '#116b3a',
  warning: '#9a5a00'
};

function actionCopy(action: MobileScreenAction): string {
  return action.replaceAll('_', ' ');
}

function stateCopy(screen: MobileScreenBlueprint): string {
  if (screen.primaryState === 'needs_permission') return 'Permission required before this screen can be used.';
  if (screen.primaryState === 'needs_provider') return 'Provider setup is required before this screen can be used.';
  return screen.emptyState;
}

export function GroceryViewNativeScreen({ screenName }: GroceryViewNativeScreenProps): React.JSX.Element {
  const plan = buildMobileScreenBlueprints();
  const screen = plan.screens.find((candidate) => candidate.screen === screenName);

  if (!screen) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Screen unavailable</Text>
        <Text style={styles.body}>This route is not registered in the mobile blueprint plan.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID={`screen:${screen.screen}`}>
      <Text style={styles.eyebrow}>{screen.route}</Text>
      <Text style={styles.title}>{screen.screen}</Text>
      <Text style={styles.body}>{stateCopy(screen)}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data used on this screen</Text>
        {screen.dataDependencies.map((dependency) => (
          <Text key={dependency} style={styles.listItem}>• {dependency.replaceAll('_', ' ')}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Available actions</Text>
        {screen.actions.map((action, index) => (
          <Pressable accessibilityRole="button" key={action} style={[styles.action, index === 0 ? styles.primaryAction : null]}>
            <Text style={[styles.actionText, index === 0 ? styles.primaryActionText : null]}>{actionCopy(action)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Offline behavior</Text>
        <Text style={styles.body}>{screen.offlineBehavior}</Text>
        <Text style={styles.providerText}>Providers: {screen.providerRequirements.join(', ') || 'none'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  action: {
    borderColor: palette.primary,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  actionText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  body: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 22
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    marginTop: 16,
    padding: 18
  },
  centered: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  container: {
    backgroundColor: palette.background,
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 48
  },
  eyebrow: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  listItem: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 24
  },
  primaryAction: {
    backgroundColor: palette.primary
  },
  primaryActionText: {
    color: '#ffffff'
  },
  providerText: {
    color: palette.warning,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 6
  }
});
