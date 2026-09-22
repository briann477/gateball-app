"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Award,
  Clock,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
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

const initialBalls: BallState[] = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  color: (i + 1) % 2 !== 0 ? "red" : "white",
  gate1: false,
  gate2: false,
  gate3: false,
  agari: false,
  isOut: false,
  score: 0,
}));

export default function RefereeBoard() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState("Lapangan 1");
  const [redTeamName, setRedTeamName] = useState("Tim Merah");
  const [whiteTeamName, setWhiteTeamName] = useState("Tim Putih");
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeBallNumber, setActiveBallNumber] = useState(1);
  const [balls, setBalls] = useState<BallState[]>(initialBalls);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Tarik data dari Supabase saat web dibuka
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .limit(1)
        .single();

      if (data && !error) {
        setMatchId(data.id);
        setFieldName(data.field_name);
        setRedTeamName(data.red_team_name);
        setWhiteTeamName(data.white_team_name);
        setSecondsLeft(data.seconds_left);
        setIsTimerRunning(data.is_timer_running);
        setActiveBallNumber(data.active_ball_number);
        setBalls(data.balls_data);
        setLogs(data.logs || []);
        setIsConnected(true);
      }
      setLoading(false);
    };

    fetchMatch();

    // Dengarkan perubahan database secara langsung (Real-time listener)
    const channel = supabase
      .channel("match_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const updated = payload.new;
          setSecondsLeft(updated.seconds_left);
          setIsTimerRunning(updated.is_timer_running);
          setActiveBallNumber(updated.active_ball_number);
          setBalls(updated.balls_data);
          setLogs(updated.logs || []);
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Interval waktu pertandingan
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  // Tombol Mulai / Jeda Timer
  const toggleTimer = async () => {
    if (!matchId) return;
    const nextRunning = !isTimerRunning;
    setIsTimerRunning(nextRunning);
    await supabase
      .from("matches")
      .update({
        is_timer_running: nextRunning,
        seconds_left: secondsLeft,
      })
      .eq("id", matchId);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const redScore = balls
    .filter((b) => b.color === "red")
    .reduce((acc, b) => acc + b.score, 0);

  const whiteScore = balls
    .filter((b) => b.color === "white")
    .reduce((acc, b) => acc + b.score, 0);

  const currentBall =
    balls.find((b) => b.number === activeBallNumber) || balls[0];

  // 3. Simpan setiap pukulan wasit ke cloud Supabase
  const syncToCloud = async (
    newBalls: BallState[],
    newLogs: string[],
    newActiveBall?: number,
  ) => {
    if (!matchId) return;
    const rScore = newBalls
      .filter((b) => b.color === "red")
      .reduce((acc, b) => acc + b.score, 0);
    const wScore = newBalls
      .filter((b) => b.color === "white")
      .reduce((acc, b) => acc + b.score, 0);

    await supabase
      .from("matches")
      .update({
        balls_data: newBalls,
        logs: newLogs,
        red_score: rScore,
        white_score: wScore,
        active_ball_number:
          newActiveBall !== undefined ? newActiveBall : activeBallNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);
  };

  const handleScoreAction = (action: "gate1" | "gate2" | "gate3" | "agari") => {
    let logMsg = "";
    const updatedBalls = balls.map((b) => {
      if (b.number !== activeBallNumber) return b;
      let addedPoint = 0;
      const updated = { ...b };

      if (action === "gate1" && !b.gate1) {
        updated.gate1 = true;
        addedPoint = 1;
        logMsg = `Bola ${b.number} lolos Gate 1 (+1)`;
      } else if (action === "gate2" && b.gate1 && !b.gate2) {
        updated.gate2 = true;
        addedPoint = 1;
        logMsg = `Bola ${b.number} lolos Gate 2 (+1)`;
      } else if (action === "gate3" && b.gate2 && !b.gate3) {
        updated.gate3 = true;
        addedPoint = 1;
        logMsg = `Bola ${b.number} lolos Gate 3 (+1)`;
      } else if (action === "agari" && b.gate3 && !b.agari) {
        updated.agari = true;
        addedPoint = 2;
        logMsg = `Bola ${b.number} AGARI / Goal Pole (+2)`;
      }

      updated.score += addedPoint;
      return updated;
    });

    const timeStamp = formatTime(secondsLeft);
    const updatedLogs = [`[${timeStamp}] ${logMsg}`, ...logs.slice(0, 19)];

    setBalls(updatedBalls);
    setLogs(updatedLogs);
    syncToCloud(updatedBalls, updatedLogs);
  };

  const toggleOutBall = () => {
    let logMsg = "";
    const updatedBalls = balls.map((b) => {
      if (b.number !== activeBallNumber) return b;
      const status = !b.isOut;
      logMsg = `Bola ${b.number} ${status ? "dinyatakan OUT-BALL" : "kembali IN-BALL"}`;
      return { ...b, isOut: status };
    });

    const timeStamp = formatTime(secondsLeft);
    const updatedLogs = [`[${timeStamp}] ${logMsg}`, ...logs.slice(0, 19)];

    setBalls(updatedBalls);
    setLogs(updatedLogs);
    syncToCloud(updatedBalls, updatedLogs);
  };

  const nextTurn = () => {
    const nextBall = activeBallNumber >= 10 ? 1 : activeBallNumber + 1;
    setActiveBallNumber(nextBall);
    syncToCloud(balls, logs, nextBall);
  };

  const resetMatch = async () => {
    if (!matchId) return;
    if (confirm("Reset ulang seluruh skor pertandingan ini ke awal?")) {
      const resetBalls = initialBalls;
      const resetLogs: string[] = [];
      setSecondsLeft(1800);
      setIsTimerRunning(false);
      setActiveBallNumber(1);
      setBalls(resetBalls);
      setLogs(resetLogs);

      await supabase
        .from("matches")
        .update({
          balls_data: resetBalls,
          logs: resetLogs,
          red_score: 0,
          white_score: 0,
          seconds_left: 1800,
          is_timer_running: false,
          active_ball_number: 1,
        })
        .eq("id", matchId);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400">
          Menghubungkan ke Server Cloud PERGATSI...
        </p>
      </main>
    );
  }

  const redBalls = balls.filter((b) => b.color === "red");
  const whiteBalls = balls.filter((b) => b.color === "white");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* HEADER: KONEKSI CLOUD & TIMER */}
        <header className="flex items-center justify-between bg-slate-900 px-5 py-3 rounded-2xl border border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                PERGATSI Cloud Scoring
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isConnected
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                    : "bg-red-950 text-red-400"
                }`}
              >
                {isConnected ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {isConnected ? "LIVE CLOUD" : "OFFLINE"}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white">
              {fieldName} — Babak Pool
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-2xl md:text-3xl font-mono font-bold text-amber-400 tracking-wider">
                {formatTime(secondsLeft)}
              </span>
            </div>

            <button
              onClick={toggleTimer}
              className={`p-2.5 rounded-xl font-bold flex items-center transition ${
                isTimerRunning
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isTimerRunning ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={resetMatch}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              title="Reset Pertandingan"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* PAPAN SKOR BESAR */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-3 text-center">
            <span className="text-xs font-bold tracking-wider text-red-400 uppercase">
              {redTeamName}
            </span>
            <div className="text-5xl font-black text-red-500 my-1">
              {redScore}
            </div>
            <span className="text-[11px] text-red-300/80">
              Bola Ganjil (1, 3, 5, 7, 9)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              {whiteTeamName}
            </span>
            <div className="text-5xl font-black text-white my-1">
              {whiteScore}
            </div>
            <span className="text-[11px] text-slate-400">
              Bola Genap (2, 4, 6, 8, 10)
            </span>
          </div>
        </div>

        {/* DAFTAR BOLA BERSANDING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Merah */}
          <div className="bg-slate-900/90 border border-red-900/40 rounded-2xl p-3 space-y-2">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider px-1">
              Daftar Bola Merah
            </h2>
            <div className="space-y-1.5">
              {redBalls.map((b) => {
                const isActive = b.number === activeBallNumber;
                return (
                  <div
                    key={b.number}
                    onClick={() => {
                      setActiveBallNumber(b.number);
                      syncToCloud(balls, logs, b.number);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition ${
                      isActive
                        ? "bg-red-900/50 border-red-500 ring-2 ring-red-400 shadow-md scale-[1.01]"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow">
                        {b.number}
                      </div>
                      {b.isOut && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          OUT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate1 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G1
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate2 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G2
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate3 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G3
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.agari ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        AG
                      </span>
                      <span className="ml-2 font-bold text-slate-200 text-xs w-8 text-right">
                        {b.score} pt
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Putih */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
              Daftar Bola Putih
            </h2>
            <div className="space-y-1.5">
              {whiteBalls.map((b) => {
                const isActive = b.number === activeBallNumber;
                return (
                  <div
                    key={b.number}
                    onClick={() => {
                      setActiveBallNumber(b.number);
                      syncToCloud(balls, logs, b.number);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition ${
                      isActive
                        ? "bg-slate-800 border-white ring-2 ring-slate-300 shadow-md scale-[1.01]"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-slate-950 font-bold flex items-center justify-center text-sm shadow">
                        {b.number}
                      </div>
                      {b.isOut && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          OUT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate1 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G1
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate2 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G2
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.gate3 ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        G3
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${b.agari ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-500"}`}
                      >
                        AG
                      </span>
                      <span className="ml-2 font-bold text-slate-200 text-xs w-8 text-right">
                        {b.score} pt
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KONTROL EKSEKUSI BOLA AKTIF */}
        <section className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full font-black text-base flex items-center justify-center shadow-lg ${
                  currentBall.color === "red"
                    ? "bg-red-600 text-white"
                    : "bg-white text-slate-950"
                }`}
              >
                {currentBall.number}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Giliran Aktif
                </span>
                <span className="font-extrabold text-sm md:text-base">
                  Bola #{currentBall.number} (
                  {currentBall.color === "red" ? "Merah" : "Putih"})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleOutBall}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                  currentBall.isOut
                    ? "bg-amber-600/30 border-amber-500 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {currentBall.isOut ? "Batalkan Out" : "Tandai Out-Ball"}
              </button>

              <button
                onClick={nextTurn}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <span>Pukul Berikutnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              disabled={currentBall.gate1}
              onClick={() => handleScoreAction("gate1")}
              className={`py-3 rounded-xl font-bold flex flex-col items-center gap-0.5 transition ${
                currentBall.gate1
                  ? "bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95"
              }`}
            >
              <span className="text-sm">Gate 1</span>
              <span className="text-[11px] font-normal">
                {currentBall.gate1 ? "✓ Lolos" : "+1 Poin"}
              </span>
            </button>

            <button
              disabled={!currentBall.gate1 || currentBall.gate2}
              onClick={() => handleScoreAction("gate2")}
              className={`py-3 rounded-xl font-bold flex flex-col items-center gap-0.5 transition ${
                currentBall.gate2
                  ? "bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : !currentBall.gate1
                    ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95"
              }`}
            >
              <span className="text-sm">Gate 2</span>
              <span className="text-[11px] font-normal">
                {currentBall.gate2 ? "✓ Lolos" : "+1 Poin"}
              </span>
            </button>

            <button
              disabled={!currentBall.gate2 || currentBall.gate3}
              onClick={() => handleScoreAction("gate3")}
              className={`py-3 rounded-xl font-bold flex flex-col items-center gap-0.5 transition ${
                currentBall.gate3
                  ? "bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : !currentBall.gate2
                    ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95"
              }`}
            >
              <span className="text-sm">Gate 3</span>
              <span className="text-[11px] font-normal">
                {currentBall.gate3 ? "✓ Lolos" : "+1 Poin"}
              </span>
            </button>

            <button
              disabled={!currentBall.gate3 || currentBall.agari}
              onClick={() => handleScoreAction("agari")}
              className={`py-3 rounded-xl font-bold flex flex-col items-center gap-0.5 transition ${
                currentBall.agari
                  ? "bg-slate-800/80 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : !currentBall.gate3
                    ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg active:scale-95"
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="text-sm">AGARI</span>
              <span className="text-[11px] font-normal">
                {currentBall.agari ? "✓ Selesai" : "+2 Poin"}
              </span>
            </button>
          </div>
        </section>

        {/* LOG RIWAYAT */}
        <section className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Log Pertandingan Terkini
          </h3>
          <div className="h-24 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Belum ada aksi dicatat.</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="border-b border-slate-800/50 pb-0.5"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
