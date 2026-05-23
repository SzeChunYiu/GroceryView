import { Module } from '@nestjs/common';
import { PostgresQueryExecutorService } from './postgres-query-executor.service.js';

@Module({
  providers: [PostgresQueryExecutorService],
  exports: [PostgresQueryExecutorService]
})
export class DatabaseModule {}
