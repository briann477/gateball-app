"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  GitBranch,
  Table,
  ArrowLeft,
  Award,
  CheckCircle,
  Shield,
} from "lucide-react";

// Struktur Data Tim & Klasemen Pool
interface TeamStanding {
  id: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  points: number;
}

const poolAData: TeamStanding[] = [
  {
    id: "A1",
    name: "Depok Red Squad",
    played: 3,
    won: 3,
    lost: 0,
    pointsFor: 42,
    pointsAgainst: 21,
    diff: 21,
    points: 6,
  },
  {
    id: "A2",
    name: "Cilodong Gateball",
    played: 3,
    won: 2,
    lost: 1,
    pointsFor: 35,
    pointsAgainst: 28,
    diff: 7,
    points: 4,
  },
  {
    id: "A3",
    name: "Sawangan Strike",
    played: 3,
    won: 1,
    lost: 2,
    pointsFor: 28,
    pointsAgainst: 34,
    diff: -6,
    points: 2,
  },
  {
    id: "A4",
    name: "Tapos United",
    played: 3,
    won: 0,
    lost: 3,
    pointsFor: 18,
    pointsAgainst: 40,
    diff: -22,
    points: 0,
  },
];

const poolBData: TeamStanding[] = [
  {
    id: "B1",
    name: "Bogor Raya GC",
    played: 3,
    won: 3,
    lost: 0,
    pointsFor: 45,
    pointsAgainst: 19,
    diff: 26,
    points: 6,
  },
  {
    id: "B2",
    name: "Depok White Titans",
    played: 3,
    won: 2,
    lost: 1,
    pointsFor: 38,
    pointsAgainst: 26,
    diff: 12,
    points: 4,
  },
  {
    id: "B3",
    name: "Margonda Team",
    played: 3,
    won: 1,
    lost: 2,
    pointsFor: 24,
    pointsAgainst: 35,
    diff: -11,
    points: 2,
  },
  {
    id: "B4",
    name: "Cinere Club",
    played: 3,
    won: 0,
    lost: 3,
    pointsFor: 15,
    pointsAgainst: 42,
    diff: -27,
    points: 0,
  },
];

export default function BracketAndStandings() {
  const [activeTab, setActiveTab] = useState<"bracket" | "standings">(
    "bracket",
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER & NAVIGASI */}
        <header className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4">
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
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  PERGATSI Tournament Bracket System
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                Bagan Fase Gugur & Klasemen Pool
              </h1>
            </div>
          </div>

          {/* TOGGLE TAB: BAGAN VS KLASEMEN */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("bracket")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeTab === "bracket"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Bagan Gugur (Knockout Tree)</span>
            </button>
            <button
              onClick={() => setActiveTab("standings")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                activeTab === "standings"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Klasemen Pool</span>
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TAB 1: BAGAN FASE GUGUR DENGAN GARIS HUBUNG CABANG POHON */}
        {/* ======================================================== */}
        {activeTab === "bracket" && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl overflow-x-auto">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Skema Gugur Silang (Juara Pool vs Runner-Up)
                </h2>
                <p className="text-xs text-slate-400">
                  Sistem resmi: Juara Pool A bertemu Runner-Up Pool B di
                  perempat final.
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full font-bold">
                8 Besar ➔ Semifinal ➔ Final
              </span>
            </div>

            {/* CONTAINER BRACKET TREE */}
            <div className="min-w-[950px] grid grid-cols-4 gap-4 items-center relative py-4">
              {/* KOLOM 1: PEREMPAT FINAL (8 BESAR) */}
              <div className="space-y-8">
                <div className="text-center font-bold text-xs uppercase text-slate-400 font-mono tracking-wider mb-2">
                  Perempat Final (QF)
                </div>

                {/* Match QF 1 */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>1A. Depok Red Squad</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      15
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>2B. Depok White Titans</span>
                    <span className="font-mono text-slate-500">11</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right">
                    QF-1 Selesai
                  </span>
                </div>

                {/* Match QF 2 */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>1C. Bandung Juara</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      13
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>2D. Bekasi Patriot</span>
                    <span className="font-mono text-slate-500">12</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right">
                    QF-2 Selesai
                  </span>
                </div>

                {/* Match QF 3 */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>1B. Bogor Raya GC</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      14
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>2A. Cilodong Gateball</span>
                    <span className="font-mono text-slate-500">10</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right">
                    QF-3 Selesai
                  </span>
                </div>

                {/* Match QF 4 */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>1D. Sukabumi Prima</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      16
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>2C. Cimahi Sejahtera</span>
                    <span className="font-mono text-slate-500">9</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block text-right">
                    QF-4 Selesai
                  </span>
                </div>
              </div>

              {/* KOLOM 2: SEMIFINAL (4 BESAR) */}
              <div className="space-y-36">
                <div className="text-center font-bold text-xs uppercase text-slate-400 font-mono tracking-wider mb-2">
                  Semifinal (SF)
                </div>

                {/* Match SF 1 */}
                <div className="bg-slate-950 border-2 border-indigo-900/60 rounded-2xl p-3.5 shadow-xl space-y-1.5 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>Depok Red Squad</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      14
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>Bandung Juara</span>
                    <span className="font-mono text-slate-500">12</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 block text-right font-bold">
                    Lolos ke Final
                  </span>
                </div>

                {/* Match SF 2 */}
                <div className="bg-slate-950 border-2 border-indigo-900/60 rounded-2xl p-3.5 shadow-xl space-y-1.5 relative">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40">
                    <span>Bogor Raya GC</span>
                    <span className="font-mono text-white bg-emerald-700 px-1.5 py-0.2 rounded">
                      15
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg text-slate-400 font-medium">
                    <span>Sukabumi Prima</span>
                    <span className="font-mono text-slate-500">13</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 block text-right font-bold">
                    Lolos ke Final
                  </span>
                </div>
              </div>

              {/* KOLOM 3: GRAND FINAL */}
              <div className="space-y-6">
                <div className="text-center font-bold text-xs uppercase text-amber-400 font-mono tracking-wider mb-2">
                  Grand Final
                </div>

                <div className="bg-gradient-to-b from-amber-950/40 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-5 shadow-2xl space-y-3 relative">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-xs tracking-wider uppercase">
                    <Trophy className="w-4 h-4" />
                    <span>Perebutan Juara 1</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm p-2 rounded-xl bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
                      <span>Depok Red Squad</span>
                      <span className="font-mono text-black bg-amber-400 px-2 py-0.5 rounded-lg text-xs font-black">
                        14
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm p-2 rounded-xl text-slate-300 font-semibold bg-slate-900/80">
                      <span>Bogor Raya GC</span>
                      <span className="font-mono text-slate-400 text-xs">
                        13
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-1 border-t border-amber-500/20 text-[11px] text-amber-300/80 font-bold">
                    Pertandingan Berakhir
                  </div>
                </div>
              </div>

              {/* KOLOM 4: PODIUM JUARA */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-center font-bold text-xs uppercase text-yellow-400 font-mono tracking-wider mb-4">
                  Podium Juara
                </div>

                <div className="w-full bg-slate-950 border-2 border-yellow-400/80 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden group">
                  <div className="w-16 h-16 mx-auto rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center mb-3 shadow-lg">
                    <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                  </div>
                  <span className="text-[11px] uppercase tracking-widest text-yellow-400 font-black block">
                    CHAMPION / JUARA 1
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Depok Red Squad
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Pengcab PERGATSI Depok
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between px-2">
                    <span className="text-slate-500">Runner-up:</span>
                    <span className="font-bold text-slate-200">
                      Bogor Raya GC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TABEL KLASEMEN POOL LENGKAP                       */}
        {/* ======================================================== */}
        {activeTab === "standings" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* POOL A */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  Klasemen Pool A
                </h3>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  2 Tim Teratas Lolos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <th className="py-2 px-2">Pos</th>
                      <th className="py-2 px-2">Tim</th>
                      <th className="py-2 px-1 text-center">M</th>
                      <th className="py-2 px-1 text-center">W</th>
                      <th className="py-2 px-1 text-center">L</th>
                      <th className="py-2 px-1 text-center">+/-</th>
                      <th className="py-2 px-2 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {poolAData.map((team, idx) => (
                      <tr
                        key={team.id}
                        className={idx < 2 ? "bg-emerald-950/20 font-bold" : ""}
                      >
                        <td className="py-2.5 px-2">
                          <span
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                              idx === 0
                                ? "bg-yellow-400 text-black font-black"
                                : idx === 1
                                  ? "bg-slate-300 text-black font-bold"
                                  : "text-slate-500"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-slate-200">
                          {team.name}
                          {idx === 0 && (
                            <span className="ml-1.5 text-[10px] text-yellow-400">
                              (Juara Pool)
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="ml-1.5 text-[10px] text-emerald-400">
                              (Runner-up)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400">
                          {team.played}
                        </td>
                        <td className="py-2.5 px-1 text-center text-emerald-400">
                          {team.won}
                        </td>
                        <td className="py-2.5 px-1 text-center text-red-400">
                          {team.lost}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-300">
                          {team.diff > 0 ? `+${team.diff}` : team.diff}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-white">
                          {team.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* POOL B */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  Klasemen Pool B
                </h3>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  2 Tim Teratas Lolos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                      <th className="py-2 px-2">Pos</th>
                      <th className="py-2 px-2">Tim</th>
                      <th className="py-2 px-1 text-center">M</th>
                      <th className="py-2 px-1 text-center">W</th>
                      <th className="py-2 px-1 text-center">L</th>
                      <th className="py-2 px-1 text-center">+/-</th>
                      <th className="py-2 px-2 text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {poolBData.map((team, idx) => (
                      <tr
                        key={team.id}
                        className={idx < 2 ? "bg-emerald-950/20 font-bold" : ""}
                      >
                        <td className="py-2.5 px-2">
                          <span
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                              idx === 0
                                ? "bg-yellow-400 text-black font-black"
                                : idx === 1
                                  ? "bg-slate-300 text-black font-bold"
                                  : "text-slate-500"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-slate-200">
                          {team.name}
                          {idx === 0 && (
                            <span className="ml-1.5 text-[10px] text-yellow-400">
                              (Juara Pool)
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="ml-1.5 text-[10px] text-emerald-400">
                              (Runner-up)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-400">
                          {team.played}
                        </td>
                        <td className="py-2.5 px-1 text-center text-emerald-400">
                          {team.won}
                        </td>
                        <td className="py-2.5 px-1 text-center text-red-400">
                          {team.lost}
                        </td>
                        <td className="py-2.5 px-1 text-center text-slate-300">
                          {team.diff > 0 ? `+${team.diff}` : team.diff}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-white">
                          {team.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
