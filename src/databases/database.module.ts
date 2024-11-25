import { Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { PostgressModule } from './postgress/postgress.module';

@Module({
  imports: [MongoModule, PostgressModule],
  exports: [MongoModule, PostgressModule],
})
export class DatabaseModule {}
