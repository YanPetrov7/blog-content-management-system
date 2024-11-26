import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

export const mongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const MONGO_USERNAME = configService.get<string>(
    'MONGO_INITDB_ROOT_USERNAME',
  );
  const MONGO_PASSWORD = configService.get<string>(
    'MONGO_INITDB_ROOT_PASSWORD',
  );

  return {
    uri: `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017`,
    dbName: configService.get<string>('MONGO_DB'),
  };
};
