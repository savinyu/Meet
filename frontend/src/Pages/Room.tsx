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

            <div
                onClick={copyToClipboard}
                style={{
                    position: 'fixed',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'rgba(30, 30, 30, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 13,
                    zIndex: 20,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.15)',
                    maxWidth: 'calc(100vw - 24px)',
                }}
                >
                <span style={{ opacity: 0.7 }}>Room code</span>
                <code style={{ fontFamily: 'monospace', letterSpacing: '0.08em', fontWeight: 600 }}>
                    {roomId}
                </code>
                <span style={{ fontSize: 12, color: copied ? '#4ade80' : '#c084fc' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                </span>
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