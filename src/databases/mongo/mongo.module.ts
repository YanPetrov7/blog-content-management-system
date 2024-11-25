import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL'),
        dbName: config.get<string>('MONGO_DB_NAME'),
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
