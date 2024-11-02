// import { redisClient } from '../db/redisindex.js'
// import {redisClient} from '../index.js'

import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();


// Create a new Queue and Scheduler instance for notifications
const notificationQueue = new Queue('notifications',{connection:{
    url:`rediss://default:${process.env.REDISDB_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`
    //`rediss://default:${process.env.REDISDB_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`
}});
// const notificationScheduler = new QueueScheduler('notifications',{connection:redisClient});


export { notificationQueue }