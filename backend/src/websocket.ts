import { WebSocket , WebSocketServer } from 'ws'
import { server } from './server.js'
import { RoomManager , type User} from './RoomManager.js'

const roomManager = RoomManager.getInstance();

// create a web socket server 
const wss = new WebSocketServer({server});


let id : number = 1;

// connect to the web socket server
wss.on('connection', (ws) => {
    ws.on('error', console.error);

    const user : User = {
        name : id.toString(),
        socket : ws,
        id : id,
        audioEnabled : true,
        videoEnabled : true
    };

    //Send the user back his Id
    ws.send(JSON.stringify({
        type : "id",
        id : id
    }));

    id++;
    roomManager.users.push(user);
    console.log(`New user connected. Now total users are : ${roomManager.users.length}`);
    

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            const user = roomManager.users.find((user) => user.socket === ws);
            if (!user) {
                ws.send(JSON.stringify({
                    type : "error",
                    code : "user-not-found"
                }));
                ws.close();
                return;
            }
            const receiver = findUserById(message.to);
            
            switch (message.type) {
                case 'name' : {
                    if (typeof message.name === "string" && message.name !== "" && message.name.length <= 15) {
                        user.name = message.name;
                    } else {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "invalid-name"
                        }));
                    }
                    break;
                }
                case 'joinRoom' : {
                    const response = roomManager.addUserToRoom(user.id, message.roomId);

                    if (!response.success || response.status === "already-in-room") {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : response.status
                        }));
                        return;
                    }
                    ws.send(JSON.stringify({
                        type : "join-room-result",
                        code : response.status
                    }));

                    //set media preferences when joining
                    if (typeof message.audioEnabled ===  'boolean')
                        user.audioEnabled = Boolean(message.audioEnabled);
                    if (typeof message.videoEnabled === 'boolean')
                        user.videoEnabled = Boolean(message.videoEnabled);
                    
                    const roomMembers = roomManager.findRoomMembers(message.roomId, user.id);

                    //Send notification to every other person in the room that someone joined
                    roomMembers.forEach((member) => {
                        if (member.socket.readyState === WebSocket.OPEN) {
                            member.socket.send(JSON.stringify({
                                type : "participant-added",
                                participantId : user.id,
                                name : user.name,
                                audioEnabled : user.audioEnabled,
                                videoEnabled : user.videoEnabled
                            }));
                        }
                    });

                    const participants = roomMembers.map((member) => ({
                        id : member.id,
                        name : member.name,
                        audioEnabled : member.audioEnabled,
                        videoEnabled : member.videoEnabled
                    }));
                    
                    //Send the Room Members list to the new Joinee
                    ws.send(JSON.stringify({
                        type : "room-members",
                        participants : participants
                    }));

                    break;
                }
                case 'leaveRoom' : {
                    ws.close();
                    break;
                }
                case 'createOffer' : {
                    
                    if (!receiver || !user.roomId || receiver.roomId !== user.roomId) {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-found"
                        }));
                        break;
                    }
                    
                    if (receiver.socket.readyState === WebSocket.OPEN) {
                        receiver.socket.send(JSON.stringify({
                            type : "createOffer",
                            sdp : message.sdp,
                            from : user.id
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-connected"
                        }));
                    }
                    break;
                }
                case 'createAnswer' : {
                    
                    if (!receiver || !user.roomId || receiver.roomId !== user.roomId) {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-found"
                        }));
                        break;
                    }
                    
                    if (receiver.socket.readyState === WebSocket.OPEN) {
                        receiver.socket.send(JSON.stringify({
                            type : "createAnswer",
                            sdp : message.sdp,
                            from : user.id
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-connected"
                        }));
                    }
                    break;
                }
                case 'iceCandidates' : {
                    
                    if (!receiver || !user.roomId || receiver.roomId !== user.roomId) {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-found"
                        }));
                        break;
                    }

                    if (receiver.socket.readyState === WebSocket.OPEN) {
                        receiver.socket.send(JSON.stringify({
                            type : "iceCandidates",
                            iceCandidates : message.iceCandidates,
                            from : user.id
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type : "error",
                            code : "receiver-not-connected"
                        }));
                    }
                    break;
                }
                case 'toggleMedia' : {
                    if (!user.roomId) {
                        ws.send(JSON.stringify({
                            type : 'error',
                            code : 'not-in-room'
                        }));
                        break;
                    }

                    //change the user state
                    if (typeof message.audioEnabled ===  'boolean')
                        user.audioEnabled = Boolean(message.audioEnabled);
                    if (typeof message.videoEnabled === 'boolean')
                        user.videoEnabled = Boolean(message.videoEnabled);

                    //broadcast to other room members
                    const roomMembers = roomManager.findRoomMembers(user.roomId, user.id);

                    roomMembers.forEach((member) => {
                        if (member.socket.readyState === WebSocket.OPEN) {
                            member.socket.send(JSON.stringify({
                                type : 'toggleMedia',
                                from : user.id,
                                audioEnabled : user.audioEnabled,
                                videoEnabled : user.videoEnabled
                            }));
                        }
                    });
                    break;
                }
                default : {
                    ws.send(JSON.stringify({
                        type : "error",
                        code : "invalid-request"
                    }));
                }
            }
        } catch {
            ws.send(JSON.stringify({
                type : "error",
                code : "invalid-details"
            }));
        }
    });

    ws.on('close', (code, reason) => {
        const index : number  = roomManager.users.findIndex((user) => user.socket === ws);

        if (user.roomId) {
            //notify that a member left 
            const roomMembers = roomManager.findRoomMembers(user.roomId, user.id);

            roomMembers.forEach((member) =>  {
                if (member.socket.readyState === WebSocket.OPEN) {
                    member.socket.send(JSON.stringify({
                        type : "participant-left",
                        participantId : user.id
                    }));
                }
            });

            roomManager.removeUserFromRoom(user.id);
        }

        if (index !== -1) {
            roomManager.users.splice(index, 1);
        }

        console.log(`One user disconnected. Now total users : ${roomManager.users.length}`);
    });
});

wss.on('error', (error) => console.log(error));

//function to find the user id 
function findUserById(receiverId: number) {
    return roomManager.users.find((user) => user.id === receiverId)
}