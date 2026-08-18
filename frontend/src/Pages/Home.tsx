import axios from 'axios'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MyVideoCard from '../Components/MyVideoCard';

export default function Home() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [audio, setAudio] = useState(true);

    useEffect(() => {
        localStorage.setItem('audio', JSON.stringify(audio));
    }, [audio]);

    const host = window.location.hostname;
    const apiUrl = `http://${host}:3000`;
    
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
            <h3> This is the Home Page</h3>
            <div>
                Please enter your name : 
                <input style={{width : '100px', marginLeft : 20, textAlign : 'center'}} type='text' value={name} placeholder="Your Name" onChange={(e) => {
                    setName(e.target.value);
                }}/>
            </div>
            <div style={{display : 'flex', justifyContent : 'space-around', marginTop : 30}}>
                <button onClick={createRoom}>Create a new Room</button>
                <div>
                    <button onClick={joinRoom}>Join a Room</button>
                    <input style={{marginLeft : 20, textAlign : 'center'}} type='text' value={code} placeholder="Room Code" onChange={(e) => {
                        setCode(e.target.value);
                    }}/>
                </div>
            </div>
            <div style={{marginTop : 50}}>
                <MyVideoCard/>
            </div>
            <div>
                <button onClick={() => setAudio(!audio)} style={{width : "10%", justifyItems : 'center'}}>{audio ? 'Mute' : 'Unmute'}</button>
            </div>
        </>
    )
}
