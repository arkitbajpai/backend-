//require('dotenv').config({path:'.env'})
import dotenv from "dotenv"
import app from "../src/app.js"



// import express from "express"
// const app= express()
// ( async()=>{
// try{
//   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//   app.on("error",(error)=>{
//     console.log("ERRR: ", error)
//   })
//   app.listen(process.env.PORT,()=>{
    
//   })
// }
// catch(error){
//     console.error("ERROR: ", error)
//     throw err
// }
// })()

dotenv.config({
    path:'.env'
})
import connectDB from "./db/index.js";
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port:${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("mongo db connection failed!!", err)
})


