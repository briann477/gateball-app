"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Trophy,
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Edit3,
  Tv,
  Play,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ScheduleMatch {
  id: string;
  matchNumber: number;
  sessionNumber: number;
  time: string;
  field: string;
  category: string;
  pool: string;
  redTeam: string;
  whiteTeam: string;
  redScore: number | null;
  whiteScore: number | null;
  status: "live" | "finished" | "upcoming";
}

interface TeamItem {
  id: string;
  name: string;
  city: string;
}

const initialBalls = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  color: (i + 1) % 2 !== 0 ? "red" : "white",
  gate1: false,
  gate2: false,
  gate3: false,
  agari: false,
  isOut: false,
  score: 0,
}));

export default function MasterSchedule() {
  const [tournamentName, setTournamentName] = useState(
    "Kejuaraan Gateball PERGATSI Open 2026",
  );
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [selectedField, setSelectedField] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Input Skor Wasit
  const [editingMatch, setEditingMatch] = useState<ScheduleMatch | null>(null);
  const [inputRedScore, setInputRedScore] = useState<number>(0);
  const [inputWhiteScore, setInputWhiteScore] = useState<number>(0);

  // MESIN GENERATOR ROUND-ROBIN PENUH & SESI PARALEL (4 LAPANGAN BARENGAN)
  const generateFullParallelSchedule = (forceReset = false) => {
    const raw = localStorage.getItem("pergatsi_tournament_data");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.tournamentName) setTournamentName(parsed.tournamentName);

      // Jika tidak dipaksa reset dan sudah ada jadwal, pakai yang ada
      if (!forceReset && parsed.matches && parsed.matches.length > 0) {
        setMatches(parsed.matches);
        return;
      }

      const pools: { [key: string]: TeamItem[] } = parsed.pools || {};
      const courtCount = parsed.courtCount || 4;
      const allPoolMatches: { pool: string; red: string; white: string }[] = [];

      // 1. BUAT SELURUH KOMBINASI ROUND-ROBIN TIAP POOL (Semua tim saling tanding)
      Object.entries(pools).forEach(([poolName, teamList]) => {
        const n = teamList.length;
        if (n >= 2) {
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              allPoolMatches.push({
                pool: poolName,
                red: teamList[i].name,
                white: teamList[j].name,
              });
            }
          }
        }
      });

      // 2. BAGI KE SESI WAKTU SIMULTAN (Semua lapangan main di jam yang sama)
      const generatedList: ScheduleMatch[] = [];
      let matchCounter = 1;
      const totalPoolMatches = allPoolMatches.length;

      for (let i = 0; i < totalPoolMatches; i++) {
        const sessionIndex = Math.floor(i / courtCount); // Sesi 0, Sesi 1, Sesi 2, dst.
        const courtIndex = (i % courtCount) + 1; // Lapangan 1, 2, 3, 4

        // Hitung Jam Sesi: Interval 40 Menit (30 menit main + 10 menit pergantian tim)
        const startHour = 8;
        const totalMinutes = sessionIndex * 40;
        let hour = startHour + Math.floor(totalMinutes / 60);
        let minute = totalMinutes % 60;

        // Jeda ISHOMA (Istirahat Sholat Makan) jika lewat jam 12:00
        if (hour >= 12 && hour < 13) {
          hour = 13;
          minute = (sessionIndex % 2) * 40;
        }

        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} WIB`;

        generatedList.push({
          id: `M-${matchCounter}`,
          matchNumber: matchCounter,
          sessionNumber: sessionIndex + 1,
          time: timeString,
          field: `Lapangan ${courtIndex}`,
          category: "Beregu Campuran",
          pool: allPoolMatches[i].pool,
          redTeam: allPoolMatches[i].red,
          whiteTeam: allPoolMatches[i].white,
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        });

        matchCounter++;
      }

      // 3. TAMBAHKAN BABAK FASE GUGUR DI AKHIR JADWAL (SEREMPAK JUGA)
      const lastSession = Math.ceil(totalPoolMatches / courtCount);
      const qfHour = 14;

      // Perempat Final (QF 1-4 main serempak di Lapangan 1, 2, 3, 4)
      for (let qf = 1; qf <= 4; qf++) {
        generatedList.push({
          id: `M-${matchCounter}`,
          matchNumber: matchCounter,
          sessionNumber: lastSession + 1,
          time: `${qfHour}:00 WIB`,
          field: `Lapangan ${qf}`,
          category: "Beregu Campuran",
          pool: `Perempat Final (QF-${qf})`,
          redTeam:
            qf === 1
              ? "Juara Pool A"
              : qf === 2
                ? "Juara Pool C"
                : qf === 3
                  ? "Juara Pool B"
                  : "Juara Pool D",
          whiteTeam:
            qf === 1
              ? "Runner-up Pool B"
              : qf === 2
                ? "Runner-up Pool D"
                : qf === 3
                  ? "Runner-up Pool A"
                  : "Runner-up Pool C",
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        });
        matchCounter++;
      }

      // Semifinal (SF 1 & 2 main serempak di Lapangan 1 & Lapangan 2)
      generatedList.push(
        {
          id: `M-${matchCounter}`,
          matchNumber: matchCounter++,
          sessionNumber: lastSession + 2,
          time: "14:45 WIB",
          field: "Lapangan 1",
          category: "Beregu Campuran",
          pool: "Semifinal (SF-1)",
          redTeam: "Pemenang QF-1",
          whiteTeam: "Pemenang QF-2",
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        },
        {
          id: `M-${matchCounter}`,
          matchNumber: matchCounter++,
          sessionNumber: lastSession + 2,
          time: "14:45 WIB",
          field: "Lapangan 2",
          category: "Beregu Campuran",
          pool: "Semifinal (SF-2)",
          redTeam: "Pemenang QF-3",
          whiteTeam: "Pemenang QF-4",
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        },
      );

      // Grand Final & Perebutan Juara 3 (Lapangan 1 & Lapangan 2)
      generatedList.push(
        {
          id: `M-${matchCounter}`,
          matchNumber: matchCounter++,
          sessionNumber: lastSession + 3,
          time: "15:30 WIB",
          field: "Lapangan 1",
          category: "Beregu Campuran",
          pool: "🏆 GRAND FINAL",
          redTeam: "Finalis SF-1",
          whiteTeam: "Finalis SF-2",
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        },
        {
          id: `M-${matchCounter}`,
          matchNumber: matchCounter++,
          sessionNumber: lastSession + 3,
          time: "15:30 WIB",
          field: "Lapangan 2",
          category: "Beregu Campuran",
          pool: "Perebutan Juara 3",
          redTeam: "Kalah SF-1",
          whiteTeam: "Kalah SF-2",
          redScore: null,
          whiteScore: null,
          status: "upcoming",
        },
      );

      setMatches(generatedList);
      parsed.matches = generatedList;
      localStorage.setItem("pergatsi_tournament_data", JSON.stringify(parsed));
    } catch (e) {
      console.error("Gagal generate jadwal simultan", e);
    }
  };

  useEffect(() => {
    generateFullParallelSchedule(false);
  }, []);

  // Mulai Pertandingan (Kirim ke Cloud & Buka Wasit Meja)
  const handleStartMatch = async (match: ScheduleMatch) => {
    const updated = matches.map((m) => {
      if (m.id === match.id) {
        return { ...m, status: "live" as const, redScore: 0, whiteScore: 0 };
      }
      return m;
    });

    setMatches(updated);

    const raw = localStorage.getItem("pergatsi_tournament_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.matches = updated;
      localStorage.setItem("pergatsi_tournament_data", JSON.stringify(parsed));
    }

    try {
      const { data } = await supabase
        .from("matches")
        .select("id")
        .limit(1)
        .single();
      if (data) {
        await supabase
          .from("matches")
          .update({
            field_name: `${match.field} — ${match.pool}`,
            red_team_name: match.redTeam,
            white_team_name: match.whiteTeam,
            red_score: 0,
            white_score: 0,
            seconds_left: 1800,
            is_timer_running: false,
            active_ball_number: 1,
            balls_data: initialBalls,
            logs: [
              `Match #${match.matchNumber}: ${match.redTeam} vs ${match.whiteTeam} resmi dimulai.`,
            ],
          })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error("Gagal update cloud", err);
    }

    window.open("/", "_blank");
  };

  // Simpan Skor Akhir Laga
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    const updatedMatches = matches.map((m) => {
      if (m.id === editingMatch.id) {
        return {
          ...m,
          redScore: inputRedScore,
          whiteScore: inputWhiteScore,
          status: "finished" as const,
        };
      }
      return m;
    });

    setMatches(updatedMatches);
    setEditingMatch(null);

    const raw = localStorage.getItem("pergatsi_tournament_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.matches = updatedMatches;
      localStorage.setItem("pergatsi_tournament_data", JSON.stringify(parsed));
    }
  };

  const filteredMatches = matches.filter((m) => {
    const matchField = selectedField === "Semua" || m.field === selectedField;
    const matchStatus =
      selectedStatus === "Semua" || m.status === selectedStatus;
    const matchSearch =
      m.redTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.whiteTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pool.toLowerCase().includes(searchQuery.toLowerCase());

    return matchField && matchStatus && matchSearch;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER UTAMA */}
        <header className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/setup"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  PERGATSI Simultaneous Match Matrix
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                {tournamentName}
              </h1>
            </div>
          </div>

          {/* TOMBOL AKSI CEPAT */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => generateFullParallelSchedule(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition"
              title="Reset dan susun ulang agar 4 lapangan tanding bareng di jam yang sama"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Susun Ulang Simultan (4 Lapangan)</span>
            </button>

            <Link
              href="/bracket"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
            >
              <GitBranch className="w-4 h-4" />
              <span>Lihat Klasemen & Bagan</span>
            </Link>

            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Total: {matches.length} Partai</span>
            </div>
          </div>
        </header>

        {/* BAR PENCARIAN & FILTER */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama tim atau pool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "Semua",
                "Lapangan 1",
                "Lapangan 2",
                "Lapangan 3",
                "Lapangan 4",
              ].map((field) => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedField === field
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "Semua", value: "Semua" },
                { label: "🔴 LIVE", value: "live" },
                { label: "✓ Selesai", value: "finished" },
                { label: "⏳ Standby", value: "upcoming" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedStatus === s.value
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LIST PERTANDINGAN DENGAN INDIKATOR SESI SIMULTAN */}
        <section className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
              Tidak ada pertandingan yang cocok. Klik tombol kuning di atas
              untuk menyusun jadwal simultan.
            </div>
          ) : (
            filteredMatches.map((match) => {
              const isLive = match.status === "live";
              const isFinished = match.status === "finished";
              const isRedWinner =
                isFinished && match.redScore! > match.whiteScore!;
              const isWhiteWinner =
                isFinished && match.whiteScore! > match.redScore!;

              return (
                <div
                  key={match.id}
                  className={`bg-slate-900 border rounded-2xl p-4 transition shadow-md ${
                    isLive
                      ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-black bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                        Match #{match.matchNumber}
                      </span>
                      <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                        Sesi {match.sessionNumber}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">
                        {match.pool}
                      </span>
                      <span className="text-xs text-amber-400 flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />{" "}
                        {match.time}
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />{" "}
                        {match.field}
                      </span>
                    </div>

                    {/* KENDALI PERTANDINGAN */}
                    <div className="flex items-center gap-2">
                      {match.status === "upcoming" && (
                        <>
                          <button
                            onClick={() => handleStartMatch(match)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Mulai Tanding</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingMatch(match);
                              setInputRedScore(14);
                              setInputWhiteScore(12);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Input Cepat</span>
                          </button>
                        </>
                      )}

                      {isLive && (
                        <>
                          <Link
                            href="/"
                            target="_blank"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition"
                          >
                            <PlayCircle className="w-3.5 h-3.5 animate-spin" />
                            <span>Wasit Meja</span>
                          </Link>
                          <Link
                            href="/scoreboard"
                            target="_blank"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold border border-slate-700"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>TV Lapangan</span>
                          </Link>
                          <button
                            onClick={() => {
                              setEditingMatch(match);
                              setInputRedScore(15);
                              setInputWhiteScore(11);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selesaikan</span>
                          </button>
                        </>
                      )}

                      {isFinished && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SELESAI
                          </span>
                          <button
                            onClick={() => {
                              setEditingMatch(match);
                              setInputRedScore(match.redScore || 0);
                              setInputWhiteScore(match.whiteScore || 0);
                            }}
                            className="p-1.5 text-slate-500 hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KONTEN KEDUA TIM & SKOR */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                    <div
                      className={`md:col-span-3 flex items-center justify-between md:justify-end gap-3 p-3 rounded-xl ${
                        isRedWinner
                          ? "bg-red-950/40 border border-red-700/50"
                          : "bg-slate-950/50"
                      }`}
                    >
                      <div className="text-left md:text-right truncate">
                        <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                          TIM MERAH (GANJIL)
                        </span>
                        <span className="font-bold text-sm text-white truncate block">
                          {match.redTeam}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs shadow shrink-0">
                        M
                      </div>
                    </div>

                    <div className="md:col-span-1 text-center py-1 bg-black/40 rounded-xl border border-slate-800/80">
                      {isFinished ? (
                        <div className="font-mono text-xl md:text-2xl font-black tracking-widest">
                          <span
                            className={
                              isRedWinner
                                ? "text-red-400 font-black"
                                : "text-white"
                            }
                          >
                            {match.redScore}
                          </span>
                          <span className="text-slate-600 mx-1.5">-</span>
                          <span
                            className={
                              isWhiteWinner
                                ? "text-emerald-400 font-black"
                                : "text-white"
                            }
                          >
                            {match.whiteScore}
                          </span>
                        </div>
                      ) : isLive ? (
                        <span className="text-xs font-mono font-black text-emerald-400 animate-pulse uppercase">
                          ● LIVE
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500 uppercase font-bold">
                          VS
                        </span>
                      )}
                    </div>

                    <div
                      className={`md:col-span-3 flex items-center justify-between md:justify-start gap-3 p-3 rounded-xl ${
                        isWhiteWinner
                          ? "bg-slate-800/60 border border-slate-600/50"
                          : "bg-slate-950/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white text-slate-950 font-bold flex items-center justify-center text-xs shadow shrink-0 order-2 md:order-1">
                        P
                      </div>
                      <div className="text-left order-1 md:order-2 truncate">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          TIM PUTIH (GENAP)
                        </span>
                        <span className="font-bold text-sm text-white truncate block">
                          {match.whiteTeam}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* MODAL INPUT SKOR */}
        {editingMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase font-mono">
                  Selesaikan Laga — Match #{editingMatch.matchNumber} (
                  {editingMatch.pool})
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {editingMatch.redTeam} vs {editingMatch.whiteTeam}
                </h3>
              </div>

              <form onSubmit={handleSaveScore} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl space-y-1">
                    <label className="text-[11px] font-bold text-red-400 block truncate">
                      {editingMatch.redTeam}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={inputRedScore}
                      onChange={(e) => setInputRedScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-red-800 rounded-lg p-2 text-center text-2xl font-black text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block truncate">
                      {editingMatch.whiteTeam}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={inputWhiteScore}
                      onChange={(e) =>
                        setInputWhiteScore(Number(e.target.value))
                      }
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-center text-2xl font-black text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kunci Skor & Update Klasemen</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
