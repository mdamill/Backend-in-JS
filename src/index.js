/* BASIC APPROACH :- 

import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
})

import express from 'express'

const app = express()

import mongoose from 'mongoose'

import {DB_NAME} from './constants.js'

;( async ()=>{
    try {

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error)=>{
            console.log("ERROR :", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.log(`Error : ${error}`)
    }
})()
*/
import dotenv from "dotenv"
dotenv.config({ path: "C:/Users/mdami/OneDrive/Desktop/BACKEND/Backend in JS/.env" });
import connectDB from "./db/index.js";
import {app} from './app.js'

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})