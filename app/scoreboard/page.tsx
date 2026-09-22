"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldAlert, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BallState {
  number: number;
  color: "red" | "white";
  gate1: boolean;
  gate2: boolean;
  gate3: boolean;
  agari: boolean;
  isOut: boolean;
  score: number;
}

export default function SpectatorScoreboard() {
  const [fieldName, setFieldName] = useState("Lapangan 1");
  const [redTeamName, setRedTeamName] = useState("Tim Merah");
  const [whiteTeamName, setWhiteTeamName] = useState("Tim Putih");
  const [redScore, setRedScore] = useState(0);
  const [whiteScore, setWhiteScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeBallNumber, setActiveBallNumber] = useState(1);
  const [balls, setBalls] = useState<BallState[]>([]);
  const [loading, setLoading] = useState(true);

  // Tarik data awal dan pasang Realtime Supabase
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .limit(1)
        .single();

      if (data && !error) {
        setFieldName(data.field_name);
        setRedTeamName(data.red_team_name);
        setWhiteTeamName(data.white_team_name);
        setRedScore(data.red_score);
        setWhiteScore(data.white_score);
        setSecondsLeft(data.seconds_left);
        setIsTimerRunning(data.is_timer_running);
        setActiveBallNumber(data.active_ball_number);
        setBalls(data.balls_data);
      }
      setLoading(false);
    };

    fetchInitialData();

    // Dengarkan perubahan dari wasit meja
    const channel = supabase
      .channel("spectator_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const updated = payload.new;
          setFieldName(updated.field_name);
          setRedTeamName(updated.red_team_name);
          setWhiteTeamName(updated.white_team_name);
          setRedScore(updated.red_score);
          setWhiteScore(updated.white_score);
          setSecondsLeft(updated.seconds_left);
          setIsTimerRunning(updated.is_timer_running);
          setActiveBallNumber(updated.active_ball_number);
          setBalls(updated.balls_data);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Interval waktu berjalan
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-lg">
          Memuat Layar Siaran Pertandingan...
        </p>
      </main>
    );
  }

  const redBalls = balls.filter((b) => b.color === "red");
  const whiteBalls = balls.filter((b) => b.color === "white");

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col justify-between select-none">
      {/* HEADER ATAS */}
      <header className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-6 py-4 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
              PERGATSI Official Live Match
            </span>
            <h1 className="text-2xl font-black tracking-wide text-white">
              {fieldName}
            </h1>
          </div>
        </div>

        {/* Waktu Pertandingan Super Besar */}
        <div className="flex items-center gap-3 bg-black/80 px-6 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
          <span className="text-4xl md:text-5xl font-mono font-black text-amber-400 tracking-wider">
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>SINKRONISASI REALTIME</span>
        </div>
      </header>

      {/* PAPAN SKOR RAKSASA */}
      <section className="grid grid-cols-2 gap-6 my-6">
        {/* TIM MERAH */}
        <div className="bg-gradient-to-br from-red-950/60 to-slate-900 border-4 border-red-700/60 rounded-3xl p-6 text-center shadow-2xl flex flex-col justify-center items-center">
          <span className="text-lg md:text-2xl font-black text-red-400 uppercase tracking-widest">
            {redTeamName}
          </span>
          <div className="text-8xl md:text-9xl font-black text-red-500 my-2 tracking-tight drop-shadow-md">
            {redScore}
          </div>
          <span className="text-xs md:text-sm text-red-300 font-semibold uppercase tracking-wider">
            Bola Ganjil (1, 3, 5, 7, 9)
          </span>
        </div>

        {/* TIM PUTIH */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-4 border-slate-600/60 rounded-3xl p-6 text-center shadow-2xl flex flex-col justify-center items-center">
          <span className="text-lg md:text-2xl font-black text-slate-200 uppercase tracking-widest">
            {whiteTeamName}
          </span>
          <div className="text-8xl md:text-9xl font-black text-white my-2 tracking-tight drop-shadow-md">
            {whiteScore}
          </div>
          <span className="text-xs md:text-sm text-slate-400 font-semibold uppercase tracking-wider">
            Bola Genap (2, 4, 6, 8, 10)
          </span>
        </div>
      </section>

      {/* REKAP STATUS 10 BOLA UNTUK PENONTON */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sisi Merah */}
        <div className="bg-slate-900/80 border border-red-950 rounded-2xl p-4 space-y-2">
          <div className="space-y-2">
            {redBalls.map((b) => {
              const isActive = b.number === activeBallNumber;
              return (
                <div
                  key={b.number}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isActive
                      ? "bg-red-900/40 border-yellow-400 ring-2 ring-yellow-400 shadow-lg scale-[1.01]"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-base shadow">
                      {b.number}
                    </div>
                    {isActive && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded font-black tracking-wider animate-pulse">
                        GILIRAN
                      </span>
                    )}
                    {b.isOut && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> OUT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate1 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G1
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate2 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G2
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate3 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G3
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.agari ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      AG
                    </span>
                    <span className="ml-3 font-black text-sm text-slate-200 w-10 text-right">
                      {b.score} pt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sisi Putih */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="space-y-2">
            {whiteBalls.map((b) => {
              const isActive = b.number === activeBallNumber;
              return (
                <div
                  key={b.number}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isActive
                      ? "bg-slate-800 border-yellow-400 ring-2 ring-yellow-400 shadow-lg scale-[1.01]"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white text-slate-950 font-black flex items-center justify-center text-base shadow">
                      {b.number}
                    </div>
                    {isActive && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded font-black tracking-wider animate-pulse">
                        GILIRAN
                      </span>
                    )}
                    {b.isOut && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> OUT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate1 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G1
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate2 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G2
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.gate3 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      G3
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold ${b.agari ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-600"}`}
                    >
                      AG
                    </span>
                    <span className="ml-3 font-black text-sm text-slate-200 w-10 text-right">
                      {b.score} pt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER SIARAN */}
      <footer className="text-center text-xs text-slate-500 font-mono mt-4">
        PERGATSI Digital Gateball Tournament System • Live Broadcast Mode
      </footer>
    </main>
  );
}
