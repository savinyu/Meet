import { useRef, useEffect } from 'react'

type VideoCardProps = {
    stream : MediaStream | null,
    videoEnabled : boolean,
    name : string
    muted? : boolean
}
export default function VideoCard({stream, videoEnabled, name, muted = false} : VideoCardProps) {
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
    },[stream, videoEnabled]);

    return (
        <>
                {videoEnabled ? 
                    <div>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted={muted} 
                            playsInline 
                            style={{
                                borderRadius : 20,
                                objectFit : 'cover',
                                height : '100%',
                                width : '100%'}}
                        />
                    </div>
                        : (
                        <div style={{
                            display : 'flex',
                            justifyContent : 'center',
                            alignItems :'center',
                            width : '100%',
                            height : '100%',
                            top : '50%',
                            background : 'black',
                            borderRadius : 20,

                        }}>
                            <div style={{
                                width : 60,
                                height : 60,
                                borderRadius : '50%',
                                color : 'white',
                                backgroundColor : 'dimgray',
                                display : 'flex',
                                alignItems : 'center',
                                justifyContent : 'center',
                                fontWeight : 'bold',
                                fontSize : '32px',
                                textTransform : 'uppercase'
                            }}
                            >
                                {name?.charAt(0)}
                            </div>
                        </div>
                        )
                }
        </>
    )
}