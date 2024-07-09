import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DeepgramContextProvider } from "./context/deepgram-provider";
import { MicrophoneContextProvider } from "./context/microphone-provider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DeepgramContextProvider>
      <MicrophoneContextProvider>
        <App />
      </MicrophoneContextProvider>
    </DeepgramContextProvider>
  </React.StrictMode>,
);
