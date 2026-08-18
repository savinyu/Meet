import { useRef, useEffect } from 'react'
import useLocalMedia from '../hooks/useLocalMedia'

export default function MyVideoCard() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const stream = useLocalMedia();
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        } 
        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [stream]);

    return (
        <>
            <video ref={videoRef} autoPlay muted playsInline style={{borderRadius : 20}}/>
        </>
    )
}