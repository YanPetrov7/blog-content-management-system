import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { OperationResultDto } from '../dto';
import { Comment } from './schemas';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async findAllComments(): Promise<Comment[]> {
    return this.commentService.findAll();
  }

  @Get(':id')
  async findComment(@Param('id') id: string): Promise<Comment> {
    return this.commentService.findOne(id);
  }

  @Post()
  async createComment(
    @Body() dto: CreateCommentDto,
  ): Promise<OperationResultDto> {
    return this.commentService.create(dto);
  }

  @Put(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentService.update(id, dto);
  }

  @Delete(':id')
  async removeComment(@Param('id') id: string): Promise<OperationResultDto> {
    return this.commentService.remove(id);
  }
}
