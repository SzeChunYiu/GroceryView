import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get(':userId')
  @ApiOkResponse({ description: 'Fetch user account summary.' })
  getUser(@Param('userId') userId: string) {
    return { userId };
  }
}
