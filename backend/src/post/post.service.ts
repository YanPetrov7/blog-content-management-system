import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationResultDto } from '../dto';
import { Post } from './entities';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './dto';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { SortOrder } from './enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageSize, processImage } from '../common';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
    private readonly cloudinaryService: CloudinaryService,
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

  async findImage(id: number, size: ImageSize): Promise<OperationResultDto> {
    const post = await this.postRepository.findOneBy({ id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let imageId: string;
    switch (size) {
      case ImageSize.SMALL:
        imageId = post.image_small;
        break;
      case ImageSize.MEDIUM:
        imageId = post.image_medium;
        break;
      case ImageSize.LARGE:
        imageId = post.image_large;
        break;
      default:
        imageId = post.image_medium;
        break;
    }

    const imageUrl = await this.cloudinaryService.getImageUrl(imageId);

    if (!imageUrl) {
      throw new NotFoundException('Image not found');
    }

    const result: OperationResultDto = {
      status: 'success',
      message: 'Image found successfully',
      data: imageUrl,
    };

    return result;
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

    const folder = 'images';
    const compressedImagesData = await processImage(dto.image);

    const uploadedImagesIds: string[] = await Promise.all(
      compressedImagesData.images.map(async (buffer) => {
        const uploadedImage = await this.cloudinaryService.uploadImage(
          buffer,
          folder,
        );
        return uploadedImage.public_id;
      }),
    );

    const newPost: Post = this.postRepository.create({
      ...dto,
      image_small: uploadedImagesIds[0],
      image_medium: uploadedImagesIds[1],
      image_large: uploadedImagesIds[2],
    });

    await this.postRepository.save(newPost);

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

    if (dto.author_id) {
      const author = await this.userService.findOne(dto.author_id);
      if (!author) {
        throw new NotFoundException(`User with id: ${dto.author_id} not found`);
      }
    }

    if (dto.category_id) {
      const category = await this.categoryService.findOne(dto.category_id);
      if (!category) {
        throw new NotFoundException(
          `Category with id: ${dto.category_id} not found`,
        );
      }
    }

    let image_small: string | undefined;
    let image_medium: string | undefined;
    let image_large: string | undefined;

    if (dto.image) {
      const folder = 'images';

      if (post.image_small) {
        await this.cloudinaryService.deleteImage(post.image_small);
      }
      if (post.image_medium) {
        await this.cloudinaryService.deleteImage(post.image_medium);
      }
      if (post.image_large) {
        await this.cloudinaryService.deleteImage(post.image_large);
      }

      const compressedImagesData = await processImage(dto.image);

      const uploadedImagesIds: string[] = await Promise.all(
        compressedImagesData.images.map(async (buffer) => {
          const uploadedImage = await this.cloudinaryService.uploadImage(
            buffer,
            folder,
          );
          return uploadedImage.public_id;
        }),
      );

      image_small = uploadedImagesIds[0];
      image_medium = uploadedImagesIds[1];
      image_large = uploadedImagesIds[2];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image, ...dtoWithoutImage } = dto;

    const updatedData = {
      ...dtoWithoutImage,
      ...(image_small && { image_small }),
      ...(image_medium && { image_medium }),
      ...(image_large && { image_large }),
    };

    await this.postRepository.update({ id }, updatedData);

    const updatedPost = await this.postRepository.findOneBy({ id });
    return updatedPost;
  }

  async remove(id: number): Promise<OperationResultDto> {
    const post = await this.postRepository.findOneBy({ id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.image_small && post.image_medium && post.image_large) {
      await this.cloudinaryService.deleteImage(post.image_small);
      await this.cloudinaryService.deleteImage(post.image_medium);
      await this.cloudinaryService.deleteImage(post.image_large);
    }

    await this.postRepository.delete({ id });

    const result: OperationResultDto = {
      status: 'success',
      message: `Post with id: "${id}" deleted successfully`,
    };

    return result;
  }

  async removeImage(id: number): Promise<OperationResultDto> {
    const post = await this.postRepository.findOneBy({ id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.image_small && !post.image_medium && !post.image_large) {
      throw new NotFoundException('Image not found');
    }

    await this.cloudinaryService.deleteImage(post.image_small);
    await this.cloudinaryService.deleteImage(post.image_medium);
    await this.cloudinaryService.deleteImage(post.image_large);

    await this.postRepository.update(
      { id },
      {
        image_small: null,
        image_medium: null,
        image_large: null,
      },
    );

    const result: OperationResultDto = {
      status: 'success',
      message: 'Image deleted successfully',
    };

    return result;
  }
}
