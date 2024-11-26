import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, PostFilterDto } from './dto';

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
}
