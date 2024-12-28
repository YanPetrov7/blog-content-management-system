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
import { compressImage } from '../common';

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
    const newUser: User = this.userRepository.create({
      ...dto,
      password_hash: hashedPassword,
      avatar: await compressImage(dto.avatar),
    });

    this.userRepository.save(newUser);

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

    await this.userRepository.update(
      { id },
      {
        ...dto,
        avatar: await compressImage(dto.avatar),
      },
    );

    const updatedUser = await this.userRepository.findOneBy({ id });

    return updatedUser;
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
