"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  GitBranch,
  Table,
  ArrowLeft,
  Shield,
  RefreshCw,
  Clock,
} from "lucide-react";

interface TeamItem {
  id: string;
  name: string;
  city: string;
}

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

interface TeamStanding {
  id: string;
  name: string;
  city: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  diff: number;
}

export default function DynamicBracketAndStandings() {
  const [activeTab, setActiveTab] = useState<"bracket" | "standings">(
    "bracket",
  );
  const [tournamentName, setTournamentName] = useState(
    "Kejuaraan Gateball PERGATSI Open 2026",
  );
  const [poolCount, setPoolCount] = useState<number>(4);
  const [pools, setPools] = useState<{ [key: string]: TeamItem[] }>({});
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);

  // 1. Tarik Data dari Memori Turnamen
  const loadData = () => {
    const raw = localStorage.getItem("pergatsi_tournament_data");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.tournamentName) setTournamentName(parsed.tournamentName);
        if (parsed.poolCount) setPoolCount(parsed.poolCount);
        if (parsed.pools) setPools(parsed.pools);
        if (parsed.matches) setMatches(parsed.matches);
      } catch (err) {
        console.error("Gagal load data", err);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. HITUNG KLASEMEN SECARA REAL DARI HASIL PERTANDINGAN (DIMULAI DARI 0!)
  const calculatePoolStandings = (
    poolName: string,
    teams: TeamItem[],
  ): TeamStanding[] => {
    return teams
      .map((team) => {
        // Cari pertandingan selesai yang melibatkan tim ini di pool yang sesuai
        const finishedMatches = matches.filter(
          (m) =>
            m.status === "finished" &&
            m.pool === poolName &&
            m.redScore !== null &&
            m.whiteScore !== null &&
            (m.redTeam === team.name || m.whiteTeam === team.name),
        );

        let played = 0;
        let won = 0;
        let lost = 0;
        let diff = 0;

        finishedMatches.forEach((m) => {
          played += 1;
          const isRed = m.redTeam === team.name;
          const myScore = isRed ? m.redScore! : m.whiteScore!;
          const oppScore = isRed ? m.whiteScore! : m.redScore!;

          diff += myScore - oppScore;
          if (myScore > oppScore) {
            won += 1;
          } else {
            lost += 1;
          }
        });

        const points = won * 2; // Standar PERGATSI: Menang = 2 Poin, Kalah = 0 Poin

        return {
          id: team.id,
          name: team.name,
          city: team.city,
          played,
          won,
          lost,
          diff,
          points,
        };
      })
      .sort((a, b) => b.points - a.points || b.diff - a.diff); // Urutkan berdasarkan Poin tertinggi, lalu Selisih Skor
  };

  // Helper mendapatkan Juara dan Runner-up murni dari hasil klasemen
  const getRankedTeam = (poolLetter: string, rankIndex: number) => {
    const poolKey = `Pool ${poolLetter}`;
    const teamsInPool = pools[poolKey] || [];
    if (teamsInPool.length === 0) {
      return rankIndex === 0
        ? `Juara Pool ${poolLetter}`
        : `Runner-up Pool ${poolLetter}`;
    }

    const standings = calculatePoolStandings(poolKey, teamsInPool);
    const candidate = standings[rankIndex];

    // Jika tim belum pernah main sama sekali, tampilkan keterangan "Menunggu Laga Selesai"
    if (!candidate || candidate.played === 0) {
      return `${rankIndex === 0 ? "1" : "2"}${poolLetter}. ${candidate?.name || "Menunggu"} (0 Main)`;
    }

    return `${rankIndex === 0 ? "Juara" : "R-Up"} ${poolLetter}: ${candidate.name}`;
  };

  const isSmallFormat = poolCount <= 2;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER UTAMA */}
        <header className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/schedule"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Buka Jadwal Pertandingan"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  PERGATSI Official Live Standings & Bracket
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                {tournamentName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

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
                <span>Bagan Gugur Silang</span>
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
                <span>Klasemen Pool (Live Murni)</span>
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TAB 1: BAGAN GUGUR DENGAN STATUS REALISTIS (TIDAK ADA SKOR FAKE) */}
        {/* ======================================================== */}
        {activeTab === "bracket" && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl overflow-x-auto">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Skema Gugur Silang (Juara Pool vs Runner-Up)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Slot bagan otomatis terisi oleh Juara & Runner-Up begitu laga
                  pool di jadwal selesai.
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-full font-bold">
                {isSmallFormat
                  ? "SEMIFINAL SILANG ➔ GRAND FINAL"
                  : "PEREMPAT FINAL (8 BESAR) ➔ SEMIFINAL ➔ GRAND FINAL"}
              </span>
            </div>

            {/* FORMAT 16 TIM (4 POOL ➔ 8 BESAR) */}
            {!isSmallFormat ? (
              <div className="min-w-[1100px] flex items-center justify-between py-6 relative">
                {/* KOLOM QF */}
                <div className="w-64 space-y-10 z-10">
                  <div className="text-center font-bold text-xs uppercase text-slate-400 font-mono tracking-wider">
                    Perempat Final (8 Besar)
                  </div>

                  {/* QF 1 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      PARTAI QF-1
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-200 font-bold border border-slate-800">
                      <span className="truncate">{getRankedTeam("A", 0)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400 font-medium">
                      <span className="truncate">{getRankedTeam("B", 1)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                  </div>

                  {/* QF 2 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      PARTAI QF-2
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-200 font-bold border border-slate-800">
                      <span className="truncate">{getRankedTeam("C", 0)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400 font-medium">
                      <span className="truncate">{getRankedTeam("D", 1)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                  </div>

                  {/* QF 3 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      PARTAI QF-3
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-200 font-bold border border-slate-800">
                      <span className="truncate">{getRankedTeam("B", 0)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400 font-medium">
                      <span className="truncate">{getRankedTeam("A", 1)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                  </div>

                  {/* QF 4 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      PARTAI QF-4
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-200 font-bold border border-slate-800">
                      <span className="truncate">{getRankedTeam("D", 0)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400 font-medium">
                      <span className="truncate">{getRankedTeam("C", 1)}</span>
                      <span className="font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        -
                      </span>
                    </div>
                  </div>
                </div>

                {/* GARIS HUBUNG SVG NYATA */}
                <svg className="w-14 h-[560px] stroke-indigo-500/70 stroke-2 fill-none overflow-visible">
                  <path d="M 0 75 H 28 V 205 H 56" />
                  <path d="M 0 205 H 28" />
                  <path d="M 0 355 H 28 V 485 H 56" />
                  <path d="M 0 485 H 28" />
                </svg>

                {/* KOLOM SEMIFINAL */}
                <div className="w-64 space-y-48 z-10">
                  <div className="text-center font-bold text-xs uppercase text-slate-400 font-mono tracking-wider">
                    Semifinal
                  </div>

                  {/* SF 1 */}
                  <div className="bg-slate-950 border-2 border-indigo-900/40 rounded-2xl p-3.5 shadow-xl space-y-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      SEMIFINAL 1
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400">
                      <span>Pemenang QF-1</span>
                      <span className="font-mono text-slate-600">-</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400">
                      <span>Pemenang QF-2</span>
                      <span className="font-mono text-slate-600">-</span>
                    </div>
                  </div>

                  {/* SF 2 */}
                  <div className="bg-slate-950 border-2 border-indigo-900/40 rounded-2xl p-3.5 shadow-xl space-y-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                      SEMIFINAL 2
                    </span>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400">
                      <span>Pemenang QF-3</span>
                      <span className="font-mono text-slate-600">-</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 text-slate-400">
                      <span>Pemenang QF-4</span>
                      <span className="font-mono text-slate-600">-</span>
                    </div>
                  </div>
                </div>

                <svg className="w-14 h-[560px] stroke-amber-500/70 stroke-2 fill-none overflow-visible">
                  <path d="M 0 140 H 28 V 420 H 0" />
                  <path d="M 28 280 H 56" />
                </svg>

                {/* KOLOM GRAND FINAL */}
                <div className="w-64 space-y-6 z-10">
                  <div className="text-center font-bold text-xs uppercase text-amber-400 font-mono tracking-wider">
                    Grand Final
                  </div>

                  <div className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase">
                      <Trophy className="w-4 h-4" /> Perebutan Juara 1
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                        <span>Pemenang SF-1</span>
                        <span className="font-mono text-slate-600">-</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                        <span>Pemenang SF-2</span>
                        <span className="font-mono text-slate-600">-</span>
                      </div>
                    </div>

                    <div className="text-center pt-2 border-t border-slate-800 text-[10px] text-amber-300/60 font-bold">
                      Menunggu Partai Semifinal
                    </div>
                  </div>
                </div>

                <div className="w-10 h-[2px] bg-slate-700" />

                {/* PODIUM JUARA (AWALNYA KOSONG!) */}
                <div className="w-60 z-10">
                  <div className="text-center font-bold text-xs uppercase text-yellow-400 font-mono tracking-wider mb-2">
                    Podium Juara
                  </div>
                  <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-5 text-center shadow-2xl">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-2 shadow">
                      <Trophy className="w-7 h-7 text-slate-600" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black block">
                      JUARA 1 TURNAMEN
                    </span>
                    <h3 className="text-xs font-bold text-slate-400 mt-2 italic">
                      Menunggu Grand Final Selesai
                    </h3>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: KLASEMEN POOL LIVE (DIMULAI DARI 0 SEMUA!)         */}
        {/* ======================================================== */}
        {activeTab === "standings" && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(pools).length === 0 ? (
              <div className="col-span-3 text-center py-12 bg-slate-900 rounded-3xl border border-slate-800 text-slate-500">
                Belum ada tim yang dikocok. Buka menu Setup Turnamen terlebih
                dahulu.
              </div>
            ) : (
              Object.entries(pools).map(([poolName, poolTeams]) => {
                const liveStandings = calculatePoolStandings(
                  poolName,
                  poolTeams,
                );

                return (
                  <div
                    key={poolName}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h3 className="font-black text-white text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        Klasemen {poolName}
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        2 Teratas Lolos
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-medium">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                            <th className="py-2 px-1">Pos</th>
                            <th className="py-2 px-2">Tim</th>
                            <th className="py-2 px-1 text-center">M</th>
                            <th className="py-2 px-1 text-center">W</th>
                            <th className="py-2 px-1 text-center">L</th>
                            <th className="py-2 px-1 text-center">+/-</th>
                            <th className="py-2 px-1 text-right">Poin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {liveStandings.map((team, idx) => (
                            <tr
                              key={team.id}
                              className={
                                idx < 2 && team.played > 0
                                  ? "bg-emerald-950/20 font-bold"
                                  : ""
                              }
                            >
                              <td className="py-2.5 px-1">
                                <span
                                  className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                                    team.played > 0 && idx === 0
                                      ? "bg-yellow-400 text-black font-black"
                                      : team.played > 0 && idx === 1
                                        ? "bg-slate-300 text-black font-bold"
                                        : "text-slate-500"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 font-sans text-slate-200 truncate max-w-[130px]">
                                {team.name}
                                {team.played > 0 && idx === 0 && (
                                  <span className="ml-1 text-[9px] text-yellow-400 font-bold">
                                    (Juara)
                                  </span>
                                )}
                                {team.played > 0 && idx === 1 && (
                                  <span className="ml-1 text-[9px] text-emerald-400 font-bold">
                                    (R-Up)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-1 text-center text-slate-300">
                                {team.played}
                              </td>
                              <td className="py-2.5 px-1 text-center text-emerald-400">
                                {team.won}
                              </td>
                              <td className="py-2.5 px-1 text-center text-red-400">
                                {team.lost}
                              </td>
                              <td className="py-2.5 px-1 text-center text-slate-400">
                                {team.diff > 0 ? `+${team.diff}` : team.diff}
                              </td>
                              <td className="py-2.5 px-1 text-right font-black text-white">
                                {team.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>
    </main>
  );
}
