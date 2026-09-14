import { useRef, useEffect, useState } from 'react'
import FullScreen from '../assets/full-screen.svg?react'
import SmallScreen from '../assets/small-screen.svg?react'

type ScreenCardProps = {
    stream : MediaStream | null;
    muted : boolean;
}
export default function ScreenCard({stream, muted} : ScreenCardProps) {
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    useEffect(() => {
        const screenVideoEle = screenVideoRef.current;
        if (screenVideoEle) {
            screenVideoEle.srcObject = stream;
        }
        return () => {
            if (screenVideoEle) {
                screenVideoEle.srcObject = null;
            }
        }
    },[stream]);
    useEffect(() => {
        function handleFullScreenChange() {
            setIsFullScreen( document.fullscreenElement === containerRef.current);
        }
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        }
    }, []);
    const toggleFullScreen = async (e? : React.MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await container.requestFullscreen();
            }
        } catch(err) {
            console.log(err);
        }
    }
    return (
        <div
            className='screen-card'
            onDoubleClick={toggleFullScreen}
            ref={containerRef} 
            style={{
                height : '100%', 
                width : '100%',
                overflow : 'hidden',
                background : 'black',
                borderRadius : 16,
                position : 'relative'
            }}>
            <video
                style={{
                    height : '100%',
                    width : '100%',
                    objectFit : 'contain',
                    display : 'block'
                }}
                muted={muted}
                ref={screenVideoRef}
                autoPlay
                playsInline
            />
            <button
                className="screen-card__fullscreen"
                onClick={toggleFullScreen}
                onDoubleClick={(e) => e.stopPropagation()} 
                aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
                title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            >
                {isFullScreen
                    ? <SmallScreen width={20} height={20}/>
                    : <FullScreen width={20} height={20}/>}
            </button>
        </div>
    )
}