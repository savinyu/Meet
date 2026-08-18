# Meet — WebRTC Mesh Video Calling Application

A lightweight, multi-party video conferencing application built using **React**, **Node.js/Express**, **WebSockets (`ws`)**, and native **WebRTC** peer connections. 

Designed using a **full-mesh topology**, this application directly connects up to 5 participants with minimal server-side overhead and ultra-low latency media transfer.

---

## Features

- **Mesh Architecture**: Direct peer-to-peer audio/video streaming supporting up to 5 concurrent participants per room.
- **WebSocket Signaling**: Low-latency signaling server handles room joining, offer/answer SDP exchanges, and Trickle ICE candidate passing.
- **In-Memory State Management**: Lightweight server-side room management tracking active peers without database dependencies.
- **Custom React Hooks**:
  - `useLocalMedia`: Handles camera/microphone permissions, local media streams, and device hardware cleanup.
  - `useRoomSession`: Imperatively manages `RTCPeerConnection` lifecycles, remote streams, and signaling state.
- **Responsive UI & Grid Layout**: Dynamic 2x2 participant video grid with custom avatar fallbacks when video tracks are disabled or missing.
- **Clean Resource Teardown**: Proper closing of WebSocket sockets, peer connections, and hardware media tracks upon disconnection or component unmount.

---

## Tech Stack

### **Frontend**
- **Framework**: React.js
- **Media**: WebRTC API (`RTCPeerConnection`, `navigator.mediaDevices`)
- **Networking**: Native WebSockets API

### **Backend**
- **Runtime**: Node.js & Express
- **Signaling Server**: `ws` (WebSocket module)
- **State**: In-memory Singleton `RoomManager`

---

## Project Structure

This repository is structured as a monorepo containing both the frontend and backend applications:

```text
Meet/
├── frontend/                 # React UI & WebRTC Client Logic
│   ├── src/
│   │   ├── components/       # VideoCard, MyVideoCard, VideoGrid
│   │   ├── hooks/            # useLocalMedia, useRoomSession
│   │   └── App.jsx           # Main Room view
│   └── package.json
│
├── backend/                  # Node.js Express & WebSocket Signaling Server
│   ├── src/
│   │   ├── RoomManager.js    # In-memory singleton managing active rooms/peers
│   │   └── server.js         # Express setup & WebSocket connection handler
│   └── package.json
│
└── README.md
```

### Signaling Protocol Overview

| Event | Direction | Payload Structure | Description |
| --- | --- | --- | --- |
| `JOIN_ROOM` | Client ➔ Server | `{ roomId, userId }` | Initiates entry into a specific room session. |
| `USER_JOINED` | Server ➔ Client | `{ userId }` | Broadcasted to existing room participants when a new peer enters. |
| `OFFER` | Client ➔ Server ➔ Client | `{ targetId, senderId, sdp }` | Relays an SDP session description offer to a target peer. |
| `ANSWER` | Client ➔ Server ➔ Client | `{ targetId, senderId, sdp }` | Relays the target peer's SDP session description answer back to the offerer. |
| `ICE_CANDIDATE` | Client ➔ Server ➔ Client | `{ targetId, senderId, candidate }` | Forwards Trickle ICE candidates between peers to establish network routing. |
| `USER_LEFT` | Server ➔ Client | `{ userId }` | Notifies remaining participants when a peer closes their connection or leaves. |

