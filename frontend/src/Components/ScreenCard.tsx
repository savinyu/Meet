import { useRef, useEffect } from 'react'
type ScreenCardProps = {
    stream : MediaStream | null;
    muted : boolean;
}
export default function ScreenCard({stream, muted} : ScreenCardProps) {
    const screenVideoRef = useRef<HTMLVideoElement>(null);
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
    return (
        <div style={{
                height : '100%', 
                width : '100%',
                overflow : 'hidden',
                background : 'black',
                borderRadius : 16
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
        </div>
    )
}