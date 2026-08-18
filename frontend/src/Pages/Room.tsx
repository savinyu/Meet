import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useRoomSession from '../hooks/useRoomSession'
import useLocalMedia from '../hooks/useLocalMedia'
import VideoCard from '../Components/VideoCard';


export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const stream = useLocalMedia();
    const name = localStorage.getItem('name') ?? "";
    const {roomMembers, remoteStreams} = useRoomSession(roomId, name, stream);

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
        <>
        <h3> This is the Room Page</h3>
        <div style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 240,           // Reduced from large fixed height
            height: 180,          // Smaller compact footprint
            borderRadius: 12,
            display : 'flex',
            alignItems : 'center',
            justifyContent : 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            border: '2px solid rgba(255, 255, 255, 0.2)',
        }}> 
            {stream ? (
                <VideoCard stream={stream} muted={true}/> 
                ): ( 
                    <div style={{
                        width : 60,
                        height : 60,
                        borderRadius : '50%',
                        color : 'white',
                        backgroundColor : 'dimgray',
                        display : 'flex',
                        alignItems : 'center',
                        justifyContent : 'center',
                        fontWeight : 'bold',
                        fontSize : '32px',
                        textTransform : 'uppercase'
                        }}
                    >
                        {name?.charAt(0)}
                    </div>
                )}
        </div>
        <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '12px',
            padding: '0 16px 16px 16px',
            height: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
        }}
        >
        {roomMembers.map((member) => {
            const remoteStream = remoteStreams.get(member.id);

            return (
            <div
                key={member.id}
                style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: '#1e1e1e',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                }}
            >
                {remoteStream ? (
                <VideoCard stream={remoteStream} />
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

                {/* Participant Name Badge */}
                <div
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    zIndex: 2,
                }}
                >
                {member.name}
                </div>
            </div>
            );
        })}
        </div>

        <div style={{display :'flex', position : 'absolute', bottom : 10, left : 10, background : 'white', padding : "2px 10px", color : 'black', borderRadius : "5px", alignItems : 'center', fontSize : '12px'}}>
            Room Id: {roomId}
            <button onClick={copyToClipboard} style={{marginLeft : 20}}>{copied ? "Copied" : "Copy"}</button>
        </div>
        </>
    )
}