import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { User, VerificationKey } from './entities';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, VerificationKey])],
  providers: [
    UserService,
    {
      provide: 'EMAIL_SERVICE',
      useFactory: (configService: ConfigService) => {
        const AMQP_URL = configService.get<string>('AMQP_URL');
        const QUEUE_NAME = configService.get<string>('QUEUE_NAME');

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [AMQP_URL],
            queue: QUEUE_NAME,
            queueOptions: {
              durable: true,
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [UserController],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
