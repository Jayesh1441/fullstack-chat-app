import jwt from "jsonwebtoken"
import User from "../models/users.model.js"

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "You are not logged in" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" }); 
        }

        const user = await User.findOne({ _id: decoded.userId }).select("-password");

        if (!user) {
            return res.status(404).json({message:"User Not Found!"})            
        }

        req.user = user 
        next()
    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);
        
    }
}