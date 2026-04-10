import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { CommentEntity } from '../posts/comment.entity';
import { PostEntity } from '../posts/post.entity';
import { TaskEntity } from '../tasks/task.entity';
import { UserEntity } from '../users/user.entity';

type SupportedDatabase = 'mssql' | 'postgres';

function getDatabaseType(): SupportedDatabase {
  const databaseType = (process.env.DB_TYPE ?? 'mssql').toLowerCase();

  if (databaseType === 'mssql' || databaseType === 'postgres') {
    return databaseType;
  }

  throw new Error(`Unsupported DB_TYPE "${process.env.DB_TYPE}". Use "mssql" or "postgres".`);
}

function getBaseDatabaseOptions() {
  const type = getDatabaseType();
  const isSqlServer = type === 'mssql';
  const useNativeDriver = isSqlServer && process.env.DB_DRIVER === 'msnodesqlv8';

  const hasExplicitPort = !!process.env.DB_PORT;
  const hasInstance = isSqlServer && !!process.env.DB_INSTANCE;

  const host = process.env.DB_HOST ?? 'localhost';
  const database = process.env.DB_NAME ?? 'nestjs_tasks';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseOptions: { type: SupportedDatabase } & Record<string, any> = {
    type,
    host,

    // ✅ MSSQL RULE:
    // - instanceName → NO port
    // - port → NO instance
    ...(hasExplicitPort && !hasInstance
      ? { port: Number(process.env.DB_PORT) }
      : {}),

    username: process.env.DB_USERNAME ?? (isSqlServer ? 'sa' : 'postgres'),
    password: process.env.DB_PASSWORD ?? '',
    database,
    ...(isSqlServer && process.env.DB_DOMAIN ? { domain: process.env.DB_DOMAIN } : {}),
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  };

  // ✅ msnodesqlv8: uses native ODBC driver (shared memory / named pipes)
  // No TCP/IP needed — works like SSMS with Windows Authentication
  if (useNativeDriver) {
    const server = hasInstance ? `${host}\\${process.env.DB_INSTANCE}` : host;
    const odbcDriver = process.env.DB_ODBC_DRIVER ?? 'ODBC Driver 17 for SQL Server';
    // TypeORM 0.3.x: `driver` must be the actual mssql/msnodesqlv8 module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    baseOptions.driver = require('mssql/msnodesqlv8');
    baseOptions.extra = {
      connectionString: `Driver={${odbcDriver}};Server=${server};Database=${database};Trusted_Connection=yes;`,
    };
  }

  return baseOptions;
}

function getSqlServerOptions() {
  return {
    options: {
      instanceName: process.env.DB_INSTANCE,
      trustServerCertificate: true,
      enableArithAbort: true, // ✅ REQUIRED by tedious
    },
  };
}

export function getTypeOrmModuleOptions(): TypeOrmModuleOptions {
  const baseOptions = getBaseDatabaseOptions();

  if (baseOptions.type === 'mssql') {
    return {
      ...baseOptions,
      ...getSqlServerOptions(),
      autoLoadEntities: true,
    } as TypeOrmModuleOptions;
  }

  return {
    ...baseOptions,
    autoLoadEntities: true,
  } as TypeOrmModuleOptions;
}

export function getDataSourceOptions(): DataSourceOptions {
  const baseOptions = getBaseDatabaseOptions();
  const dataSourceOptions = {
    ...baseOptions,
    entities: [UserEntity, PostEntity, CommentEntity, TaskEntity],
    migrations: ['src/database/migrations/*.ts'],
  };

  if (baseOptions.type === 'mssql') {
    return {
      ...dataSourceOptions,
      ...getSqlServerOptions(),
    } as DataSourceOptions;
  }

  return dataSourceOptions as DataSourceOptions;
}