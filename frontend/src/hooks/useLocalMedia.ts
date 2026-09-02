import { useEffect, useState, useRef } from 'react' 

export default function useLocalMedia() {
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    function toggleAudio() {
        const next = !audioEnabled;
        if (streamRef.current) {    
            streamRef.current.getAudioTracks().forEach((track) => track.enabled = next);
        }
        setAudioEnabled(next);
    }

    function toggleVideo() {
        const next = !videoEnabled;
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach((track) => track.enabled = next);
        }
        setVideoEnabled(next);
    }

    const [audioEnabled, setAudioEnabled] = useState(JSON.parse(localStorage.getItem('audio') ?? 'true'));
    const [videoEnabled, setVideoEnabled] = useState(JSON.parse(localStorage.getItem('video') ?? 'true'));

    useEffect(() => {
        localStorage.setItem('audio', JSON.stringify(audioEnabled));
        localStorage.setItem('video', JSON.stringify(videoEnabled));
    }, [audioEnabled, videoEnabled]);
    
    useEffect(() => {
        let cancelled = false;
        async function getStream() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({video : true, audio : true});
                if (cancelled) {
                    newStream.getTracks().forEach((track) => track.stop());
                    return;
                }
                newStream.getAudioTracks().forEach((track) => track.enabled = audioEnabled);
                newStream.getVideoTracks().forEach((track) => track.enabled = videoEnabled);
                setCameraStream(newStream);
                streamRef.current = newStream;
            } catch {
                
            }
        }
        getStream();
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setCameraStream(null);
        }
    }, []);

    return {
        cameraStream,
        toggleAudio,
        toggleVideo,
        audioEnabled,
        videoEnabled
    };
}