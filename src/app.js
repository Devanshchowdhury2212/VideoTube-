import express, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("Public_asset"))
app.use(cookieParser()) 

// Routes Import
import userRouter from './routes/user.route.js'
import commentRouter from './routes/comment.route.js'
import videoRouter from './routes/video.route.js'

// Routes Declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/comments",commentRouter)
app.use('/api/v1/video',videoRouter)
//prefix+users+register later
//http:localhost:8000/api/v1/users/register
//

export { app }