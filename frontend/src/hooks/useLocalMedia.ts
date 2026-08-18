import { useEffect,useState } from 'react' 

export default function useLocalMedia() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    useEffect(() => {
        let cancelled = false;
        async function getStream() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({video : true, audio : true});
                if (cancelled) {
                    newStream?.getTracks().forEach((track) => track.stop());
                    return;
                }
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

    return stream;
}