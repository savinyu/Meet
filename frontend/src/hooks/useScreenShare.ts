import { useState, useRef, useEffect } from 'react'

export default function useScreenShare() {
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mounted = useRef(true);

    async function startScreenShare() {
        if (streamRef.current) return;
            try {
                const display = await navigator.mediaDevices.getDisplayMedia({
                    video : true,
                    audio : true
                });

                if (!mounted.current) {
                    display.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = display;
                setScreenStream(display);

                display.getVideoTracks()[0].onended = () => stopScreenShare();
            } catch(err) {
                console.log(err);
            }
    }
    function stopScreenShare() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
        streamRef.current = null;
    }
    function toggleScreenShare() {
        if (streamRef.current) stopScreenShare();
        else startScreenShare();
    }
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            stopScreenShare();
        }
    },[]);
    return {
        screenStream,
        startScreenShare,
        stopScreenShare,
        toggleScreenShare
    }
}