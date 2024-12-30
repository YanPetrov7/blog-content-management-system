import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, VerificationKey } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, CreateVerificationKeyDto } from './dto';
import * as argon2 from 'argon2';
import { OperationResultDto } from '../dto';
import { ImageSize, ProcessedImageDto, processImage } from '../common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { VerificationKeyDto } from './dto/verification-key.dto';
import { v4 as uuidV4 } from 'uuid';
import { VerificationDataDto } from './dto/verification-data.dto';

@Injectable()
export class UserService {
  private readonly VERIFICATION_KEY_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationKey)
    private readonly verificatrionKeyRepository: Repository<VerificationKey>,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    private readonly configService: ConfigService,
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

    return {
      status: 'success',
      message: 'Avatar removed successfully',
    };
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

    await this.createAndSendVerificationKey(dto.email);

    return {
      status: 'success',
      message: 'User created successfully',
    };
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

  async verifyUser(dto: VerificationKeyDto): Promise<OperationResultDto> {
    const verificationKey = await this.verificatrionKeyRepository.findOneBy({
      key: dto.key,
    });

    if (!verificationKey) {
      throw new NotFoundException('Verification key not found');
    }

    const { email, expires_at } = verificationKey;

    if (expires_at < new Date()) {
      await this.createAndSendVerificationKey(email);

      await this.verificatrionKeyRepository.delete({ id: verificationKey.id });

      return {
        status: 'failed',
        message: 'Verification key expired. New key sent to your email.',
      };
    }

    await this.verificatrionKeyRepository.delete({ id: verificationKey.id });

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new ConflictException('User is already verified');
    }

    await this.userRepository.update(user.id, { is_verified: true });

    return {
      status: 'success',
      message: 'User verified successfully',
    };
  }

  private async notifyUser({
    subject,
    body,
    fromAddr,
    toAddrs,
  }: {
    subject: string;
    body: string;
    fromAddr: string;
    toAddrs: string[];
  }): Promise<void> {
    const payload = {
      subject,
      body,
      from_addr: fromAddr,
      to_addrs: toAddrs,
    };

    this.emailClient.emit({ cmd: 'send_email' }, payload);
  }

  private sendVerificationEmail(dto: VerificationDataDto): void {
    const host = this.configService.get<string>('URL_HOST');
    const port = this.configService.get<number>('URL_PORT');

    const url = `http://${host}:${port}/users/verify?key=${dto.key}`;

    this.notifyUser({
      subject: 'Verification Mail',
      body: url,
      fromAddr: 'blog_content_manager@example.io',
      toAddrs: [dto.email],
    });
  }

  private async createAndSendVerificationKey(email: string): Promise<void> {
    const newKey = uuidV4();
    const newExpiresAt = new Date(
      Date.now() + this.VERIFICATION_KEY_EXPIRATION_TIME,
    );

    const createVerificationKeyDto: CreateVerificationKeyDto = {
      key: newKey,
      email,
      expires_at: newExpiresAt,
    };

    const verificationDataDto: VerificationDataDto = {
      key: newKey,
      email,
    };

    const verificationKeyEntity = this.verificatrionKeyRepository.create(
      createVerificationKeyDto,
    );
    await this.verificatrionKeyRepository.save(verificationKeyEntity);

    this.sendVerificationEmail(verificationDataDto);
  }
}
