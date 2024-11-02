import { redisClient,Worker } from "../db/redisindex.js";
import {notificationQueue} from  "./notificationQueue.js"
import {sendEmail} from './notficationEmail.js'
import dotenv from 'dotenv';
dotenv.config();

const notificationWorker = new Worker('notifications',async (job) => {
    const { title, message, recipient } = job.data
    sendEmail(recipient,"New Video Uploaded",message)
},{
  connection:{url:`rediss://default:${process.env.REDISDB_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`}
}
)

async function publishNotification(type,message,recipient) {

    await notificationQueue.add('send', {
        type,
        message,
        recipient,
      }, {
        attempts: 3,      // Retry failed jobs up to 3 times
        delay: 5000,      // Optional delay between retries
      },{
        connection:{url:`rediss://default:${process.env.REDISDB_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`}
      })
    
}
export {notificationWorker,publishNotification}