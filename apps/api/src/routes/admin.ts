import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

type AnnouncementConfig = {
  id: string;
  enabled: boolean;
  message: string | null;
  actionLabel: string | null;
  actionHref: string | null;
};

class AnnouncementPayload {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(320)
  message?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(80)
  actionLabel?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  actionHref?: string;
}

let currentAnnouncement: AnnouncementConfig = {
  id: '0001',
  enabled: false,
  message: null,
  actionLabel: null,
  actionHref: null
};

function buildAnnouncementConfig(payload: AnnouncementPayload): AnnouncementConfig {
  if (!payload.enabled) {
    return {
      id: String(Math.random()),
      enabled: false,
      message: null,
      actionLabel: null,
      actionHref: null
    };
  }

  if (!payload.message?.trim()) {
    throw new BadRequestException('message is required when announcement is enabled.');
  }

  return {
    id: String(Math.random()),
    enabled: true,
    message: payload.message.trim(),
    actionLabel: payload.actionLabel?.trim() ?? null,
    actionHref: payload.actionHref?.trim() ?? null
  };
}

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  @Get('announcement')
  @ApiOkResponse({ description: 'Current announcement banner configuration for users.' })
  getAnnouncement() {
    return currentAnnouncement;
  }

  @Post('announcement')
  @ApiBody({ description: 'Update the in-app announcement banner.', type: AnnouncementPayload })
  @ApiOkResponse({ description: 'Updated announcement banner configuration.' })
  updateAnnouncement(@Body() payload: AnnouncementPayload) {
    currentAnnouncement = buildAnnouncementConfig(payload);
    return currentAnnouncement;
  }
}
