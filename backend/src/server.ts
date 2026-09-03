import express from 'express'
import dotenv from 'dotenv'
import { RoomManager } from './RoomManager.js'
import cors from 'cors'

dotenv.config();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

const roomManager = RoomManager.getInstance();
// create an express server
const app = express();

app.use(express.json());
app.use(cors({
    origin: CLIENT_ORIGINS
}));

app.post('/room', (req, res) => {
    const roomId = crypto.randomUUID();
    
    const response = roomManager.createRoom(roomId);
    if (response.success) {
        return res.json({
            type : response.status,
            roomId : roomId
        });
    } else {
        return res.json({
            type : "error",
            message : response.status
        });
    }
});

export const server = app.listen(PORT, () => {
    console.log("Server is listening on port:", PORT);
});