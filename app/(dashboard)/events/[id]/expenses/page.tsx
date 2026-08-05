"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ExpenseSummary from "@/components/event/ExpenseSummary";
import CustomIcon from "@/components/ui/CustomIcon";

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface UserBalance {
  id: string;
  nome: string;
  avatar_url?: string;
  balance: number;
}

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [descrizione, setDescrizione] = useState("");
  const [importo, setImporto] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: members, error: membersError } = await supabase
      .from("event_members")
      .select(`
        user_id,
        profiles:user_id(
          id,
          nome,
          avatar_url
        )
      `)
      .eq("event_id", eventId)
      .eq("stato", "partecipo");

    if (membersError) {
      console.log("ERRORE PARTECIPANTI:", membersError);
    }

    const users = (members || []).map((m: any) => m.profiles);
    setParticipants(users);

    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select(`
        *,
        profiles!expenses_payer_id_fkey(
          nome
        ),
        expense_members:expense_members_expense_fk(
          quota,
          user_id,
          profiles:profiles!expense_members_user_fk(
            nome
          )
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (expenseError) {
      console.log("ERRORE SPESE:", expenseError);
    }

    setExpenses(expenseData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  function toggleUser(id: string) {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((u) => u !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  }

  async function addExpense() {
    if (!descrizione.trim() || !importo || selectedUsers.length === 0) {
      alert("Compila tutti i campi e seleziona almeno un partecipante");
      return;
    }

    if (!user) {
      alert("Utente non trovato");
      return;
    }

    const amount = parseFloat(importo);

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        event_id: eventId,
        payer_id: user.id,
        descrizione: descrizione.trim(),
        importo: amount,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const quota = amount / selectedUsers.length;

    const members = selectedUsers.map((id) => ({
      expense_id: expense.id,
      user_id: id,
      quota,
    }));

    const { error: memberError } = await supabase
      .from("expense_members")
      .insert(members);

    if (memberError) {
      alert(memberError.message);
      return;
    }

    setDescrizione("");
    setImporto("");
    setSelectedUsers([]);

    await loadData();
  }

  async function deleteExpense(id: string) {
    const ok = confirm("Eliminare questa spesa?");
    if (!ok) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  // 🧮 CALCOLO CONGUAGLIO E SALDI NETTI ("CHI DEVE DARE A CHI")
  function calculateSettlements(): {
    userBalances: UserBalance[];
    settlements: Settlement[];
  } {
    const balanceMap: Record<string, { nome: string; avatar_url?: string; balance: number }> = {};

    participants.forEach((p) => {
      if (p?.id) {
        balanceMap[p.id] = {
          nome: p.nome || "Partecipante",
          avatar_url: p.avatar_url,
          balance: 0,
        };
      }
    });

    expenses.forEach((exp) => {
      const payerId = exp.payer_id;
      const totalAmount = Number(exp.importo) || 0;

      if (balanceMap[payerId]) {
        balanceMap[payerId].balance += totalAmount;
      }

      const members = exp.expense_members || [];
      members.forEach((m: any) => {
        const userId = m.user_id;
        const quota = Number(m.quota) || 0;
        if (balanceMap[userId]) {
          balanceMap[userId].balance -= quota;
        }
      });
    });

    const userBalances: UserBalance[] = Object.entries(balanceMap).map(
      ([id, data]) => ({
        id,
        nome: data.nome,
        avatar_url: data.avatar_url,
        balance: Math.round(data.balance * 100) / 100,
      })
    );

    const debtors: { nome: string; amount: number }[] = [];
    const creditors: { nome: string; amount: number }[] = [];

    userBalances.forEach((b) => {
      if (b.balance < -0.01) {
        debtors.push({ nome: b.nome, amount: Math.abs(b.balance) });
      } else if (b.balance > 0.01) {
        creditors.push({ nome: b.nome, amount: b.balance });
      }
    });

    const settlements: Settlement[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const settledAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.nome,
        to: creditor.nome,
        amount: Math.round(settledAmount * 100) / 100,
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { userBalances, settlements };
  }

  const { userBalances, settlements } = calculateSettlements();

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="soldi" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Calcolo Cassa Spedizione...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 HEADER */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Cassa Spedizione
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 💸 HERO BANNER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
            💸 Saldi & Conti
          </span>
          <h1 className="text-2xl font-black text-[#1b2b25] tracking-tight">
            Spese di Gruppo
          </h1>
          <p className="text-xs font-bold text-[#1b2b25]/60">
            Traccia acquisti e dividi le quote con precisione
          </p>
        </div>

        <CustomIcon name="soldi" size={72} className="shrink-0 drop-shadow-sm" />
      </section>

      {/* 📊 SINTESI SPESE */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-4 border border-white shadow-sm">
        <ExpenseSummary participants={participants} expenses={expenses} />
      </section>

      {/* 🤝 CONGUAGLIO E RIMBORSI ("CHI DEVE DARE A CHI") */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-5 border border-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-[#1b2b25] uppercase tracking-wider flex items-center gap-2">
            <span>🤝</span> Rimborsi e Pareggio Cassa
          </h2>
        </div>

        {/* LISTA RIMBORSI DIRETTI */}
        {settlements.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
            <p className="text-xs font-bold text-emerald-950">
              🎉 Tutti i conti sono in pari! Nessun rimborso dovuto.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-amber-950 truncate">
                    {s.from}
                  </span>
                  <span className="text-xs font-bold text-amber-800">deve dare a</span>
                  <span className="text-xs font-black text-amber-950 truncate">
                    {s.to}
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-amber-950 bg-amber-200/60 border border-amber-300 px-2.5 py-1 rounded-xl shrink-0">
                  {s.amount.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dettaglio Saldi Personali */}
        <div className="pt-3 border-t border-[#1b2b25]/10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/50 block">
            Posizione Netta Singoli Partecipanti:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {userBalances.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white/70 border border-white shadow-2xs text-xs"
              >
                <span className="font-bold text-[#1b2b25] truncate">
                  {b.nome}
                </span>
                <span
                  className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-lg ${
                    b.balance > 0
                      ? "text-emerald-700 bg-emerald-100"
                      : b.balance < 0
                      ? "text-rose-700 bg-rose-100"
                      : "text-slate-600 bg-slate-100"
                  }`}
                >
                  {b.balance > 0 ? `+${b.balance.toFixed(2)}` : b.balance.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ➕ MODULO NUOVA SPESA */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1b2b25] uppercase tracking-wider flex items-center gap-2">
            <span>➕</span> Registra Spesa
          </h2>
        </div>

        <div className="space-y-3">
          <input
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="Cosa hai acquistato? (es. Spesa, Benzina)..."
            className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-black text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs"
          />

          <div className="relative">
            <input
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              placeholder="0.00"
              type="number"
              step="0.01"
              className="w-full bg-white/80 backdrop-blur-md border border-white rounded-2xl pl-4 pr-10 py-3 text-sm font-black text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-2xs font-mono"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-[#1b2b25]/50">
              €
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 px-1">
                👥 Dividi con ({selectedUsers.length}/{participants.length})
              </label>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedUsers(participants.map((p) => p.id))
                  }
                  className="text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md active:scale-95 transition"
                >
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUsers([])}
                  className="text-[9px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md active:scale-95 transition"
                >
                  Nessuno
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isSelected = selectedUsers.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleUser(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-2xl border transition cursor-pointer select-none ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 text-[#1b2b25] shadow-2xs"
                        : "bg-white/60 border-white text-[#1b2b25]/50 opacity-70"
                    }`}
                  >
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.nome}
                        className="w-6 h-6 rounded-full object-cover border border-white shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#ebdec8] flex items-center justify-center text-[10px] font-black text-[#1b2b25] shrink-0">
                        {p.nome ? p.nome.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}

                    <span className="text-xs font-bold truncate flex-1">
                      {p.nome}
                    </span>

                    <div
                      className={`w-4 h-4 rounded-lg border flex items-center justify-center text-[9px] font-black transition ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && "✓"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={addExpense}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition flex items-center justify-center gap-2 mt-2"
          >
            ➕ Conferma e Aggiungi Spesa
          </button>
        </div>
      </section>

      {/* 📋 HISTORIC MOVEMENTS */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]/60 px-2">
          Storico Movimenti ({expenses.length})
        </h3>

        {expenses.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm text-center space-y-2">
            <CustomIcon name="soldi" size={52} className="mx-auto mb-1 opacity-40" />
            <h3 className="text-sm font-black text-[#1b2b25]">
              Nessuna Spesa Registrata
            </h3>
            <p className="text-xs font-semibold text-[#1b2b25]/50">
              Registra il primo acquisto utilizzando il modulo qui sopra.
            </p>
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-5 border border-white shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black text-[#1b2b25]">
                    💸 {exp.descrizione}
                  </h2>
                  <p className="text-[10px] font-bold text-[#1b2b25]/60">
                    Pagato da{" "}
                    <span className="font-extrabold text-[#1b2b25]">
                      {exp.profiles?.nome || "Anonimo"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl">
                    {Number(exp.importo).toFixed(2)} €
                  </span>

                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200 text-xs font-black active:scale-90 transition flex items-center justify-center hover:bg-rose-500 hover:text-white shrink-0"
                    title="Elimina Spesa"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1b2b25]/10 space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1b2b25]/50 block">
                  Diviso tra {exp.expense_members?.length || 0} membri:
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  {exp.expense_members?.map((m: any) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-white text-xs"
                    >
                      <span className="font-bold text-[#1b2b25] truncate">
                        👤 {m.profiles?.nome}
                      </span>
                      <span className="font-mono text-[10px] font-black text-[#1b2b25]/70">
                        {Number(m.quota).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

    </main>
  );
}