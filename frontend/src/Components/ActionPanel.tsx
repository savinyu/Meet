import Mic from '../assets/unmuted.svg?react';
import MicDisabled from '../assets/muted.svg?react';
import Phone from '../assets/phone-call.svg?react'
import Camera from '../assets/camera.svg?react'
import CameraDisabled from '../assets/camera-disabled.svg?react'

interface ActionPanelProps {
    showPhone? : boolean;
    audioEnabled : boolean;
    videoEnabled : boolean;
    onToggleAudio : () => void;
    onToggleVideo : () => void;
    onHangUp? : () => void;
}

export default function ActionPanel({
    showPhone = false,
    audioEnabled,    
    videoEnabled,
    onToggleAudio,
    onToggleVideo,
    onHangUp
} : ActionPanelProps) {

    return (
        <div style={{
            position : 'absolute',
            zIndex : 10,
            bottom : '2%',
            left : '39%',
            color : 'white',
            background : 'rgb(64, 64, 64, 0.6)',
            padding : '0.5rem',
            borderRadius : '50%',
            filter: 'drop-shadow(4px 4px 8px rgb(22, 149, 109))',
            minWidth : '30rem',
            display : 'flex',
            justifyContent : 'space-evenly'
            }}>
                <button 
                    style={{
                        height : '50px',
                        width : '50px',
                        borderRadius : '50%',
                        background : 'lightgray',
                        padding : '0.5rem'
                    }}
                    onClick={onToggleAudio}
                >{audioEnabled ? <Mic width='100%' height='100%'/> : <MicDisabled width='100%' height='100%'/>}</button>
                <button 
                    style={{
                        height : '50px',
                        width : '50px',
                        borderRadius : '50%',
                        background : 'lightgray',
                        padding : '0.5rem'
                    }}
                    onClick={onToggleVideo}
                >{videoEnabled ? <Camera width='100%' height='100%'/> : <CameraDisabled width='100%' height='100%'/>}</button>
                {showPhone && <button 
                    style={{
                        height : '50px',
                        width : '50px',
                        padding : 0,
                        borderRadius : '50%'    
                    }}
                    onClick={onHangUp}
                ><Phone width='100%' height='100%'/></button>}
            </div>
    )
}