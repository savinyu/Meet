import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

type Participant = {
    id : number;
    name : string;
    audioEnabled : boolean;
    videoEnabled : boolean;
    sharingScreen : boolean;
    displayStreamId : string | null;
}
type RemoteMedia = {
    camera : MediaStream | null;
    screen : MediaStream | null;
}

export default function useRoomSession(roomId : string = "", name : string, cameraStream : MediaStream | null, audioEnabled : boolean, videoEnabled : boolean, screenStream : MediaStream | null, stopScreenShare : () => void) {
    
    const [roomMembers, setRoomMembers] = useState<Participant[]>([]);
    const peerConnections = useRef(new Map<number, RTCPeerConnection>());
    const [remoteStreams, setRemoteStreams] = useState(new Map<number, RemoteMedia>);
    const navigate = useNavigate();
    const wsRef = useRef<WebSocket>(null);
    const userIdRef = useRef<number>(null);
    const displayStreamIdRef = useRef<string | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const socketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

    
    const user : Participant = {
        id : -1,
        name : name,
        audioEnabled : audioEnabled,
        videoEnabled : !!cameraStream && videoEnabled,
        sharingScreen : false,
        displayStreamId : null
    }

    useEffect(() => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type : 'toggleMedia',
                from : userIdRef.current,
                audioEnabled : audioEnabled,
                videoEnabled : videoEnabled
            }));
        }
    }, [audioEnabled, videoEnabled]);

    useEffect(() => {
        screenStreamRef.current = screenStream;
    }, [screenStream]);

    useEffect(() => {
        if (!screenStream) return;
        
        const existingSharer = roomMembers.find((member) => member.sharingScreen);
        if (existingSharer) {
            stopScreenShare();
            return;
        }

        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type : 'shareScreen',
                displayStreamId : screenStream?.id,
                from : userIdRef.current
            }));
        }
        return () => {
            peerConnections.current.forEach((pc) => {
                pc.getSenders().forEach((sender) => {
                    if (sender.track && screenStream.getTracks().includes(sender.track)) {
                        pc.removeTrack(sender);
                    }
                });
            })
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type : 'stopScreenShare',
                    from : userIdRef.current
                }));
            }
        }
    }, [screenStream]);

    useEffect(() => {
        if (roomId === "") return;

        const ws = new WebSocket(socketUrl);
        wsRef.current = ws;
        
        //function to create a peer connection
        function createPeerConnection(memberId : number) {
            const pc = new RTCPeerConnection({
                iceServers : [
                    //Google STUN Servers
                    { urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302'
                    ]},
                    //Express TURN Server
                    {
                        urls : import.meta.env.VITE_EXPRESSTURN_URL,
                        username : import.meta.env.VITE_EXPRESSTURN_USER,
                        credential : import.meta.env.VITE_EXPRESSTURN_PASS
                    },
                    //METERED TURN SERVER
                    {
                        urls : [
                            import.meta.env.VITE_METERED_URL1,
                            import.meta.env.VITE_METERED_URL2,
                            import.meta.env.VITE_METERED_URL3,
                            import.meta.env.VITE_METERED_URL4,

                        ],
                        username : import.meta.env.VITE_METERED_USER,
                        credential : import.meta.env.VITE_METERED_PASS
                    }
                ]
            });
            peerConnections.current.set(memberId, pc);
    
            //send ice candidates
            pc.onicecandidate = (event) => {
                ws.send(JSON.stringify({
                    type : 'iceCandidates',
                    iceCandidates : event.candidate,
                    from : userIdRef.current,
                    to : memberId
                }));
            } 

            //add tracks
            cameraStream?.getTracks().forEach((track) => {
                pc.addTrack(track, cameraStream);
            });

            //if  Display Stream exists add track
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => {
                    pc.addTrack(track, screenStreamRef.current!);
                });
            }

            //negotiation
            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    ws.send(JSON.stringify({
                        type : 'createOffer',
                        sdp : offer,
                        from : userIdRef.current,
                        to : memberId
                    }));
                } catch {}
            }

            pc.ontrack = (event) => {
                const incoming = event.streams[0];
                if (!incoming) return;

                setRemoteStreams((current) => {
                    const next = new Map(current);
                    const existing = next.get(memberId) ?? {camera : null, screen : null};
                    if (incoming.id === displayStreamIdRef.current) {
                        next.set(memberId, {...existing, screen : incoming});
                    } else {
                        next.set(memberId, {...existing, camera : incoming});
                    }
                    return next;
                });
            }
    
            return pc;
        }

        ws.onerror = (err) => {
            console.log(err);
            alert("WebSocket connection failed. Please reload the page.");
        }

        //when websocket connection opens
        ws.onopen = () => {
            ws.send(JSON.stringify({
                type : "name",
                name : name
            }));
            ws.send(JSON.stringify({
                type : 'joinRoom',
                roomId : roomId,
                audioEnabled : user.audioEnabled,
                videoEnabled : user.videoEnabled
            }));
        }

        ws.onmessage = (response) => {

            const message = JSON.parse(response.data);
            
            switch (message.type) {
                case 'error' : {
                    alert(message.code)
                    if (message.code === 'room-not-found' || message.code === 'room-full') {
                        navigate('/');
                    }
                    break;
                }
                case 'id' : {
                    //gets back one's userId
                    user.id = message.id;
                    userIdRef.current = user.id;
                    break;
                }
                case 'participant-added' : {
                    //tells all the room member that a participant joined 
                    setRoomMembers((current) => {
                        return [...current, {
                            id : message.participantId,
                            name : message.name,
                            audioEnabled : message.audioEnabled,
                            videoEnabled : message.videoEnabled,
                            sharingScreen : false,
                            displayStreamId : null
                        }]
                    });
                    break;
                }
                case 'room-members' : {
                    //gets array of participants
                    setRoomMembers(message.participants);
                    if (message.displayStreamId) {
                        displayStreamIdRef.current = message.displayStreamId;
                    }
                    message.participants.forEach(async (member : Participant) => {
                        // start a RTCPeerConnection 
                        createPeerConnection(member.id);
                    });
                    break;
                }
                case 'createOffer' : {

                    //offer received 
                    async function respondToOffer() {
                        let pc = peerConnections.current.get(message.from);
                        if (!pc) {
                            pc = createPeerConnection(message.from);
                        }

                        //send ice candidates (event lsitener)
                        pc.onicecandidate = (event) => {
                            ws.send(JSON.stringify({
                                type : 'iceCandidates',
                                iceCandidates : event.candidate,
                                from : userIdRef.current,
                                to : message.from
                            }));
                        }

                        try {
                            await pc.setRemoteDescription(message.sdp);
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);

                            ws.send(JSON.stringify({
                                type : 'createAnswer',
                                sdp : answer,
                                from : userIdRef.current,
                                to : message.from
                            }));
                        } catch {}
                    }

                    respondToOffer();
                    break;
                }
                case 'createAnswer' : {
                    //answer received
                    async function respondToAnswer() {
                        const pc = peerConnections.current.get(message.from);
                        if (!pc) return;
                        try {
                            await pc.setRemoteDescription(message.sdp);
                        } catch {}
                    }
                    respondToAnswer();
                    break;
                }
                case 'iceCandidates' : {
                    //ice candidates
                    async function addIceCandidates() {
                        const pc = peerConnections.current.get(message.from);
                        if (!pc) return;
                        await pc.addIceCandidate(message.iceCandidates);
                    }
                    addIceCandidates();
                    break;
                }
                case 'toggleMedia' : {
                    setRoomMembers((current) => 
                        current.map((member) => 
                        member.id === message.from ? {
                            ...member,
                            audioEnabled : message.audioEnabled,
                            videoEnabled : message.videoEnabled
                        } : 
                        member
                    ));
                    break;
                }
                case 'displayStreamId' : {
                    displayStreamIdRef.current = message.displayStreamId;
                    setRoomMembers((current) => 
                        current.map((member) => member.id === message.from ? {
                            ...member,
                            sharingScreen : true,
                            displayStreamId : message.displayStreamId
                            } :
                            member    
                        )
                    )
                    break;
                }
                case 'screenShareStopped' : {
                    displayStreamIdRef.current = null;
                    setRemoteStreams((current) => {
                        const updated = new Map(current);
                        const existing = updated.get(message.from);
                        if (existing) {
                            updated.set(message.from, {...existing, screen : null});
                        }
                        return updated;
                    });
                    setRoomMembers((current) => 
                        current.map((member) => member.id === message.from ? {
                            ...member, 
                            sharingScreen : false, 
                            displayStreamId : null
                            } : 
                            member
                        )
                    );
                    break;
                }
                case 'participant-left' : {
                    //close the pc connection 
                    const pc = peerConnections.current.get(message.participantId);
                    pc?.close();
                    peerConnections.current.delete(message.participantId);

                    //remove the stale cameraStream
                    setRemoteStreams((current) => {
                        let updated = new Map(current);
                        updated.delete(message.participantId);
                        return updated;
                    });

                    //update the room members
                    setRoomMembers((current) => 
                       current.filter((member) => member.id !== message.participantId)
                    );
                    break;
                }
                default :
                    //nothing
            }
        }

        return () => {
            //clear the ws
            ws.onerror = null;
            ws.onopen = null;
            ws.onmessage = null;
            ws.onclose = null;

            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }

            //clear the pc connections
            peerConnections.current.forEach((connection) => {
                connection.onicecandidate = null;
                connection.ontrack = null;
                connection.onnegotiationneeded = null;
                connection.close();
            });
            peerConnections.current.clear();
        }

    }, [roomId, cameraStream]);

    useEffect(() => {
        if (!screenStream) return;

        peerConnections.current.forEach((pc) => {
            screenStream.getTracks().forEach((track) => {
                pc.addTrack(track, screenStream);
            })
        });
    }, [screenStream]);

    return {
        roomMembers,
        remoteStreams
    }
    
}