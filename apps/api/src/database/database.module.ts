import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(process.env),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
