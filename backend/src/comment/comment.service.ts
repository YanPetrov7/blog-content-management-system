import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CommentDocument, Comment } from './schemas';
import { CommentFilterDto, CreateCommentDto } from './dto';
import { OperationResultDto } from '../dto';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  async findAll(postId: number, dto: CommentFilterDto): Promise<Comment[]> {
    const page = parseInt(dto.page, 10) || 1;
    const limit = parseInt(dto.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const comments: Comment[] = await this.commentModel
      .find({ postId })
      .skip(skip)
      .limit(limit)
      .exec();

    return comments;
  }

  async create(
    postId: number,
    dto: CreateCommentDto,
  ): Promise<OperationResultDto> {
    const post = await this.postService.findOne(postId);

    if (!post) {
      throw new NotFoundException(`Post with id: ${postId} not found`);
    }

    const user = await this.userService.findOne(dto.authorId);

    if (!user) {
      throw new NotFoundException(`User with id: ${dto.authorId} not found`);
    }

    const newComment = new this.commentModel({
      ...dto,
      postId,
    });
    await newComment.save();

    const result: OperationResultDto = {
      status: 'success',
      message: 'Comment created successfully',
    };

    return result;
  }

  async remove(postId: number, id: string): Promise<OperationResultDto> {
    const post = await this.postService.findOne(postId);

    if (!post) {
      throw new NotFoundException(`Post with id: ${postId} not found`);
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new NotFoundException(`Invalid comment id: ${id}`);
    }

    const deleteCommentResult = await this.commentModel
      .deleteOne({ _id: id, postId })
      .exec();

    if (deleteCommentResult.deletedCount === 0) {
      throw new NotFoundException(
        `Comment with id: ${id} and postId: ${postId} not found`,
      );
    }

    const result: OperationResultDto = {
      status: 'success',
      message: 'Comment deleted successfully',
    };

    return result;
  }
}
