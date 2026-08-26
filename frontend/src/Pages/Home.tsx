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
    const [code, setCode] = useState("");
    const [name, setName] = useState("");

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    function setValidateName(name : string) {
        const trimmedName = name.trim();
        setName(trimmedName);
        if (trimmedName === "") {
            alert("Invalid Name");
            return false;
        }
        localStorage.setItem('name', trimmedName);
        return true;
    }

    async function createRoom() {
        if (!setValidateName(name)) return;
        const response = await axios.post(apiUrl+"/room");
        const message = response.data;

        if (message.type !==  'error') {
            let roomId = message.roomId;
            navigate(`/room/${roomId}`);
        }
    }

    function joinRoom() {
        if (!setValidateName(name)) return;
        if (code !== "") {
            navigate(`/room/${code}`);
        }
    }

    return (
        <>
            <div>
            <div style={{display : 'flex', justifyContent : 'center', marginTop : '4rem'}}>
                <UsernameInput value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{display : 'flex', justifyContent : 'space-around', marginTop : 30}}>
                <button className='button'
                    onClick={createRoom}>Create a new Room</button>
                <div>
                    <button className='button'
                        onClick={joinRoom}>Join a Room</button>
                    <input style={{marginLeft : 20, textAlign : 'center', height : '80%'}} type='text' value={code} placeholder="Room Code" onChange={(e) => {
                        setCode(e.target.value);
                    }}/>
                </div>
            </div>
            <div style={{
                width : '100%',
                display : 'flex',
                justifyContent : 'center'
            }}>
                <div style={{
                        marginTop : 50,
                        height : '40rem',
                        width : '40rem'
                    }}>
                    <VideoCard stream={stream} name={name} muted videoEnabled={videoEnabled} />
                </div>
            </div>
            <ActionPanel 
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                />
            </div>
        </>
    )
}
