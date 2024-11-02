import { createClient } from "redis"
import pkg from 'bullmq';
const { Queue, Worker, QueueScheduler } = pkg;
// import { Queue, QueueScheduler, Worker } from 'bullmq';
let redisClient; // Define redisClient in the outer scope

const connectRedisDB = async() =>{
    try {
        redisClient = createClient ({
            url : `rediss://default:${process.env.REDISDB_PASSWORD}@exciting-sturgeon-35539.upstash.io:6379`
          }); 
          
          redisClient.on("error", function(err) {
            throw err;
          });
          await redisClient.connect()
          // await redisClient.set('why','this');
    } catch (error) {
        console.log("Redis DB Connection Failed",error)
    }
      

}

export {connectRedisDB, redisClient,Queue, Worker }