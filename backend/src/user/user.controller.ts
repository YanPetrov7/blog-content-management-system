import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { User } from './entities';
import { OperationResultDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createFileValidationPipe } from '../common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findUser(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(createFileValidationPipe()) avatar: Express.Multer.File,
  ): Promise<OperationResultDto> {
    createUserDto.avatar = avatar;

    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Param('id') id: number,
    @UploadedFile(createFileValidationPipe()) avatar: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    updateUserDto.avatar = avatar;

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async removeUser(@Param('id') id: number): Promise<OperationResultDto> {
    return this.userService.remove(id);
  }
}
