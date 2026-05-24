export const adminRoutes = {
  users: 'admin/users',
  disableUser: ':userId/disable',
  resendVerification: ':userId/resend-verification',
  usersDescription: 'List admin user records with registration date, account state, and active alert counts.',
  disableUserDescription: 'Disable a user account by setting disabled_at.',
  resendVerificationDescription: 'Record a verification resend request for a user account.'
} as const;
