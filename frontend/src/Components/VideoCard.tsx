import { useRef, useEffect } from 'react'

type VideoCardProps = {
    stream : MediaStream | null,
    muted? : boolean
}
export default function VideoCard({stream, muted = false} : VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        async function playStream() {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }
        playStream();
        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    },[stream]);

    return (
        <>
            <div style={{}}>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted={muted} 
                    playsInline 
                    style={{borderRadius : 20, objectFit : 'cover', height : '100%', width : '100%'}}
                />
            </div>
        </>
    )
}