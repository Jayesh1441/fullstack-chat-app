import {Server} from "socket.io"
import http  from "http"
import express from "express"

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors: {
        origin: ["http://localhost:5173"]
    }
});
export function getReceiverSocketId(userId) {
    return userSocketMap[userId]
}
const userSocketMap = {}

io.on("connection", (socket)=>{
    console.log("A Client connected",socket.id);

    const userId = socket.handshake.query.userId
    if(userId) userSocketMap[userId] = socket.id

    //io.emit() used to send events to all connected clints
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("A Client disconnected",socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
        });
})

export {io, app, server};