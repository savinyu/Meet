import express from 'express'
import { RoomManager } from './RoomManager.js'
import cors from 'cors'

const roomManager = RoomManager.getInstance();
// create an express server
const app = express();

app.use(express.json());
app.use(cors({
    origin :true
}));
let port = 3000;

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

export const server = app.listen(port, "0.0.0.0", () => {
    console.log("Server is listening on port:", port);
});