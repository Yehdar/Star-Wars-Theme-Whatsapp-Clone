// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.port || 9000;

const pusher = new Pusher({
  appId: "1473604",
  key: "5212949ccc1a465d6275",
  secret: "5c8a481fe238ec85cb47",
  cluster: "us2",
  useTLS: true
});

pusher.trigger("messages", "inserted", {
  message: "hello world"
});

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = "mongodb+srv://admin:k7aH84EXcxOp0Rit@cluster0.2lnhxog.mongodb.net/test?retryWrites=true&w=majority";

// ????

const db = mongoose.connection;

db.once("open",()=>{
    console.log("DB connected");

    const msgCollection = db.collection ("messagecontents"); 
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change)=>{
        console.log("A change occured", change);
  
    if (change.operationType === 'insert') {
        const messageDetails = change.fullDocument;
        pusher.trigger("messages", "inserted", {
            name: messageDetails.user,
            message: messageDetails.message,
            timestamp: messageDetails.timestamp,
        }); 
    } else {
        console.log("Error triggering Pusher");
    }
    })

});

// api routes
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req,res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

// listen
app.listen(port,()=>console.log(`Listening on localhost:${port}`));