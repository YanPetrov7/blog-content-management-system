import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './schemas';
import { CommentService } from './comment.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [MongooseModule],
})
export class CommentModule {}
