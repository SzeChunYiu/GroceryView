import { NextRequest, NextResponse } from 'next/server';
import {
  accountListSharePermissions,
  createListSharePermission,
  listShareRoles,
  revokeListSharePermission,
} from '@/lib/list-permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readPermissionBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  return request.json().catch(() => ({}));
}

export async function POST(request: NextRequest) {
  const body = await readPermissionBody(request);

  if (body.action === 'revoke') {
    const shareId = typeof body.shareId === 'string' ? body.shareId : '';
    const result = revokeListSharePermission(shareId);

    return NextResponse.json(result, { status: result.revoked ? 200 : 404 });
  }

  const permission = createListSharePermission({
    listId: String(body.listId ?? ''),
    listName: String(body.listName ?? 'Shared list'),
    collaboratorName: String(body.collaboratorName ?? 'Collaborator'),
    collaboratorEmail: String(body.collaboratorEmail ?? ''),
    role: typeof body.role === 'string' ? body.role : 'viewer',
  });
  const invitationUrl = new URL(`/list?invite=${encodeURIComponent(permission.id)}`, request.nextUrl.origin);

  return NextResponse.json({
    invitationUrl: invitationUrl.toString(),
    permission,
    role: listShareRoles[permission.role],
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const shareId = request.nextUrl.searchParams.get('shareId') ?? '';
  const result = revokeListSharePermission(shareId);

  return NextResponse.json(result, { status: result.revoked ? 200 : 404 });
}

export async function GET() {
  return NextResponse.json({
    permissions: accountListSharePermissions,
    roles: listShareRoles,
  });
}
