import { Body, Controller, HttpCode, HttpStatus, Module, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiTags, ApiAcceptedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { isFeedbackTransportConfigured, sendFeedbackEmail } from '../lib/email.js';

class FeedbackMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Name must be 120 characters or fewer.' })
  name?: string;

  @IsEmail({}, { message: 'Email must be valid.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(140, { message: 'Subject must be 140 characters or fewer.' })
  subject?: string;

  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters.' })
  @MaxLength(2000, { message: 'Message must be 2000 characters or fewer.' })
  message!: string;
}

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackRoutesController {
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({ description: 'Feedback payload accepted and queued through Resend.' })
  @ApiBadRequestResponse({ description: 'Invalid feedback payload.' })
  @ApiInternalServerErrorResponse({ description: 'Feedback could not be delivered.' })
  async create(@Body() body: FeedbackMessageDto, @Req() req: Request) {
    if (!isFeedbackTransportConfigured()) {
      throw new ServiceUnavailableException('Feedback email transport is not configured. Please try again later.');
    }

    const result = await sendFeedbackEmail(
      {
        name: body.name?.trim(),
        email: body.email.trim(),
        subject: body.subject?.trim(),
        message: body.message.trim()
      },
      {
        requestIp: req.ip,
        userAgent: req.get('user-agent') ?? undefined
      }
    );

    return {
      status: 'accepted',
      provider: 'resend',
      messageId: result.id,
      destination: result.to
    };
  }
}

@Module({
  controllers: [FeedbackRoutesController]
})
export class FeedbackRoutesModule {}
