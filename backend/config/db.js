const mongoose = require("mongoose")

async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected Successfully");
    } catch(err){
        console.log("MongoDB Connection Error:", err);
    }
}

module.exports = connectDB;