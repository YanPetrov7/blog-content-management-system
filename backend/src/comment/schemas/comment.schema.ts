import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsInt } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  authorId: number;

  @Prop({ required: true })
  @IsInt()
  postId: number;
}

export type CommentDocument = Comment & Document;
export const CommentSchema = SchemaFactory.createForClass(Comment);
