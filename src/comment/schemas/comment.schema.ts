import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsInt } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  @IsInt()
  user_id: number;

  @Prop({ required: true })
  @IsInt()
  post_id: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
