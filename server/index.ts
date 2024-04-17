import 'dotenv/config';
import express from 'express';
import { Request, Response } from 'express';
import DataCollector from './dataCollector/DataCollector';

// DataCollector.start();

const app = express();

app.get('/', (_: Request, res: Response) => {
  res.send('Application works!');
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
});