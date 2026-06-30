"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onResult: (blob: Blob, durationSeconds: number) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onResult, onError, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Audio recording is not supported in this browser.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((track) => track.stop());
        onResult(new Blob(chunksRef.current, { type: mimeType }), duration);
      };
      recorder.start(250);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (error) {
      const message = error instanceof DOMException && error.name === "NotAllowedError"
        ? "Microphone access was blocked. Allow it in your browser settings and try again."
        : error instanceof Error ? error.message : "Could not start the microphone.";
      onError?.(message);
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const formattedTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {recording && (
        <div className="flex items-center gap-2 text-[#a43d2f] font-mono text-lg" aria-live="polite">
          <span className="w-3 h-3 rounded-full bg-[#a43d2f] animate-pulse" />
          {formattedTime}
        </div>
      )}
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled}
        className={`min-w-52 px-8 py-4 rounded-full text-base font-bold transition-all ${recording ? "bg-[#a43d2f] hover:bg-[#843126] text-white" : "bg-[#14130f] hover:opacity-85 text-[#f4f1e8] disabled:opacity-35 disabled:cursor-not-allowed"}`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {!recording && <p className="text-xs text-[#8c887c]">Your recording is processed once and never saved.</p>}
    </div>
  );
}
