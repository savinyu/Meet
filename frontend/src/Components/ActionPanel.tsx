import Mic from '../assets/unmuted.svg?react';
import MicDisabled from '../assets/muted.svg?react';
import Phone from '../assets/phone-call.svg?react'
import Camera from '../assets/camera.svg?react'
import CameraDisabled from '../assets/camera-disabled.svg?react'
import ScreenShare from '../assets/screen_share.svg?react'

interface ActionPanelProps {
    showPhone? : boolean;
    showScreen? : boolean;
    audioEnabled : boolean;
    videoEnabled : boolean;
    onToggleAudio : () => void;
    onToggleVideo : () => void;
    onToggleScreenShare? : () => void;
    onHangUp? : () => void;
}

export default function ActionPanel({
    showPhone = false,
    showScreen = false,
    audioEnabled,    
    videoEnabled,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onHangUp
} : ActionPanelProps) {

    return (
        <div 
            style={{
                position: 'fixed',
                zIndex: 10,
                bottom: 'max(1rem, env(safe-area-inset-bottom))',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                background: 'rgba(64, 64, 64, 0.75)',
                padding: '0.6rem 1.2rem',
                borderRadius: '100vmax',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: 'calc(100vw - 2rem)',
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
                >{audioEnabled ? <Mic width='100%' height='100%'/> : <MicDisabled width='100%' height='100%'/>}
                </button>
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
                {showScreen && <button 
                    style={{
                        height : '50px',
                        width : '50px',
                        padding : 0,
                        borderRadius : '50%',
                        background : 'lightgray'
                    }}
                    onClick={onToggleScreenShare}
                >
                    <ScreenShare/>
                </button>}
                {showPhone && <button 
                    style={{
                        height : '50px',
                        width : '50px',
                        padding : 0,
                        borderRadius : '50%'    
                    }}
                    onClick={onHangUp}
                >
                    <Phone width='100%' height='100%'/>
                </button>}
            </div>
    )
}