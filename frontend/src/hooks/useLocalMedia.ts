import { useEffect, useState, useRef , useCallback } from 'react' 

export default function useLocalMedia(releaseWhenHidden = false) {
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const generation = useRef<number>(0);
    const pendingRef = useRef<boolean>(false);

    const release = useCallback(() => {
        generation.current++;
        if (!streamRef.current) return;
        streamRef.current.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        streamRef.current = null;
    }, []);

    const acquire = useCallback(async () => {
        if (streamRef.current || pendingRef.current) return;
        pendingRef.current = true;
        try {
            const thisGen = ++generation.current;
            const newStream = await navigator.mediaDevices.getUserMedia({ video : true, audio : true});
            if (thisGen !== generation.current) {
                newStream.getTracks().forEach((track) => track.stop());
                return;
            }
            const videoPref = JSON.parse(localStorage.getItem('video') ?? 'true');
            const audioPref = JSON.parse(localStorage.getItem('audio') ?? 'true');
            newStream.getVideoTracks().forEach((track) => track.enabled = videoPref);
            newStream.getAudioTracks().forEach((track) => track.enabled = audioPref);
            streamRef.current = newStream;
            setCameraStream(newStream);
        } catch(err) {
            console.log(err);
        } finally {
            pendingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!releaseWhenHidden) return;
        function onVisibility() {
            if (document.visibilityState === 'hidden') release();
            else acquire();
        }
        function onPageShow(e : PageTransitionEvent) {
            if (e.persisted) acquire();
        } 
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', release);
        window.addEventListener('pageshow', onPageShow);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', release);
            window.removeEventListener('pageshow', onPageShow);
            release();
        }
    }, [releaseWhenHidden, release, acquire]);
    
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- unavoidable: getUserMedia is inherently async
        acquire();
        return () => release();
    }, [acquire, release]);

    const [audioEnabled, setAudioEnabled] = useState(JSON.parse(localStorage.getItem('audio') ?? 'true'));
    const [videoEnabled, setVideoEnabled] = useState(JSON.parse(localStorage.getItem('video') ?? 'true'));

    useEffect(() => {
        localStorage.setItem('audio', JSON.stringify(audioEnabled));
        localStorage.setItem('video', JSON.stringify(videoEnabled));
    }, [audioEnabled, videoEnabled]);    
    
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

    return {
        cameraStream,
        toggleAudio,
        toggleVideo,
        audioEnabled,
        videoEnabled
    };
}