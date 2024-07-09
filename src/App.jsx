import React, { useEffect, useRef, useState } from "react";
import {
  LiveConnectionState,
  LiveTranscriptionEvents,
  useDeepgram,
} from "./context/deepgram-provider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "./context/microphone-provider";
import Visualizer from "./components/visualizer";

const App = () => {
  const [caption, setCaption] = useState("Powered by Deepgram");
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    pauseMicrophone,
    stopMicrophone,
    microphoneState,
  } = useMicrophone();
  const captionTimeout = useRef(null);
  const keepAliveInterval = useRef(null);

  useEffect(() => {
    setupMicrophone();
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      console.log("Microphone is ready, connecting to Deepgram...");
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
      });
    }
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone || !connection) return;

    const onData = (e) => {
      connection.send(e.data);
    };

    const onTranscript = (data) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      const thisCaption = data.channel.alternatives[0].transcript;

      if (thisCaption !== "") {
        setCaption(thisCaption);
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.open) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      startMicrophone();
    }

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript,
      );
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
  }, [connectionState]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.open
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
  }, [microphoneState, connectionState]);

  return (
    <div className="flex h-full antialiased">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <div className="flex flex-col flex-auto h-full">
          <div className="relative w-full h-full">
            {microphone && <Visualizer microphone={microphone} />}
            <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center px-10">
              {caption && <span className="bg-black/70 p-8">{caption}</span>}
            </div>
            <div className="absolute bottom-10 left-10">
              <button
                onClick={startMicrophone}
                disabled={microphoneState === MicrophoneState.Open}
              >
                Start
              </button>
              <button
                onClick={pauseMicrophone}
                disabled={microphoneState !== MicrophoneState.Open}
              >
                Pause
              </button>
              <button
                onClick={stopMicrophone}
                disabled={microphoneState === MicrophoneState.Stopped}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
