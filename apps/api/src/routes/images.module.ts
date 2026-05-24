import { Module } from '@nestjs/common';
import { ImageProxyController } from './images.js';

@Module({ controllers: [ImageProxyController] })
export class ImagesModule {}
