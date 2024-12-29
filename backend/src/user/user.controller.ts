import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { User } from './entities';
import { OperationResultDto } from '../dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createFileValidationPipe } from '../common';
import { Response } from 'express';

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

  @Get(':id/avatar')
  async findUserAvatar(
    @Param('id') id: number,
    @Res() res: Response,
  ): Promise<void> {
    const avatar = await this.userService.findAvatar(id);

    res.setHeader('Content-Type', avatar.format);
    res.send(avatar.buffer);
  }

  @Delete(':id/avatar')
  async removeUserAvatar(@Param('id') id: number): Promise<OperationResultDto> {
    return this.userService.removeAvatar(id);
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
