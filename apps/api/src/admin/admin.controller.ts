import { Body, Controller, ForbiddenException, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';

const adminUsers = [
  { id: 'ops-admin', email: 'ops@groceryview.example', role: 'admin', status: 'active' },
  { id: 'support-1', email: 'support@groceryview.example', role: 'ops', status: 'active' }
];

function requireAdminRole(roleHeader: string | undefined) {
  if (!roleHeader) throw new UnauthorizedException('Authentication required.');
  const roles = roleHeader.split(',').map((role) => role.trim().toLowerCase());
  if (!roles.some((role) => role === 'admin' || role === 'ops')) throw new ForbiddenException('Admin or ops role required.');
}

@Controller('admin/users')
export class AdminController {
  @Get()
  listUsers(@Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { users: adminUsers, guardrail: 'Admin user management requires an authenticated admin or ops role.' };
  }

  @Post(':userId/disable')
  disableUser(@Param('userId') userId: string, @Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { userId, status: 'disabled', action: 'disable' };
  }

  @Post(':userId/resend')
  resendInvite(@Param('userId') userId: string, @Body() body: { email?: string }, @Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { userId, email: body.email, status: 'queued', action: 'resend' };
  }
}
