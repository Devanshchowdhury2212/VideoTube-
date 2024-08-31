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



// Routes Declaration
app.use("/api/v1/users",userRouter)
//prefix+users+register later
//http:localhost:8000/api/v1/users/register
//

export {app}