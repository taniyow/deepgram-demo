import React, { createContext, useCallback, useContext, useState } from "react";

const MicrophoneEvents = {
  DataAvailable: "dataavailable",
  Error: "error",
  Pause: "pause",
  Resume: "resume",
  Start: "start",
  Stop: "stop",
};

const MicrophoneState = {
  NotSetup: -1,
  SettingUp: 0,
  Ready: 1,
  Opening: 2,
  Open: 3,
  Error: 4,
  Pausing: 5,
  Paused: 6,
  Stopped: 7,
};

const MicrophoneContext = createContext(undefined);

const MicrophoneContextProvider = ({ children }) => {
  const [microphoneState, setMicrophoneState] = useState(
    MicrophoneState.NotSetup,
  );
  const [microphone, setMicrophone] = useState(null);

  const setupMicrophone = async () => {
    setMicrophoneState(MicrophoneState.SettingUp);
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });
      const microphone = new MediaRecorder(userMedia);
      setMicrophoneState(MicrophoneState.Ready);
      setMicrophone(microphone);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Stopped);
    if (microphone?.state === "recording" || microphone?.state === "paused") {
      microphone.stop();
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    if (microphone?.state !== "recording") {
      setMicrophoneState(MicrophoneState.Opening);
      if (microphone?.state === "paused") {
        microphone.resume();
      } else {
        microphone?.start(250);
      }
      setMicrophoneState(MicrophoneState.Open);
    }
  }, [microphone]);

  const pauseMicrophone = useCallback(() => {
    if (microphone?.state === "recording") {
      setMicrophoneState(MicrophoneState.Pausing);
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        pauseMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone() {
  const context = useContext(MicrophoneContext);
  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider",
    );
  }
  return context;
}

export {
  MicrophoneContextProvider,
  useMicrophone,
  MicrophoneState,
  MicrophoneEvents,
};
