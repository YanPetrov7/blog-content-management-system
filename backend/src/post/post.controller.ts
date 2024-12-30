import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createFileValidationPipe, ImageSize } from '../common';

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

  @Get(':id/image')
  async findPostImage(
    @Param('id') id: number,
    @Query('image_size') size: ImageSize,
  ) {
    return this.postService.findImage(id, size);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createPost(
    @Body() dto: CreatePostDto,
    @UploadedFile(createFileValidationPipe()) image: Express.Multer.File,
  ) {
    dto.image = image;

    return this.postService.create(dto);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updatePost(
    @Param('id') id: number,
    @Body() dto: UpdatePostDto,
    @UploadedFile(createFileValidationPipe()) image?: Express.Multer.File,
  ) {
    dto.image = image;

    return this.postService.update(id, dto);
  }

  @Delete(':id')
  async removePost(@Param('id') id: number) {
    return this.postService.remove(id);
  }

  @Delete(':id/image')
  async removePostImage(@Param('id') id: number) {
    return this.postService.removeImage(id);
  }
}
