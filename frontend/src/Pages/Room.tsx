import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import useRoomSession from '../hooks/useRoomSession'
import useScreenShare from '../hooks/useScreenShare'
import useLocalMedia from '../hooks/useLocalMedia'
import VideoCard from '../Components/VideoCard';
import ActionPanel from '../Components/ActionPanel';
import ScreenCard from '../Components/ScreenCard'
import Alert from '../Components/Alert'


export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const {cameraStream, toggleAudio, toggleVideo, audioEnabled, videoEnabled} = useLocalMedia();
    const { screenStream, stopScreenShare, toggleScreenShare } = useScreenShare();

    const name = sessionStorage.getItem('displayName') || localStorage.getItem('name') || 'Anonymous';

    const {roomMembers, remoteStreams, sessionAlert, clearSessionAlert} = useRoomSession(roomId, name, cameraStream, audioEnabled, videoEnabled, screenStream, stopScreenShare);
    
    const [copied, setCopied] = useState<boolean>(false);
    const copiedTimer = useRef<number | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const message = alertMessage ?? sessionAlert;

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }
    }, [roomId, navigate]);
    
    useEffect(() => {
        return () => {
            if (copiedTimer.current !== null) {
                window.clearTimeout(copiedTimer.current);
            }
        }
    }, []);
    
    if (!roomId) {
        return <p>Redirecting</p>
    }
    
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

    function handleToggleScreenShare() {
        if (someoneIsSharingScreen) {
            setAlertMessage("Someone is already sharing");
            return;
        }
        toggleScreenShare();
    }
    
    async function copyOrShare() {
        copyToClipboard();
        if (navigator.share) {
            try {
                navigator.share({title : 'Join my room :', text : roomId});
                return;
            } catch(err) {
                console.log(err);
            }
        }
    }

    const cols = roomMembers.length <= 1 ? 1 : 2;
    const sharerId = roomMembers.find((member) => member.sharingScreen)?.id;
    const remoteScreen = sharerId ? remoteStreams.get(sharerId)?.screen ?? null : null;
    const stageStream = screenStream ?? remoteScreen;
    const isPresenting = !!(stageStream);
    const someoneIsSharingScreen = sharerId != null;

    return (
        <div className={`room-page ${isPresenting ? 'room-page--presenting' : ''}`}>
            <div className="room-pip"> 
                <VideoCard 
                    cameraStream={cameraStream} 
                    muted={true} 
                    videoEnabled={videoEnabled} 
                    name={name}
                    local 
                /> 
            </div>
            <div className="room-grid" style={{'--cols' : cols} as React.CSSProperties}>
                {roomMembers.map((member) => {
                    const remoteStream = remoteStreams.get(member.id)?.camera;

                    return (
                        <div
                            key={member.id}
                            className="room-tile"
                        >
                            {remoteStream ? (
                            <VideoCard 
                                cameraStream={remoteStream} 
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
                {stageStream && (
                    <div className='room-stage '>
                        <ScreenCard stream={stageStream}/>
                    </div>
                )}
            <div className="room-share" onClick={copyOrShare}>
                <span className="room-share__label">Room code</span>
                <code className="room-share__code">{roomId}</code>
                <span className="room-share__action">
                    {copied ? '✓ Copied' : 'Copy'}
                </span>
            </div>
            {message && (
                <Alert
                    message={message}
                    handleClick={() => {
                        clearSessionAlert();
                        setAlertMessage(null);
                    }}
                />
            )}
            <ActionPanel 
                showPhone 
                showScreen
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={handleToggleScreenShare}
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                onHangUp={() => {
                    stopScreenShare();
                    navigate('/')
                }}
                />
        </div>
    )
}