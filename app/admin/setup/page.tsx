"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Plus,
  Trash2,
  Shuffle,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Layers,
  ArrowRight,
  AlertTriangle,
  Calculator,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TeamItem {
  id: string;
  name: string;
  city: string;
}

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

const cities = [
  "Kota Depok",
  "Kota Bogor",
  "Kab. Bogor",
  "Kota Bandung",
  "Kota Bekasi",
  "Kota Sukabumi",
  "Kota Cimahi",
  "Kab. Cianjur",
];

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

export default function TournamentSetup() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1. Data Info Turnamen & Hadiah
  const [tournamentName, setTournamentName] = useState(
    "Kejuaraan Gateball PERGATSI 8 Tim 2026",
  );
  const [venue, setVenue] = useState("Stadion Mahakam, Depok");
  const [startDate, setStartDate] = useState("2026-10-15");
  const [courtCount, setCourtCount] = useState(4);

  // Anggaran Hadiah
  const [totalBudget, setTotalBudget] = useState<number>(20000000);
  const [prize1Amount, setPrize1Amount] = useState<number>(10000000);
  const [prize2Amount, setPrize2Amount] = useState<number>(6000000);
  const [prize3Amount, setPrize3Amount] = useState<number>(4000000);
  const [prize1Note, setPrize1Note] = useState("Piala Bergilir + Medali Emas");
  const [prize2Note, setPrize2Note] = useState("Piala Tetap + Medali Perak");
  const [prize3Note, setPrize3Note] = useState("Piala Tetap + Medali Perunggu");

  // 2. Data Tim & Konfigurasi Slot
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [customSlotInput, setCustomSlotInput] = useState<number>(8);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCity, setNewTeamCity] = useState("");

  // 3. Konfigurasi Pool & Undian
  const [poolCount, setPoolCount] = useState<number>(2);
  const [pools, setPools] = useState<{ [key: string]: TeamItem[] }>({});
  const [isShuffling, setIsShuffling] = useState(false);

  // Generator Slot Tim Otomatis
  const generateTeamsBatch = (count: number) => {
    const batch: TeamItem[] = [];
    for (let i = 1; i <= count; i++) {
      const city = cities[(i - 1) % cities.length];
      batch.push({
        id: `T-${i}-${Date.now()}`,
        name: `Klub Gateball ${i < 10 ? "0" + i : i}`,
        city: city,
      });
    }
    setTeams(batch);
    const recommended = count <= 8 ? 2 : Math.max(2, Math.ceil(count / 4));
    setPoolCount(recommended);
  };

  // 1. FUNGSI SAKTI: RESET & BUAT TURNAMEN BARU DARI NOL
  const handleHardResetTournament = async (targetCount = 8) => {
    if (
      !confirm(
        `Yakin ingin menyapu bersih data lama dan membuat turnamen baru ${targetCount} Tim?`,
      )
    ) {
      return;
    }

    // Bersihkan storage browser
    localStorage.removeItem("pergatsi_tournament_data");

    // Siapkan data 8 tim bersih
    const newTournamentName = `Kejuaraan Gateball PERGATSI ${targetCount} Tim 2026`;
    setTournamentName(newTournamentName);
    setTotalBudget(20000000);
    setPrize1Amount(10000000);
    setPrize2Amount(6000000);
    setPrize3Amount(4000000);

    const freshTeams: TeamItem[] = [];
    for (let i = 1; i <= targetCount; i++) {
      freshTeams.push({
        id: `T-${i}-${Date.now()}`,
        name: `Klub Gateball ${i < 10 ? "0" + i : i}`,
        city: cities[(i - 1) % cities.length],
      });
    }
    setTeams(freshTeams);

    // Otomatis bagi ke 2 pool
    const targetPoolCount = targetCount <= 8 ? 2 : 4;
    setPoolCount(targetPoolCount);

    const freshPools: { [key: string]: TeamItem[] } = {
      "Pool A": freshTeams.slice(0, 4),
      "Pool B": freshTeams.slice(4, 8),
    };
    setPools(freshPools);

    // Buat jadwal baru yang bersih (semua skor kosong / belum mulai)
    const freshMatches = buildScheduleFromPools(freshPools, 4);

    // Simpan ke storage
    const newPayload = {
      tournamentName: newTournamentName,
      venue: "Stadion Mahakam, Depok",
      startDate: "2026-10-15",
      courtCount: 4,
      totalBudget: 20000000,
      prizes: {
        j1: { amount: 10000000, note: "Piala Bergilir + Emas" },
        j2: { amount: 6000000, note: "Medali Perak" },
        j3: { amount: 4000000, note: "Medali Perunggu" },
      },
      teams: freshTeams,
      pools: freshPools,
      poolCount: targetPoolCount,
      matches: freshMatches,
    };
    localStorage.setItem(
      "pergatsi_tournament_data",
      JSON.stringify(newPayload),
    );

    // Reset Supabase Cloud (Papan Wasit & TV) langsung ke Match 1 turnamen baru
    try {
      const { data } = await supabase
        .from("matches")
        .select("id")
        .limit(1)
        .single();
      if (data && freshMatches[0]) {
        await supabase
          .from("matches")
          .update({
            field_name: `${freshMatches[0].field} — ${freshMatches[0].pool}`,
            red_team_name: freshMatches[0].redTeam,
            white_team_name: freshMatches[0].whiteTeam,
            red_score: 0,
            white_score: 0,
            seconds_left: 1800,
            is_timer_running: false,
            active_ball_number: 1,
            balls_data: initialBalls,
            logs: [
              `Turnamen Baru Direset: ${freshMatches[0].redTeam} vs ${freshMatches[0].whiteTeam}`,
            ],
          })
          .eq("id", data.id);
      }
    } catch (e) {
      console.error("Gagal reset supabase", e);
    }

    setCurrentStep(2);
    alert(`Turnamen baru ${targetCount} Tim berhasil dibuat bersih dari nol!`);
  };

  // Helper penyusun jadwal simultan
  const buildScheduleFromPools = (
    currentPools: { [key: string]: TeamItem[] },
    courts = 4,
  ): ScheduleMatch[] => {
    const list: ScheduleMatch[] = [];
    const poolMatches: { pool: string; red: string; white: string }[] = [];

    Object.entries(currentPools).forEach(([pName, pTeams]) => {
      const n = pTeams.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          poolMatches.push({
            pool: pName,
            red: pTeams[i].name,
            white: pTeams[j].name,
          });
        }
      }
    });

    let counter = 1;
    poolMatches.forEach((m, idx) => {
      const session = Math.floor(idx / courts);
      const courtNum = (idx % courts) + 1;
      const totalMins = session * 40;
      const hour = 8 + Math.floor(totalMins / 60);
      const min = totalMins % 60;
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")} WIB`;

      list.push({
        id: `M-${counter}`,
        matchNumber: counter,
        sessionNumber: session + 1,
        time,
        field: `Lapangan ${courtNum}`,
        category: "Beregu Campuran",
        pool: m.pool,
        redTeam: m.red,
        whiteTeam: m.white,
        redScore: null,
        whiteScore: null,
        status: "upcoming",
      });
      counter++;
    });

    // Tambah Semifinal Silang & Final
    const lastSession = Math.ceil(poolMatches.length / courts);
    list.push(
      {
        id: `M-${counter}`,
        matchNumber: counter++,
        sessionNumber: lastSession + 1,
        time: "14:00 WIB",
        field: "Lapangan 1",
        category: "Beregu Campuran",
        pool: "Semifinal Silang 1",
        redTeam: "Juara Pool A",
        whiteTeam: "Runner-up Pool B",
        redScore: null,
        whiteScore: null,
        status: "upcoming",
      },
      {
        id: `M-${counter}`,
        matchNumber: counter++,
        sessionNumber: lastSession + 1,
        time: "14:00 WIB",
        field: "Lapangan 2",
        category: "Beregu Campuran",
        pool: "Semifinal Silang 2",
        redTeam: "Juara Pool B",
        whiteTeam: "Runner-up Pool A",
        redScore: null,
        whiteScore: null,
        status: "upcoming",
      },
      {
        id: `M-${counter}`,
        matchNumber: counter++,
        sessionNumber: lastSession + 2,
        time: "15:00 WIB",
        field: "Lapangan 1",
        category: "Beregu Campuran",
        pool: "🏆 GRAND FINAL",
        redTeam: "Pemenang SF-1",
        whiteTeam: "Pemenang SF-2",
        redScore: null,
        whiteScore: null,
        status: "upcoming",
      },
    );

    return list;
  };

  // Muat data saat pertama kali buka
  useEffect(() => {
    const raw = localStorage.getItem("pergatsi_tournament_data");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.tournamentName) setTournamentName(parsed.tournamentName);
        if (parsed.teams && parsed.teams.length > 0) setTeams(parsed.teams);
        if (parsed.pools) setPools(parsed.pools);
        if (parsed.poolCount) setPoolCount(parsed.poolCount);
      } catch (e) {
        console.error(e);
      }
    } else {
      generateTeamsBatch(8);
    }
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const allocatedBudget = prize1Amount + prize2Amount + prize3Amount;
  const budgetDifference = totalBudget - allocatedBudget;

  const handleAutoDistribute = () => {
    const j1 = Math.round(totalBudget * 0.5);
    const j2 = Math.round(totalBudget * 0.3);
    const j3 = totalBudget - j1 - j2;
    setPrize1Amount(j1);
    setPrize2Amount(j2);
    setPrize3Amount(j3);
  };

  const handleShufflePools = () => {
    if (teams.length < poolCount * 2) {
      alert(`Minimal daftarkan ${poolCount * 2} tim untuk ${poolCount} pool!`);
      return;
    }

    setIsShuffling(true);

    setTimeout(() => {
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const generatedPools: { [key: string]: TeamItem[] } = {};

      for (let i = 0; i < poolCount; i++) {
        const letter = String.fromCharCode(65 + i);
        generatedPools[`Pool ${letter}`] = [];
      }

      const poolKeys = Object.keys(generatedPools);
      shuffled.forEach((team, index) => {
        const target = poolKeys[index % poolKeys.length];
        generatedPools[target].push(team);
      });

      setPools(generatedPools);
      setIsShuffling(false);

      // Sekaligus susun jadwal baru yang sinkron dan simpan
      const freshMatches = buildScheduleFromPools(generatedPools, courtCount);

      const payload = {
        tournamentName,
        venue,
        startDate,
        courtCount,
        totalBudget,
        prizes: {
          j1: { amount: prize1Amount, note: prize1Note },
          j2: { amount: prize2Amount, note: prize2Note },
          j3: { amount: prize3Amount, note: prize3Note },
        },
        teams,
        pools: generatedPools,
        poolCount,
        matches: freshMatches,
      };
      localStorage.setItem("pergatsi_tournament_data", JSON.stringify(payload));
    }, 600);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER UTAMA */}
        <header className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  PERGATSI Tournament Builder
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
                Setup Turnamen & Mesin Undian
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* TOMBOL MERAH SAKTI RESET TOTAL */}
            <button
              onClick={() => handleHardResetTournament(8)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition active:scale-95"
              title="Hapus data turnamen lama dan mulai turnamen 8 tim baru dari nol"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Turnamen (8 Tim Baru)</span>
            </button>

            {/* STEPPER */}
            <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  currentStep === 1
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1. Info & Hadiah
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  currentStep === 2
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2. Slot Tim ({teams.length})
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  currentStep === 3
                    ? "bg-amber-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                3. Undian ({poolCount} Pool)
              </button>
            </div>
          </div>
        </header>

        {/* STEP 1: INFO & KALKULASI ANGGARAN */}
        {currentStep === 1 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Informasi Resmi Turnamen & Hadiah
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nama Resmi Turnamen
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Lokasi /
                  Venue Lapangan
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Tanggal
                  Pelaksanaan
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Jumlah Lapangan Aktif
                </label>
                <select
                  value={courtCount}
                  onChange={(e) => setCourtCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>2 Lapangan</option>
                  <option value={4}>4 Lapangan (Standar Simultan)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Total Anggaran Hadiah
                    (Rp)
                  </label>
                  <span className="text-[11px] font-mono text-amber-300 font-bold">
                    {formatRupiah(totalBudget)}
                  </span>
                </div>
                <input
                  type="number"
                  step="500000"
                  value={totalBudget || ""}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2.5 text-sm text-amber-300 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* KALKULATOR DISTRIBUSI */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                    Kalkulator Pembagian Hadiah
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Bagi Otomatis (50% - 30% - 20%)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Total Anggaran:
                  </span>
                  <span className="font-bold text-white text-sm">
                    {formatRupiah(totalBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Total Dialokasikan:
                  </span>
                  <span className="font-bold text-indigo-300 text-sm">
                    {formatRupiah(allocatedBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Status Dana:
                  </span>
                  {budgetDifference === 0 ? (
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PAS (100%)
                    </span>
                  ) : (
                    <span className="font-bold text-amber-400">
                      Sisa: {formatRupiah(budgetDifference)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-yellow-500/50 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-yellow-400 uppercase">
                    🥇 Juara 1
                  </span>
                  <input
                    type="number"
                    value={prize1Amount || ""}
                    onChange={(e) => setPrize1Amount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[11px] text-yellow-300 font-mono block">
                    {formatRupiah(prize1Amount)}
                  </span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-500/50 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-slate-300 uppercase">
                    🥈 Juara 2
                  </span>
                  <input
                    type="number"
                    value={prize2Amount || ""}
                    onChange={(e) => setPrize2Amount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-300 font-mono block">
                    {formatRupiah(prize2Amount)}
                  </span>
                </div>

                <div className="p-4 bg-slate-900 border border-amber-700/50 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-amber-500 uppercase">
                    🥉 Juara 3
                  </span>
                  <input
                    type="number"
                    value={prize3Amount || ""}
                    onChange={(e) => setPrize3Amount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[11px] text-amber-400 font-mono block">
                    {formatRupiah(prize3Amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition"
              >
                Lanjut: Atur Slot Tim Peserta <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: SLOT TIM PESERTA */}
        {currentStep === 2 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Daftar Tim Peserta ({teams.length} Tim Terdaftar)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Format 8 tim standar PERGATSI siap untuk dibagi ke Pool A dan
                  Pool B.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => generateTeamsBatch(8)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    teams.length === 8
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  8 Tim (2 Pool)
                </button>
                <button
                  type="button"
                  onClick={() => generateTeamsBatch(16)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    teams.length === 16
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  16 Tim (4 Pool)
                </button>
              </div>
            </div>

            {/* LIST DAFTAR TIM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px] font-black flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {team.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {team.city}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Kembali ke Info
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                Lanjut: Undian 2 Pool <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: KOCOK UNDIAN POOL */}
        {currentStep === 3 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-amber-400" />
                Drawing Undian ({teams.length} Tim ke {poolCount} Pool)
              </h2>
            </div>

            <div className="text-center py-6 bg-slate-950 rounded-3xl border border-indigo-900/50 p-6 space-y-3">
              <button
                disabled={isShuffling}
                onClick={handleShufflePools}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-base shadow-2xl transition transform active:scale-95 flex items-center gap-3 mx-auto"
              >
                <Shuffle
                  className={`w-5 h-5 ${isShuffling ? "animate-spin" : ""}`}
                />
                <span>
                  {isShuffling
                    ? "MENGACAK UNDIAN..."
                    : `🎲 KOCOK ${teams.length} TIM KE ${poolCount} POOL`}
                </span>
              </button>
            </div>

            {/* HASIL DRAWING */}
            {Object.keys(pools).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {Object.entries(pools).map(([poolName, poolTeams], pIdx) => (
                  <div
                    key={poolName}
                    className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-black text-white text-sm flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${pIdx === 0 ? "bg-red-500" : "bg-blue-500"}`}
                        />
                        {poolName}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-bold">
                        {poolTeams.length} Tim
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {poolTeams.map((t, idx) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 bg-slate-900/80 border border-slate-800 rounded-xl"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {t.name}
                            </span>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(pools).length > 0 && (
              <div className="flex flex-wrap items-center justify-between pt-6 border-t border-slate-800 gap-3">
                <button
                  onClick={handleShufflePools}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Kocok Ulang (Re-Draw)
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href="/schedule"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xl transition"
                  >
                    <span>Kunci & Buka Jadwal Tanding Baru</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
