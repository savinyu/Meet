import { useEffect,useState } from 'react' 

export default function useLocalMedia() {
    const [stream, setStream] = useState<MediaStream | null>(null);

    function toggleAudio() {
        const next = !audioEnabled;
        stream?.getAudioTracks().forEach((track) => track.enabled = next);
        setAudioEnabled(next);
    }

    function toggleVideo() {
        const next = !videoEnabled;
        stream?.getVideoTracks().forEach((track) => track.enabled = next);
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
                    newStream?.getTracks().forEach((track) => track.stop());
                    return;
                }
                newStream.getAudioTracks().forEach((track) => track.enabled = audioEnabled);
                newStream.getVideoTracks().forEach((track) => track.enabled = videoEnabled);
                setStream(newStream);
            } catch {
                
            }
        }
        getStream();
        return () => {
            cancelled = true;
            setStream((cur_stream) => {
                cur_stream?.getTracks().forEach((track) => track.stop());
                return null;
            });
        }
    }, []);

    return {
        stream,
        toggleAudio,
        toggleVideo,
        audioEnabled,
        videoEnabled
    };
}