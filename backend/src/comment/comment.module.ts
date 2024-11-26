import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './schemas';
import { CommentService } from './comment.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    PostModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [MongooseModule],
})
export class CommentModule {}
