import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentModule } from '../../comment/comment.module';
import { mongooseConfig } from './config/mongoose.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        mongooseConfig(configService),
    }),
    CommentModule,
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
