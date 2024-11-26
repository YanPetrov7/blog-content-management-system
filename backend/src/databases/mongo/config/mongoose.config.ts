import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const mongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const MONGO_USERNAME = configService.get<string>('MONGO_USERNAME');
  const MONGO_PW = configService.get<string>('MONGO_PW');

  return {
    uri: `mongodb://${MONGO_USERNAME}:${MONGO_PW}@mongo:27017`,
    dbName: configService.get<string>('MONGO_DB_NAME'),
  };
};
