import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationResultDto } from '../dto';
import { Post } from './entities';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './dto';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { SortOrder } from './enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
  ) {}

  async findAll(dto: PostFilterDto): Promise<Post[]> {
    const {
      title,
      author,
      category,
      sortBy,
      sortOrder,
      is_published,
      page,
      limit,
    } = dto;

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category');

    if (title) {
      query.andWhere('post.title = :title', { title });
    }

    if (author) {
      query.andWhere('author.username = :author', { author });
    }

    if (category) {
      query.andWhere('category.name = :category', { category });
    }

    if (is_published) {
      query.andWhere('post.is_published = :is_published', { is_published });
    }

    const orderDirection = sortOrder || SortOrder.ASC;
    query.orderBy(`post.${sortBy || 'created_at'}`, orderDirection);

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    query.skip(skip).take(pageSize);

    return query.getMany();
  }

  async findOne(id: number): Promise<Post> {
    const Post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });

    if (!Post) {
      throw new NotFoundException(`Post with id: ${id} not found`);
    }

    return Post;
  }

  async create(dto: CreatePostDto): Promise<OperationResultDto> {
    const author = await this.userService.findOne(dto.author_id);

    if (!author) {
      throw new NotFoundException(`User with id: ${dto.author_id} not found`);
    }

    if (dto.category_id) {
      const category = await this.categoryService.findOne(dto.category_id);

      if (!category) {
        throw new NotFoundException(
          `Category with id: ${dto.category_id} not found`,
        );
      }
    }

    const newPost: Post = this.postRepository.create(dto);

    this.postRepository.save(newPost);

    const result: OperationResultDto = {
      status: 'success',
      message: 'Post created successfully',
    };

    return result;
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException(`Post with id: "${id}" not found`);
    }

    await this.postRepository.update({ id }, dto);

    const updatedPost = await this.postRepository.findOneBy({ id });

    return updatedPost;
  }

  async remove(id: number): Promise<OperationResultDto> {
    const post = await this.postRepository.findOneBy({ id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postRepository.delete({ id });

    const result: OperationResultDto = {
      status: 'success',
      message: `Post with id: "${id}" deleted successfully`,
    };

    return result;
  }
}
