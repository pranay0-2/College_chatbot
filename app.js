import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "160kb"}))
app.use(express.urlencoded({extended: true, limit: "160kb"}))
app.use(cookieParser())



// import routes
import userRouter from './routes/user.routes.js'

import facultyRoutes from './routes/faculty.routes.js'
        

// routes declaration
app.use("/api/v1/users", userRouter) 

app.use("/api/v1/faculty" , facultyRoutes);

export {app}