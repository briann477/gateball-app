"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Trophy,
  Users,
  Tv,
  MonitorPlay,
  Trash2,
  CheckCircle2,
  RefreshCw,
  GitBranch,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MatchItem {
  id: string;
  field_name: string;
  red_team_name: string;
  white_team_name: string;
  red_score: number;
  white_score: number;
  seconds_left: number;
  is_timer_running: boolean;
  updated_at: string;
}

const defaultBalls = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  color: (i + 1) % 2 !== 0 ? "red" : "white",
  gate1: false,
  gate2: false,
  gate3: false,
  agari: false,
  isOut: false,
  score: 0,
}));

export default function AdminDashboard() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Input Pertandingan Baru
  const [fieldName, setFieldName] = useState("Lapangan 1");
  const [redTeamName, setRedTeamName] = useState("");
  const [whiteTeamName, setWhiteTeamName] = useState("");
  const [poolName, setPoolName] = useState("Pool A");

  // Ambil seluruh daftar pertandingan dari Supabase
  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data && !error) {
      setMatches(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Handler Tambah Pertandingan Baru
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redTeamName.trim() || !whiteTeamName.trim()) {
      alert("Harap isi nama kedua tim!");
      return;
    }

    const { error } = await supabase.from("matches").insert([
      {
        field_name: `${fieldName} (${poolName})`,
        red_team_name: redTeamName.trim(),
        white_team_name: whiteTeamName.trim(),
        red_score: 0,
        white_score: 0,
        seconds_left: 1800,
        is_timer_running: false,
        active_ball_number: 1,
        balls_data: defaultBalls,
        logs: [],
      },
    ]);

    if (!error) {
      setRedTeamName("");
      setWhiteTeamName("");
      fetchMatches();
      alert("Pertandingan baru berhasil dijadwalkan!");
    } else {
      alert(`Gagal menambah pertandingan: ${error.message}`);
    }
  };

  // Handler Hapus Pertandingan
  const handleDeleteMatch = async (id: string) => {
    if (confirm("Yakin ingin menghapus data pertandingan ini?")) {
      await supabase.from("matches").delete().eq("id", id);
      fetchMatches();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER & NAVIGASI CEPAT */}
        <header className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                PERGATSI Tournament Management
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Dashboard Panitia Pelaksana
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Buka Wasit Meja</span>
            </Link>

            <Link
              href="/scoreboard"
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Buka Layar TV</span>
            </Link>

            <Link
              href="/bracket"
              target="_blank"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
            >
              <GitBranch className="w-4 h-4" />
              <span>Bagan Gugur & Pool</span>
            </Link>
          </div>
        </header>

        {/* FORM TAMBAH JADWAL PERTANDINGAN */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Jadwalkan Pertandingan Baru
            </h2>
          </div>

          <form
            onSubmit={handleCreateMatch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                Pilih Lapangan
              </label>
              <select
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Lapangan 1">Lapangan 1</option>
                <option value="Lapangan 2">Lapangan 2</option>
                <option value="Lapangan 3">Lapangan 3</option>
                <option value="Lapangan 4">Lapangan 4</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                Kategori / Babak
              </label>
              <select
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Pool A">Penyisihan Pool A</option>
                <option value="Pool B">Penyisihan Pool B</option>
                <option value="Pool C">Penyisihan Pool C</option>
                <option value="Pool D">Penyisihan Pool D</option>
                <option value="Perempat Final">Perempat Final</option>
                <option value="Semifinal">Semifinal</option>
                <option value="Final">Babak Final</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-red-400 uppercase block mb-1.5">
                Nama Tim Merah (Ganjil)
              </label>
              <input
                type="text"
                placeholder="Contoh: Depok Red Squad"
                value={redTeamName}
                onChange={(e) => setRedTeamName(e.target.value)}
                className="w-full bg-slate-950 border border-red-900/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                Nama Tim Putih (Genap)
              </label>
              <input
                type="text"
                placeholder="Contoh: Depok White Titans"
                value={whiteTeamName}
                onChange={(e) => setWhiteTeamName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition active:scale-95 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Jadwal Pertandingan</span>
              </button>
            </div>
          </form>
        </section>

        {/* DAFTAR PERTANDINGAN AKTIF & RIWAYAT */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Daftar Semua Pertandingan
              </h2>
            </div>

            <button
              onClick={fetchMatches}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 font-mono text-xs text-slate-500">
              Mengambil daftar pertandingan...
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Belum ada pertandingan dijadwalkan. Tambah jadwal baru lewat
              formulir di atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-mono">
                    <th className="py-3 px-4">Lapangan & Babak</th>
                    <th className="py-3 px-4 text-red-400">Tim Merah</th>
                    <th className="py-3 px-4 text-center">Skor</th>
                    <th className="py-3 px-4 text-slate-300">Tim Putih</th>
                    <th className="py-3 px-4 text-center">Status Timer</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {matches.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {m.field_name}
                      </td>
                      <td className="py-3.5 px-4 text-red-400 font-semibold">
                        {m.red_team_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-base">
                        <span className="text-red-500">{m.red_score}</span>
                        <span className="text-slate-600 mx-1.5">-</span>
                        <span className="text-white">{m.white_score}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-semibold">
                        {m.white_team_name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            m.is_timer_running
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {m.is_timer_running ? "Sedang Main" : "Standby"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMatch(m.id)}
                          className="p-2 text-slate-500 hover:text-red-400 transition"
                          title="Hapus Pertandingan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
