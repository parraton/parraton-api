/* Redis setup  */
import Redis from 'ioredis';
import { REDIS_CONNECTION_STRING } from './config';

export const redis = new Redis(REDIS_CONNECTION_STRING);
