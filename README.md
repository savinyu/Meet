# Meet — WebRTC Mesh Video Calling

A multi-party video conferencing app built on **native WebRTC** — no Zoom SDK, no Agora, no LiveKit. Up to 5 participants per room connect directly to each other in a **full-mesh topology**, with the server acting purely as a signaling relay. Media never touches the backend.

**Live demo:** [meet-kohl-three.vercel.app](https://meet-kohl-three.vercel.app)

---

## Features

- **Full-mesh P2P media** — every participant holds a direct `RTCPeerConnection` to every other participant. No SFU, no media server, no per-stream server cost.
- **Screen sharing** — `getDisplayMedia` capture published as a second stream over the existing peer connections, with a dedicated presentation stage in the UI. One presenter at a time, enforced server-side.
- **Late-joiner awareness** — someone who joins mid-call receives the full participant roster, their current mic/camera states, and any in-progress screen share, so the UI is correct from the first frame.
- **Live media state sync** — mic and camera toggles are broadcast over the signaling channel so remote tiles show accurate mute/camera-off state instead of guessing from the track.
- **STUN + TURN relay fallback** — Google STUN for direct connections, with ExpressTURN and Metered TURN servers configured so calls survive symmetric NATs and restrictive networks.
- **Deterministic teardown** — peer connections closed, event handlers detached, WebSockets shut down, and hardware tracks stopped on unmount and on hangup, so the camera indicator actually turns off.
- **Room lifecycle** — rooms are created via a REST call with a UUID code, tracked in memory, and automatically destroyed once the last participant leaves.
- **Sharable room codes** — one-tap copy with the Web Share API on mobile.
- **Persistent display names** — names (max 15 chars) stored in `localStorage`/`sessionStorage`, with an `Anonymous` fallback and avatar initials when video is off.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Axios |
| Media | WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`) |
| Signaling | Native `WebSocket` API (client), `ws` (server) |
| Backend | Node.js, Express 5, TypeScript |
| State | In-memory singleton `RoomManager` — no database |

---

## Architecture

```
        ┌──────────────────────────────────────────┐
        │   Express + ws  (signaling only)         │
        │   RoomManager: rooms, peers, media state │
        └───────▲───────────▲───────────▲──────────┘
                │ SDP/ICE   │           │
        ┌───────┴───┐   ┌───┴───────┐   ┌┴──────────┐
        │  Client A │───│  Client B │───│  Client C │
        └───────────┘   └───────────┘   └───────────┘
             └──────── direct P2P media ───────┘
```

The server never sees audio or video. It only relays SDP offers/answers and trickled ICE candidates, and keeps track of who is in which room and what their mic, camera, and screen-share state is.

### Custom React hooks

All WebRTC imperative state is isolated in hooks, so components never touch a peer connection directly.

- **`useLocalMedia`** — camera/mic acquisition, mute and camera toggles applied at the track level, preference persistence, and hardware cleanup.
- **`useScreenShare`** — display capture lifecycle, including handling the browser's native "Stop sharing" button.
- **`useRoomSession`** — the core of the app. Manages the `RTCPeerConnection` map, the signaling socket, offer/answer negotiation via `onnegotiationneeded`, remote stream routing, and roster state.

### Distinguishing camera from screen streams

Both a participant's camera and their screen arrive on the same peer connection through `ontrack`, so the client has to tell them apart. When a presenter starts sharing, the server broadcasts the `MediaStream.id` of the display capture. Receivers match incoming streams against that ID and route them to either the presentation stage or the participant's video tile.

---

## Project Structure

```text
Meet/
├── backend/
│   ├── src/
│   │   ├── server.ts         # Express app, POST /room, HTTP server export
│   │   ├── websocket.ts      # ws server, signaling message handlers (entry point)
│   │   └── RoomManager.ts    # Singleton: users, rooms, capacity, membership
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Home.tsx      # Pre-join preview, create/join room
│   │   │   └── Room.tsx      # Call view: grid, PiP, stage, controls
│   │   ├── Components/       # VideoCard, ScreenCard, ActionPanel, Alert, UsernameInput
│   │   ├── hooks/            # useLocalMedia, useScreenShare, useRoomSession
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

---

## Signaling Protocol

### Client ➔ Server

| Type | Payload | Description |
| --- | --- | --- |
| `name` | `{ name }` | Sets the display name (rejected if empty or over 15 chars). |
| `joinRoom` | `{ roomId, audioEnabled, videoEnabled }` | Joins a room and registers initial media state. |
| `leaveRoom` | `{}` | Closes the connection. |
| `createOffer` | `{ sdp, from, to }` | SDP offer for a specific peer. |
| `createAnswer` | `{ sdp, from, to }` | SDP answer for a specific peer. |
| `iceCandidates` | `{ iceCandidates, from, to }` | Trickled ICE candidate for a specific peer. |
| `toggleMedia` | `{ audioEnabled, videoEnabled }` | Announces a mic or camera change. |
| `shareScreen` | `{ displayStreamId }` | Claims the presenter slot. |
| `stopScreenShare` | `{}` | Releases the presenter slot. |

### Server ➔ Client

| Type | Payload | Description |
| --- | --- | --- |
| `id` | `{ id }` | Assigned connection ID, sent immediately on connect. |
| `join-room-result` | `{ code }` | Confirms a successful join. |
| `room-members` | `{ participants, activeSharerId, displayStreamId }` | Full roster for a new joiner, including any active screen share. |
| `participant-added` | `{ participantId, name, audioEnabled, videoEnabled }` | A new peer entered the room. |
| `participant-left` | `{ participantId }` | A peer disconnected; receivers tear down that connection. |
| `createOffer` / `createAnswer` / `iceCandidates` | relayed payload + `from` | Forwarded verbatim between peers in the same room. |
| `toggleMedia` | `{ from, audioEnabled, videoEnabled }` | A peer changed mic or camera state. |
| `displayStreamId` | `{ from, displayStreamId }` | A peer started sharing; ID identifies their display stream. |
| `screenShareStopped` | `{ from }` | A peer stopped sharing, or disconnected while sharing. |
| `error` | `{ code }` | See below. |

**Error codes:** `invalid-name`, `invalid-request`, `invalid-details`, `user-not-found`, `room-not-found`, `room-full`, `already-in-room`, `not-in-room`, `receiver-not-found`, `receiver-not-connected`, `someone-already-sharing`

Relay messages are validated so a peer can only signal another peer in the same room.

### REST

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/room` | Creates a room with a UUID code, returns `{ type, roomId }`. |

---

## Getting Started

### Prerequisites

Node.js 18+ and npm. A browser with WebRTC support (Chrome, Edge, Firefox, or Safari).

### Backend

```bash
cd backend
npm install
npm run build
npm start          # listens on http://localhost:3000
```

Create `backend/.env`:

```env
PORT=3000
# Comma-separated if you have multiple frontends (e.g. old + custom domain)
CLIENT_URL=http://localhost:5173,https://your-custom-domain.com
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # serves http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# TURN — optional locally, required for calls across restrictive NATs
VITE_EXPRESSTURN_URL=
VITE_EXPRESSTURN_USER=
VITE_EXPRESSTURN_PASS=

VITE_METERED_URL1=
VITE_METERED_URL2=
VITE_METERED_URL3=
VITE_METERED_URL4=
VITE_METERED_USER=
VITE_METERED_PASS=
```

TURN credentials can be left blank for local testing on one machine, since peers connect over the loopback or LAN path. They are needed for real-world calls where at least one participant is behind a symmetric NAT.

### Trying it out

Open two browser windows (or use a second device on the same network), create a room in one, and paste the room code into the other. Grant camera and microphone permission in both.

---

## Design Decisions & Limitations

- **Why mesh, and why 5?** In a mesh, each client maintains `N-1` peer connections and uploads `N-1` copies of its own stream. That is cheap on the server and gives the lowest possible latency, but client upload bandwidth grows linearly with room size. Five is the point where that tradeoff still holds; beyond it, an SFU is the right answer.
- **In-memory state** — rooms and participants live in a single process, so the backend does not scale horizontally as-is. Redis or a similar shared store would be the next step.
- **One presenter at a time** — enforced on the server rather than the client, so the rule holds even under concurrent requests.
- **No authentication** — anyone with a room code can join.

---

## Roadmap

- Collaborative canvas for scribbling and diagramming during calls, over WebRTC data channels
- Text chat
