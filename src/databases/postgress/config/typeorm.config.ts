import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Category } from '../../../category/entities';
import { Post } from '../../../post/entities';
import { User } from '../../../user/entities';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST'),
  port: configService.get<number>('POSTGRES_PORT'),
  username: configService.get<string>('POSTGRES_USERNAME'),
  password: configService.get<string>('POSTGRES_PW'),
  database: configService.get<string>('POSTGRES_NAME'),
  entities: [User, Category, Post],
  synchronize: true,
});
