import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { Post } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), UserModule, CategoryModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [TypeOrmModule, PostService],
})
export class PostModule {}
