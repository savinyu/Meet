import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoCard from '../Components/VideoCard';
import ActionPanel from '../Components/ActionPanel';
import useLocalMedia from '../hooks/useLocalMedia'
import UsernameInput from '../Components/UsernameInput'

export default function Home() {
    const navigate = useNavigate();
    const {stream, toggleAudio, toggleVideo, audioEnabled, videoEnabled} = useLocalMedia();
    const [code, setCode] = useState('');
    const [name, setName] = useState(localStorage.getItem('name') ?? "");

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    function resolveName(raw : string) {
        let trimmedName = raw.trim();
        if (trimmedName.length > 15) {
            trimmedName = trimmedName.slice(0, 15);
        }
        if (trimmedName === '') {
            sessionStorage.setItem('displayName', 'Anonymous');
            localStorage.removeItem('name');
        } else {
            setName(trimmedName);
            sessionStorage.setItem('displayName', trimmedName);
            localStorage.setItem('name', trimmedName);
        }
    }

    async function createRoom() {
        resolveName(name);
        const response = await axios.post(apiUrl+"/room");
        const message = response.data;

        if (message.type !==  'error') {
            let roomId = message.roomId;
            navigate(`/room/${roomId}`);
        }
    }

    function joinRoom() {
        resolveName(name);
        if (code !== '') {
            navigate(`/room/${code}`);
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.5rem 1rem 6rem',
                minHeight: '100svh',
                boxSizing: 'border-box',
            }}
        >
            <UsernameInput 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
            />
    
            <div
                className='home-actions'
            >
                <button 
                    className="button" 
                    onClick={createRoom}
                >
                    Create a new Room
                </button>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <button 
                        className="button" 
                        onClick={joinRoom}
                    >
                        Join a Room
                    </button>
                    <input
                        style={{ 
                            textAlign: 'center', 
                            padding: '8px 12px', 
                            minWidth: 140 
                        }}
                        type='text'
                        value={code}
                        placeholder='Room Code'
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
            </div>
            <div
                style={{
                    width: 'min(100%, 40rem)',
                    aspectRatio: '16 / 10',
                    maxHeight: 'min(55svh, 40rem)',
                }}
            >
                <VideoCard 
                    stream={stream} 
                    name={name} 
                    muted 
                    videoEnabled={videoEnabled} 
                />
            </div>
    
            <ActionPanel
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
            />
        </div>
    )
}
