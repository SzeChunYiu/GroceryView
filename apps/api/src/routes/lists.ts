import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, authenticatedUserId, type AuthenticatedRequest } from '../middleware/auth';

@Controller('api/lists')
@UseGuards(AuthGuard)
export class ListsController {
  @Get()
  listUserLists(@Req() request: AuthenticatedRequest) {
    return {
      userId: authenticatedUserId(request),
      lists: [],
      protectedBy: 'jwt',
    };
  }
}
