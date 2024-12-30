import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as argon2 from 'argon2';
import { OperationResultDto } from '../dto';
import { ImageSize, ProcessedImageDto, processImage } from '../common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id: ${id} not found`);
    }

    return user;
  }

  async findAvatar(
    userId: number,
    avatar_size: ImageSize,
  ): Promise<ProcessedImageDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let avatar: Buffer;

    switch (avatar_size) {
      case ImageSize.SMALL:
        avatar = user.avatar_small;
        break;
      case ImageSize.MEDIUM:
        avatar = user.avatar_medium;
        break;
      case ImageSize.LARGE:
        avatar = user.avatar_large;
        break;
      default:
        avatar = user.avatar_medium;
        break;
    }

    return {
      buffer: avatar,
      format: user.avatarMime,
    };
  }

  async removeAvatar(userId: number): Promise<OperationResultDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar_small && !user.avatar_medium && !user.avatar_large) {
      throw new NotFoundException('Avatar not found');
    }

    await this.userRepository.update(
      { id: userId },
      {
        avatarMime: null,
        avatar_small: null,
        avatar_medium: null,
        avatar_large: null,
      },
    );

    const result: OperationResultDto = {
      status: 'success',
      message: 'Avatar removed successfully',
    };

    return result;
  }

  async create(dto: CreateUserDto): Promise<OperationResultDto> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with such username or email already exists',
      );
    }

    const hashedPassword = await argon2.hash(dto.password);

    let avatar_small: Buffer | undefined;
    let avatar_medium: Buffer | undefined;
    let avatar_large: Buffer | undefined;
    let avatarMime: string | undefined;

    if (dto.avatar) {
      const compressedAvatarsData = await processImage(dto.avatar);
      [avatar_small, avatar_medium, avatar_large] =
        compressedAvatarsData.images;
      avatarMime = compressedAvatarsData.format;
    }

    const newUser: User = this.userRepository.create({
      ...dto,
      password_hash: hashedPassword,
      avatar_small,
      avatar_medium,
      avatar_large,
      avatarMime,
    });

    await this.userRepository.save(newUser);

    const result: OperationResultDto = {
      status: 'success',
      message: 'User created successfully',
    };

    return result;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id: "${id}" not found`);
    }

    let avatar_small: Buffer | undefined;
    let avatar_medium: Buffer | undefined;
    let avatar_large: Buffer | undefined;
    let avatarMime: string | undefined;

    if (dto.avatar) {
      const compressedAvatarData = await processImage(dto.avatar);
      [avatar_small, avatar_medium, avatar_large] = compressedAvatarData.images;
      avatarMime = compressedAvatarData.format;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { avatar, ...dtoWithoutAvatar } = dto;

    const updatedData = {
      ...dtoWithoutAvatar,
      ...(avatar_small && { avatar_small }),
      ...(avatar_medium && { avatar_medium }),
      ...(avatar_large && { avatar_large }),
      ...(avatarMime && { avatarMime }),
    };

    await this.userRepository.update({ id }, updatedData);

    return this.userRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<OperationResultDto> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete({ id });

    const result: OperationResultDto = {
      status: 'success',
      message: `User with id: "${id}" deleted successfully`,
    };

    return result;
  }
}
