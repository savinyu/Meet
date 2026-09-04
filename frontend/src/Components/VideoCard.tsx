import { useRef, useEffect } from 'react'

type VideoCardProps = {
    cameraStream : MediaStream | null;
    videoEnabled : boolean;
    name : string;
    muted? : boolean;
    local? : boolean;
}
export default function VideoCard({cameraStream, videoEnabled, name, muted = false, local = false} : VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
      const videoEle = videoRef.current;
      if (videoEle) {
          videoEle.srcObject = cameraStream;
      }
      return () => {
          if (videoEle) {
            videoEle.srcObject = null;
          }
      }
    },[cameraStream, videoEnabled]);

    return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#1a1a1a',
          }}
        >
          {videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted={muted}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform : local ? 'scaleX(-1)' : 'none'
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                background: '#1a1a1a',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  color: 'white',
                  backgroundColor: '#3c4043',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 28,
                  textTransform: 'uppercase',
                }}
              >
                {name?.charAt(0) || '?'}
              </div>
            </div>
          )}
      
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              background: 'rgba(0,0,0,0.55)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            {name || 'You'}
          </div>
        </div>
      )
}