const express = require("express")
const cors = require("cors")
require("dotenv").config({ path: './config/local.env' });
const cookieparser = require('cookie-parser');
const bodyparser = require("body-parser");


const user = require("./routes/user") 
const public = require("./routes/public");
const organization = require("./routes/organization");
const connectDB = require("./config/db")


const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieparser());
app.use(bodyparser.urlencoded({ extended: true }));


app.use(cors({
    origin : ["http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials : true
}
)) ;
app.options('*', cors()); 


app.use(bodyparser.json());
app.use("/api/user",user);
app.use("/api/public",public);
app.use("/api/organization",organization);


app.post('/webhook', (req, res) => {
    console.log('Received webhook:', req.body);
    res.sendStatus(200);
});



  
connectDB().then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log(`Server running on port ${process.env.PORT || 5000}`);
    })
});

