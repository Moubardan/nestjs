import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './src/database/database.config';

export default new DataSource(getDataSourceOptions());