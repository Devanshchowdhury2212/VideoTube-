// require('dotenv').config() // using esm module type hence not workinh
import dotenv from 'dotenv';
import connectdb from "./db/index.js"; 
import  { connectRedisDB, redisClient }  from './db/redisindex.js';
import {app} from './app.js'


dotenv.config({
    path:"./.env"
});



// Function to start the server after successful connections
const startServer = () => {
    app.on("error", (error) => {
        console.log("Error while Listening to Port", error);
    });
    
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port ${process.env.PORT || 8000}`);
    });
};

// Function to establish both MongoDB and Redis connections
const init = async () => {
    try {
        // First connect to Redis
        await connectRedisDB();
        console.log("RedisDB connected successfully");

        // Then connect to MongoDB
        await connectdb();
        console.log("MongoDB connected successfully");

        // Start the server once both connections are established
        startServer();
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); // Exit the process with failure
    }
};

// Initialize connections and start the server
init();

export {}















// console.log(process.env)
// console.log(process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_SECRET_KEY);

// redisdb()
// .then(() => {
//     // console.log("Connection Established Succesfully")

//     app.on("error",(error)=>{
//         console.log("Error while Listening To Port RedisDB",error)
//     })
//     app.listen(process.env.PORT || 8000,()=>{
//         console.log(`Connection Established Succesfully with RedisDB at ${process.env.PORT}`)
//     })
// })
// .catch((error) =>{console.log("Connection Failed",error)})
 
// connectdb()
// .then(() => {
//     // console.log("Connection Established Succesfully")

//     app.on("error",(error)=>{
//         console.log("Error while Listening To Port",error)
//     })
//     app.listen(process.env.PORT || 8000,()=>{
//         console.log(`Connection Established Succesfully at ${process.env.PORT}`)
//     })
// })
// .catch((error) =>{console.log("Connection Failed",error)})





// dotenv.config(); // Load the environment variables from the .env file
// async function connectdb(){
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log(error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`APP is listening on Port ${process.env.PORT}`)
//         })
//     }
//     catch(error){
//         console.log("ERROR",error)
//         throw error
//     }
// }

// connectdb()