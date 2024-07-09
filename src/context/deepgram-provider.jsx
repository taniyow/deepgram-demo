import React, { createContext, useContext, useState } from "react";
import {
  createClient,
  LiveClient,
  SOCKET_STATES as LiveConnectionState,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";

const DeepgramContext = createContext(undefined);

const API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

const DeepgramContextProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState(
    LiveConnectionState.closed,
  );

  const connectToDeepgram = async (options, endpoint) => {
    const deepgram = createClient(API_KEY);
    const conn = deepgram.listen.live(options, endpoint);

    conn.addListener(LiveTranscriptionEvents.Open, () =>
      setConnectionState(LiveConnectionState.open),
    );
    conn.addListener(LiveTranscriptionEvents.Close, () =>
      setConnectionState(LiveConnectionState.closed),
    );

    setConnection(conn);
  };

  const disconnectFromDeepgram = async () => {
    if (connection) {
      connection.finish();
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram() {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider",
    );
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  LiveConnectionState,
  LiveTranscriptionEvents,
};
