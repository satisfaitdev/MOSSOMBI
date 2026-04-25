import { initDatabase, appDataSource } from './db/dataSource.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  await initDatabase();
  const cols = await appDataSource.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'agency_articles'");
  console.log("SCHEMA:", cols);
  process.exit(0);
}
run().catch(console.error);
