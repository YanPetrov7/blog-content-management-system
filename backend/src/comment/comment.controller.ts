import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentFilterDto, CreateCommentDto } from './dto';
import { OperationResultDto } from '../dto';
import { Comment } from './schemas';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async findAllComments(
    @Param('postId') postId: number,
    @Query() filterDto: CommentFilterDto,
  ): Promise<Comment[]> {
    return this.commentService.findAll(postId, filterDto);
  }

  @Post()
  async createComment(
    @Param('postId') postId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<OperationResultDto> {
    return this.commentService.create(postId, dto);
  }

  @Delete(':id')
  async removeComment(
    @Param('postId') postId: number,
    @Param('id') id: string,
  ): Promise<OperationResultDto> {
    return this.commentService.remove(postId, id);
  }
}
