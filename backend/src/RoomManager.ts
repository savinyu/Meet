import { WebSocket } from 'ws'

export interface User {
    id : number;
    name : string;
    socket : WebSocket;
    roomId? : string;
    audioEnabled : boolean;
    videoEnabled : boolean;
    sharingScreen : boolean;
    displayStreamId : String | null;
};

export interface Room {
    roomId : string
};

type ReturnTypes = {success : true, status : "joined-room" }
    | {success : true, status : "already-in-room"} 
    | {success : false, status : "room-not-found"} 
    | {success : false, status : "room-full"} 
    | {success : false, status : "user-not-found"} 
    | {success : true, status : "removed"} 
    | {success : false, status : "room-already-exists"} 
    | {success : true, status : "room-created"};

export class RoomManager {
    private static instance : RoomManager;
    public users : User[] = [];
    public rooms : Room[] = [];

    private  constructor() {
    }

    public static getInstance() : RoomManager {
        if (!RoomManager.instance) {
            return RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }

    addUserToRoom(userId : number, roomId : string) : ReturnTypes {
        const curRoom = this.rooms.find((room) => room.roomId === roomId);
        if (!curRoom) return {success : false, status : "room-not-found"};
        
        const usersCount = this.countUsersInRoom(roomId);
        const curUser = this.users.find((user) => user.id === userId);
        if (!curUser) return {success : false, status : "user-not-found"};

        if (curUser.roomId === roomId) {
            return {success : true, status : "already-in-room"};
        }

        if (usersCount >= 5) {
            //Total Limit Already reached
            return {success : false, status : "room-full"};
        }

        if (curUser.roomId) {
            this.removeUserFromRoom(userId);    //If alrady in a room , then remove from that room first 
        }
        curUser.roomId = roomId;
        return {success : true, status : "joined-room" };
    }

    removeUserFromRoom(userId : number) : ReturnTypes {
        const curUser = this.users.find((user) => user.id === userId);
        
        if (!curUser) return {success : false, status : "user-not-found"}; 

        const roomId = curUser.roomId;
        const curRoom = this.rooms.find((room) => room.roomId === roomId);
        delete curUser.roomId;         //Remove the roomId from the user
        
        if (curRoom && roomId) {
            const usersCount = this.countUsersInRoom(roomId);
            if (usersCount <= 0) { // Delete the room if 0 users left
                const roomIndex = this.rooms.findIndex((room) => room.roomId === roomId);
                this.rooms.splice(roomIndex, 1);
            }
        }
        return {success : true, status : "removed"};
    }


    findRoomMembers(roomId : string, userId : number) : User[] {
        return this.users.filter((user) => user.roomId === roomId && user.id !== userId);
    }

    createRoom(roomId : string) : ReturnTypes {
        const room = this.rooms.find(room => room.roomId === roomId);
        if (room) {     //room with the roomId already exists
            return {success : false, status : "room-already-exists"};
        }
        this.rooms.push({roomId});
        return {success : true, status : "room-created"};
    }

    countUsersInRoom(roomId : string) : number {
        return this.users.filter(user => user.roomId === roomId).length; 
    }
}



