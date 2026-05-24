import { Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { sendFeedbackEmail } from '../lib/email.js';

class FeedbackRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  subject?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackRoutesController {
  @Post()
  @ApiCreatedResponse({ description: 'Feedback message sent to support inbox' })
  @ApiBadRequestResponse({ description: 'Invalid feedback request payload' })
  async submit(@Body() payload: FeedbackRequest) {
    try {
      await sendFeedbackEmail(payload);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error && error.message.startsWith('feedback configuration: ')
          ? error.message
          : 'Unable to send feedback right now.'
      );
    }

    return { ok: true };
  }
}
