"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, LoaderCircle } from "lucide-react";
import { API_BASE_URL } from "@/services/api";
import { getAuthHeaders } from "@/utils/auth";

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Audio recording error:", err);
      alert("Microphone access is required to record voice messages.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `voice_note_${Date.now()}.webm`);

      const res = await fetch(`${API_BASE_URL}/messaging/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onSendVoice({
          message_type: "voice",
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
          content: `Voice Message (${formatSeconds(recordingTime)})`
        });
      } else {
        alert("Failed to upload voice note.");
      }
    } catch (err) {
      console.error("Voice upload error:", err);
      alert("Error uploading voice note.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-rose-50/80 border border-rose-200 rounded-2xl px-4 py-2.5 w-full animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
        <span className="text-xs font-bold text-rose-700">Recording Voice Note</span>
      </div>

      <span className="font-mono text-xs font-bold text-slate-700 ml-auto">
        {formatSeconds(recordingTime)}
      </span>

      <div className="flex items-center gap-1.5 border-l border-rose-200 pl-3">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            title="Stop recording"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={uploading}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Send Voice Message"
          >
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        )}

        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100 transition-colors"
          title="Cancel"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
