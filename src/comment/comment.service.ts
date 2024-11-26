import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CommentDocument, Comment } from './schemas';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { OperationResultDto } from '../dto';
import { PostService } from '../post/post.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly postService: PostService,
  ) {}

  async findAll(): Promise<Comment[]> {
    return this.commentModel.find().exec();
  }

  async findOne(id: string): Promise<Comment> {
    return this.commentModel.findById(id).exec();
  }

  async create(dto: CreateCommentDto): Promise<OperationResultDto> {
    const post = await this.postService.findOne(dto.postId);

    if (!post) {
      throw new NotFoundException(`Post with id: ${dto.postId} not found`);
    }

    const newComment = new this.commentModel(dto);
    await newComment.save();

    const result: OperationResultDto = {
      status: 'success',
      message: 'Comment created successfully',
    };

    return result;
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    if (!mongoose.isValidObjectId(id)) {
      throw new NotFoundException(`Invalid comment id: ${id}`);
    }

    const updatedComment = await this.commentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    return updatedComment;
  }

  async remove(id: string): Promise<OperationResultDto> {
    if (!mongoose.isValidObjectId(id)) {
      throw new NotFoundException(`Invalid comment id: ${id}`);
    }

    const deleteCommentResult = await this.commentModel
      .deleteOne({ _id: id })
      .exec();

    if (deleteCommentResult.deletedCount === 0) {
      throw new NotFoundException(`Comment with id: ${id} not found`);
    }

    const result: OperationResultDto = {
      status: 'success',
      message: 'Comment deleted successfully',
    };

    return result;
  }
}
