import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/users.model.js";

export const getUsersFromSidebar = async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
  
      const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
  
      const usersWithLastMessage = await Promise.all(
        users.map(async (user) => {
          const lastMessage = await Message.findOne({
            $or: [
              { senderId: loggedInUserId, receiverId: user._id },
              { senderId: user._id, receiverId: loggedInUserId }
            ]
          })
            .sort({ createdAt: -1 })
            .lean();
  
          return {
            ...user.toObject(),
            lastMessageTime: lastMessage?.createdAt || null,
          };
        })
      );
  
      // sort by last message time
      usersWithLastMessage.sort((a, b) =>
        new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
      );
  
      res.status(200).json(usersWithLastMessage);
    } catch (error) {
      console.log("error in getUsersFromSidebar", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  

export const getMessages = async (req, res) => {
    try {
      const {id:userToChatId} = req.params
      const myId = req.user._id;

      const messages = await Message.find({
        $or: [
            {senderId:myId, receiverId:userToChatId},
            {senderId:userToChatId, receiverId:myId},
        ]
      })
      res.status(200).json(messages)
    } catch (error) {
        console.log("error in getUsersFromSidebar",error.message);
        res.status(500).json({ error: "Internal server error" });

    }
}

export const sendMessages = async (req, res) => {
    try {
        const {text, image} = req.body
        const {id: receiverId} = req.params
        const senderId = req.user._id

        let imgUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imgUrl = uploadResponse.secure_url;
        } 

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imgUrl
        })
        await newMessage.save()
        // todo: to make a functionality with socket.io
        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage', newMessage)
        }

        res.status(201).json(newMessage)
    } catch (error) {
        console.log("error in getUsersFromSidebar",error.message);
        res.status(500).json({ error: "Internal server error" });

    }
} 