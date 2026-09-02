import { useRef, useEffect } from 'react'
type ScreenCardProps = {
    stream : MediaStream | null;
}
export default function ScreenCard({stream} : ScreenCardProps) {
    const screenStreamRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.srcObject = stream;
        }
        return () => {
            if (screenStreamRef.current) {
                screenStreamRef.current.srcObject = null;
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
                muted
                ref={screenStreamRef}
                autoPlay
                playsInline
            />
        </div>
    )
}