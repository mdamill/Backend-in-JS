import mongoose, { Schema } from 'mongoose'

const subscriptionSchema = new mongoose.Schema({

    subscriber : { // person who presses the subscribe button
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    channel : { // creator who gets subscribed
        type : Schema.Types.ObjectId,
        ref : "User"
    }

}, {timestamps:true})

export const Subsciption = mongoose.model("Subscription", subscriptionSchema)