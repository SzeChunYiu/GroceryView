import type { MobilePermissionState } from './permissions.js';

export type MobileNotificationTopic = 'target_price' | 'deal_score' | 'new_52_week_low' | 'back_in_stock' | 'budget_weekly_summary' | 'receipt_review';

export type MobileNotificationQuietHours = {
  startHour: number;
  endHour: number;
  timezone: string;
};

export type MobileNotificationPreferenceInput = {
  userId: string;
  permission: MobilePermissionState;
  pushEnabled: boolean;
  deviceTokenRegistered: boolean;
  networkOnline: boolean;
  topics?: MobileNotificationTopic[];
  favoriteStoresOnly?: boolean;
  quietHours?: MobileNotificationQuietHours;
};

export type MobileNotificationPreferencePlan = {
  route: '/profile/notifications-placeholder';
  status: 'ready' | 'disabled' | 'needs_permission' | 'needs_device_token' | 'blocked';
  userId: string;
  enabledTopics: MobileNotificationTopic[];
  favoriteStoresOnly: boolean;
  quietHours: MobileNotificationQuietHours | null;
  blockers: Array<'notifications_permission_required' | 'notifications_permission_blocked' | 'notifications_unavailable' | 'push_token_not_registered' | 'network_required_to_update_notifications'>;
  actions: Array<'enable_push_notifications' | 'request_notifications_permission' | 'open_system_notification_settings' | 'register_push_token' | 'save_notification_preferences' | 'retry_online'>;
};

const defaultTopics: MobileNotificationTopic[] = ['target_price', 'deal_score', 'new_52_week_low'];

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function normalizeTopics(topics: MobileNotificationTopic[] | undefined): MobileNotificationTopic[] {
  return [...new Set(topics && topics.length > 0 ? topics : defaultTopics)];
}

function normalizeQuietHours(quietHours: MobileNotificationQuietHours | undefined): MobileNotificationQuietHours | null {
  if (!quietHours) return null;
  if (!Number.isInteger(quietHours.startHour) || quietHours.startHour < 0 || quietHours.startHour > 23) {
    throw new Error('quietHours.startHour must be an integer from 0 to 23.');
  }
  if (!Number.isInteger(quietHours.endHour) || quietHours.endHour < 0 || quietHours.endHour > 23) {
    throw new Error('quietHours.endHour must be an integer from 0 to 23.');
  }
  const timezone = requireNonEmpty(quietHours.timezone, 'quietHours.timezone');
  if (quietHours.startHour === quietHours.endHour) throw new Error('quietHours must cover a non-empty window.');
  return { startHour: quietHours.startHour, endHour: quietHours.endHour, timezone };
}

export function buildMobileNotificationPreferencePlan(input: MobileNotificationPreferenceInput): MobileNotificationPreferencePlan {
  const userId = requireNonEmpty(input.userId, 'userId');
  const enabledTopics = input.pushEnabled ? normalizeTopics(input.topics) : [];
  const blockers: MobileNotificationPreferencePlan['blockers'] = [];
  const actions: MobileNotificationPreferencePlan['actions'] = [];

  if (!input.pushEnabled) actions.push('enable_push_notifications');

  if (input.permission === 'not_determined') {
    blockers.push('notifications_permission_required');
    actions.push('request_notifications_permission');
  } else if (input.permission === 'denied' || input.permission === 'blocked') {
    blockers.push('notifications_permission_blocked');
    actions.push('open_system_notification_settings');
  } else if (input.permission === 'unavailable') {
    blockers.push('notifications_unavailable');
  }

  if (input.pushEnabled && input.permission === 'granted' && !input.deviceTokenRegistered) {
    blockers.push('push_token_not_registered');
    actions.push('register_push_token');
  }

  if (input.pushEnabled && !input.networkOnline) {
    blockers.push('network_required_to_update_notifications');
    actions.push('retry_online');
  }

  if (input.pushEnabled && blockers.length === 0) actions.push('save_notification_preferences');

  const status: MobileNotificationPreferencePlan['status'] = !input.pushEnabled
    ? 'disabled'
    : blockers.includes('notifications_permission_required')
      ? 'needs_permission'
      : blockers.includes('push_token_not_registered')
        ? 'needs_device_token'
        : blockers.length > 0
          ? 'blocked'
          : 'ready';

  return {
    route: '/profile/notifications-placeholder',
    status,
    userId,
    enabledTopics,
    favoriteStoresOnly: input.favoriteStoresOnly ?? true,
    quietHours: normalizeQuietHours(input.quietHours),
    blockers,
    actions
  };
}

export function summarizeMobileNotificationTopics(plan: MobileNotificationPreferencePlan): Record<MobileNotificationTopic, boolean> {
  const enabled = new Set(plan.enabledTopics);
  return {
    target_price: enabled.has('target_price'),
    deal_score: enabled.has('deal_score'),
    new_52_week_low: enabled.has('new_52_week_low'),
    back_in_stock: enabled.has('back_in_stock'),
    budget_weekly_summary: enabled.has('budget_weekly_summary'),
    receipt_review: enabled.has('receipt_review')
  };
}
