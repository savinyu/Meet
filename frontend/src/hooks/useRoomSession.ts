import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

type Participant = {
    id : number;
    name : string;
    audioEnabled : boolean;
    videoEnabled : boolean;
}

export default function useRoomSession(roomId : string = "", name : string, stream : MediaStream | null, audioEnabled : boolean, videoEnabled : boolean) {
    
    const [roomMembers, setRoomMembers] = useState<Participant[]>([]);
    const peerConnections = useRef(new Map<number, RTCPeerConnection>());
    const [remoteStreams, setRemoteStreams] = useState(new Map<number, MediaStream>);
    const navigate = useNavigate();
    const wsRef = useRef<WebSocket>(null);
    const userIdRef = useRef<number>(null);

    const hostname = window.location.hostname;
    const socketUrl = `ws://${hostname}:3000`;

    
    const user : Participant = {
        id : -1,
        name : name,
        audioEnabled : audioEnabled,
        videoEnabled : videoEnabled
    }
    
    useEffect(() => {
        if (!stream || roomId === "") return;

        const ws = new WebSocket(socketUrl);
        wsRef.current = ws;
        
        //function to create a peer connection
        function createPeerConnection(memberId : number) {
            const pc = new RTCPeerConnection({
                iceServers : [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            peerConnections.current.set(memberId, pc);
    
            //send ice candidates
            pc.onicecandidate = (event) => {
                ws.send(JSON.stringify({
                    type : 'iceCandidates',
                    iceCandidates : event.candidate,
                    from : user.id,
                    to : memberId
                }));
            } 
    
            //add tracks
            stream?.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (!remoteStream) return;

                setRemoteStreams((current) => {
                    const updated = new Map(current);
                    updated.set(memberId,remoteStream);
                    return updated;
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
                            videoEnabled : message.videoEnabled
                        }]
                    });
                    break;
                }
                case 'room-members' : {
                    //gets array of participants
                    setRoomMembers(message.participants);
                    message.participants.filter((member : Participant) => member.id !== user.id).forEach(async (member : Participant) => {

                        // start a RTCPeerConnection 
                        const pc = createPeerConnection(member.id);

                        //negotiation
                        pc.onnegotiationneeded = async () => {
                            const offer = await pc.createOffer();
                            pc.setLocalDescription(offer);
                            ws.send(JSON.stringify({
                                type : 'createOffer',
                                sdp : offer,
                                from : user.id,
                                to : member.id
                            }));
                        }
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
                                from : user.id,
                                to : message.from
                            }));
                        }

                        await pc.setRemoteDescription(message.sdp);
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        ws.send(JSON.stringify({
                            type : 'createAnswer',
                            sdp : answer,
                            from : user.id,
                            to : message.from
                        }));
                    }

                    respondToOffer();
                    break;
                }
                case 'createAnswer' : {
                    //answer received
                    async function respondToAnswer() {
                        const pc = peerConnections.current.get(message.from);
                        if (!pc) return;
                        await pc.setRemoteDescription(message.sdp);
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
                case 'participant-left' : {
                    //close the pc connection 
                    const pc = peerConnections.current.get(message.participantId);
                    pc?.close();
                    peerConnections.current.delete(message.participantId);

                    //remove the stale stream
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

    }, [roomId, stream]);

    return {
        roomMembers,
        remoteStreams,
        wsRef,
        userIdRef
    }
    
}