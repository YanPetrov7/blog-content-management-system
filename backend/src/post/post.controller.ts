import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findAllPosts(@Query() filterDto: PostFilterDto) {
    return this.postService.findAll(filterDto);
  }

  @Get(':id')
  async findPost(@Param('id') id: number) {
    return this.postService.findOne(id);
  }

  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postService.create(dto);
  }

  @Put(':id')
  async updatePost(@Param('id') id: number, @Body() dto: UpdatePostDto) {
    return this.postService.update(id, dto);
  }

  @Delete(':id')
  async removePost(@Param('id') id: number) {
    return this.postService.remove(id);
  }
}
