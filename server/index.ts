import 'dotenv/config';
import DataCollector from './data/DataCollector.js';
import routes from './routes/routes.js';

DataCollector.start();
routes();