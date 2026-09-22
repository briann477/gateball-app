"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface ScheduleMatch {
  id: string;
  matchNumber: number;
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

const initialSchedule: ScheduleMatch[] = [
  {
    id: "M01",
    matchNumber: 1,
    time: "08:30 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Pool A",
    redTeam: "Depok Red Squad",
    whiteTeam: "Cilodong Gateball",
    redScore: 15,
    whiteScore: 11,
    status: "finished",
  },
  {
    id: "M02",
    matchNumber: 2,
    time: "08:30 WIB",
    field: "Lapangan 2",
    category: "Beregu Campuran",
    pool: "Pool B",
    redTeam: "Bogor Raya GC",
    whiteTeam: "Depok White Titans",
    redScore: 14,
    whiteScore: 13,
    status: "finished",
  },
  {
    id: "M03",
    matchNumber: 3,
    time: "09:15 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Pool A",
    redTeam: "Sawangan Strike",
    whiteTeam: "Tapos United",
    redScore: 12,
    whiteScore: 10,
    status: "live",
  },
  {
    id: "M04",
    matchNumber: 4,
    time: "09:15 WIB",
    field: "Lapangan 2",
    category: "Beregu Campuran",
    pool: "Pool B",
    redTeam: "Margonda Team",
    whiteTeam: "Cinere Club",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
  {
    id: "M05",
    matchNumber: 5,
    time: "10:00 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Pool C",
    redTeam: "Bandung Juara",
    whiteTeam: "Cimahi Sejahtera",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
  {
    id: "M06",
    matchNumber: 6,
    time: "10:00 WIB",
    field: "Lapangan 2",
    category: "Beregu Campuran",
    pool: "Pool D",
    redTeam: "Sukabumi Prima",
    whiteTeam: "Bekasi Patriot",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
  {
    id: "M07",
    matchNumber: 7,
    time: "13:30 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Perempat Final",
    redTeam: "Juara Pool A",
    whiteTeam: "Runner-up Pool B",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
  {
    id: "M08",
    matchNumber: 8,
    time: "14:15 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Semifinal",
    redTeam: "Pemenang QF 1",
    whiteTeam: "Pemenang QF 2",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
  {
    id: "M09",
    matchNumber: 9,
    time: "15:30 WIB",
    field: "Lapangan 1",
    category: "Beregu Campuran",
    pool: "Grand Final",
    redTeam: "Finalis 1",
    whiteTeam: "Finalis 2",
    redScore: null,
    whiteScore: null,
    status: "upcoming",
  },
];

export default function MasterSchedule() {
  const [selectedField, setSelectedField] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter jadwal
  const filteredMatches = initialSchedule.filter((m) => {
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
              href="/admin"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Kembali ke Dashboard Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  PERGATSI Official Master Schedule
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                Jadwal & Hasil Pertandingan Turnamen
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">
              Total: {initialSchedule.length} Partai Tanding
            </span>
          </div>
        </header>

        {/* BAR FILTER & PENCARIAN */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Input Cari Tim */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Cari nama klub / pool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Lapangan */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {["Semua", "Lapangan 1", "Lapangan 2"].map((field) => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedField === field
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { label: "Semua Status", value: "Semua" },
                { label: "🔴 LIVE", value: "live" },
                { label: "✓ Selesai", value: "finished" },
                { label: "⏳ Standby", value: "upcoming" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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

        {/* LIST JADWAL PERTANDINGAN */}
        <section className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
              Tidak ada pertandingan yang cocok dengan filter.
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
                      ? "border-emerald-500/80 ring-2 ring-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-black bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                        Match #{match.matchNumber}
                      </span>
                      <span className="text-xs font-bold text-indigo-400">
                        {match.pool}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {match.time}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {match.field}
                      </span>
                    </div>

                    {/* BADGE STATUS */}
                    <div>
                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500 text-emerald-300 animate-pulse">
                          <PlayCircle className="w-3.5 h-3.5" /> SEDANG
                          BERTANDING
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{" "}
                          SELESAI
                        </span>
                      )}
                      {match.status === "upcoming" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 text-slate-500 border border-slate-800">
                          <AlertCircle className="w-3.5 h-3.5" /> BELUM MULAI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KONTEN TIM & SKOR */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                    {/* Tim Merah */}
                    <div
                      className={`md:col-span-3 flex items-center justify-between md:justify-end gap-3 p-3 rounded-xl ${
                        isRedWinner
                          ? "bg-red-950/40 border border-red-700/50"
                          : "bg-slate-950/50"
                      }`}
                    >
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                          TIM MERAH (GANJIL)
                        </span>
                        <span className="font-bold text-sm md:text-base text-white">
                          {match.redTeam}
                        </span>
                        {isRedWinner && (
                          <span className="ml-2 text-[10px] text-yellow-400 font-bold">
                            🏆 MENANG
                          </span>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs shadow shrink-0">
                        M
                      </div>
                    </div>

                    {/* Skor Tengah */}
                    <div className="md:col-span-1 text-center py-1 bg-black/40 rounded-xl border border-slate-800/80">
                      {isFinished || isLive ? (
                        <div className="font-mono text-xl md:text-2xl font-black tracking-widest">
                          <span
                            className={
                              isRedWinner ? "text-red-400" : "text-white"
                            }
                          >
                            {match.redScore}
                          </span>
                          <span className="text-slate-600 mx-2">-</span>
                          <span
                            className={
                              isWhiteWinner ? "text-emerald-400" : "text-white"
                            }
                          >
                            {match.whiteScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-500 uppercase font-bold">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Tim Putih */}
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
                      <div className="text-left order-1 md:order-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          TIM PUTIH (GENAP)
                        </span>
                        <span className="font-bold text-sm md:text-base text-white">
                          {match.whiteTeam}
                        </span>
                        {isWhiteWinner && (
                          <span className="ml-2 text-[10px] text-yellow-400 font-bold">
                            🏆 MENANG
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
