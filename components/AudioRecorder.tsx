"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onResult: (blob: Blob, durationSeconds: number) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onResult, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      stream.getTracks().forEach((t) => t.stop());
      onResult(blob, duration);
    };

    mr.start(250);
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {recording && (
        <div className="flex items-center gap-2 text-red-400 font-mono text-lg">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          {fmt(seconds)}
        </div>
      )}
      <button
        onClick={recording ? stop : start}
        disabled={disabled}
        className={`px-8 py-4 rounded-2xl text-lg font-semibold transition-all ${
          recording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {!recording && (
        <p className="text-xs text-gray-500">Click to start — mic permission required</p>
      )}
    </div>
  );
}
