import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentModule } from '../../comment/comment.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
        dbName: config.get<string>('MONGO_DB_NAME'),
      }),
    }),
    CommentModule,
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
