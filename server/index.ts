import 'dotenv/config';
import DataCollector from './data/DataCollector';
import routes from './routes';

DataCollector.start();
routes();