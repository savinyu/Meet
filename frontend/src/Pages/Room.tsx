import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useRoomSession from '../hooks/useRoomSession'
import useLocalMedia from '../hooks/useLocalMedia'
import VideoCard from '../Components/VideoCard';
import ActionPanel from '../Components/ActionPanel';


export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const {stream, toggleAudio, toggleVideo, audioEnabled, videoEnabled} = useLocalMedia();
    const name = localStorage.getItem('name') ?? "";
    const {roomMembers, remoteStreams, wsRef, userIdRef} = useRoomSession(roomId, name, stream, audioEnabled, videoEnabled);

    useEffect(() => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type : 'toggleMedia',
                from : userIdRef.current,
                audioEnabled : audioEnabled,
                videoEnabled : videoEnabled
            }));
        }
    }, [audioEnabled, videoEnabled]);
    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }
    }, [roomId, navigate]);

    if (!roomId) {
        return <p>Redirecting</p>
    }

    const [copied, setCopied] = useState<boolean>(false);
    const copiedTimer = useRef<number | null>(null);

    async function copyToClipboard() {
        if (!roomId) return;

        await navigator.clipboard.writeText(roomId);
        setCopied(true);

        if (copiedTimer.current !== null) {
            window.clearTimeout(copiedTimer.current);
        }

        copiedTimer.current = window.setTimeout(() => {
            setCopied(false);
            copiedTimer.current = null;
        }, 3000);
    }

    useEffect(() => {
        return () => {
            if (copiedTimer.current !== null) {
                window.clearTimeout(copiedTimer.current);
            }
        }
    }, []);



    
    return (
        <div className="room-page">
            <h3 className="room-title">
                Room Page
            </h3>
            <div className="room-pip"> 
                <VideoCard 
                    stream={stream} 
                    muted={true} 
                    videoEnabled={videoEnabled} 
                    name={name} 
                /> 
            </div>
            <div className="room-grid">
                {roomMembers.map((member) => {
                    const remoteStream = remoteStreams.get(member.id);

                    return (
                        <div
                            key={member.id}
                            className="room-tile"
                        >
                            {remoteStream ? (
                            <VideoCard 
                                stream={remoteStream} 
                                videoEnabled={member.videoEnabled} 
                                name={member.name}
                            />
                            ) : (
                            /* Avatar Fallback for Remote Participant */
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    backgroundColor: '#3c4043',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    userSelect: 'none',
                                }}
                            >
                                {member.name?.charAt(0)}
                            </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className='room-copy'>
                <span>Room Id: {roomId}</span>
                <button onClick={copyToClipboard}>
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <ActionPanel 
                showPhone 
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                onHangUp={() => navigate('/')}
                />
        </div>
    )
}