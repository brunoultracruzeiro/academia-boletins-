import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchBoletins, insertBoletim,
  fetchFeedbacks, upsertFeedback,
  fetchViewers, insertViewer, deleteViewer
} from "./supabase";

const GESTOR_PASSWORD = "gestor2024";

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const parseDate = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
};

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [role, setRole] = useState(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  useEffect(() => {
    setLoadingViewers(true);
    fetchViewers().then(v => { setViewers(v); setLoadingViewers(false); }).catch(() => setLoadingViewers(false));
  }, []);

  const handleLogin = () => {
    setLoginError("");
    if (!loginName.trim()) { setLoginError("Digite seu nome."); return; }
    if (loginPassword === GESTOR_PASSWORD) {
      setRole("gestor"); setPage("gestor");
    } else if (loginPassword === "") {
      const isViewer = viewers.some(v => v.name.toLowerCase() === loginName.trim().toLowerCase());
      if (isViewer) { setRole("viewer"); setPage("gestor"); return; }
      setRole("team"); setPage("team");
    } else {
      setLoginError("Senha incorreta.");
    }
  };

  if (page === "login") return (
    <LoginPage
      name={loginName} setName={setLoginName}
      password={loginPassword} setPassword={setLoginPassword}
      error={loginError} onLogin={handleLogin} loading={loadingViewers}
    />
  );
  if (page === "team") return (
    <TeamPage
      name={loginName}
      onLogout={() => { setPage("login"); setLoginPassword(""); }}
    />
  );
  if (page === "gestor") return (
    <GestorPage
      viewers={viewers} setViewers={setViewers}
      role={role}
      onLogout={() => { setPage("login"); setRole(null); setLoginPassword(""); }}
    />
  );
  return null;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ name, setName, password, setPassword, error, onLogin, loading }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)", padding: "1rem" }}>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2rem", width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <i className="ti ti-barbell" style={{ fontSize: 26, color: "var(--color-text-info)" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Academia — Boletins</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>Acesse com seu nome · Gestores usam senha</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Seu nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lucas, Keila..." style={{ width: "100%" }} onKeyDown={e => e.key === "Enter" && onLogin()} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Senha <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>(somente gestores)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco se for da equipe" style={{ width: "100%" }} onKeyDown={e => e.key === "Enter" && onLogin()} />
          </div>
          {error && <p style={{ fontSize: 13, color: "var(--color-text-danger)", margin: 0 }}><i className="ti ti-alert-circle" /> {error}</p>}
          <button onClick={onLogin} disabled={loading} style={{ marginTop: 4, justifyContent: "center", background: "var(--color-background-info)", color: "var(--color-text-info)", border: "0.5px solid var(--color-border-info)" }}>
            {loading ? "Carregando..." : <><i className="ti ti-login" /> Entrar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TEAM PAGE ─────────────────────────────────────────────────────────────────
function TeamPage({ name, onLogout }) {
  const [tab, setTab] = useState("recepcao");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async (entry) => {
    setSaving(true); setSaveError("");
    try {
      await insertBoletim({ ...entry, author: name });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)" }}>
      <header style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-barbell" style={{ fontSize: 22, color: "var(--color-text-info)" }} />
          <span style={{ fontWeight: 500 }}>Boletim Diário</span>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>— {name}</span>
        </div>
        <button onClick={onLogout} style={{ fontSize: 13 }}><i className="ti ti-logout" /> Sair</button>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {saved && (
          <div style={{ background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-success)", fontSize: 14 }}>
            <i className="ti ti-circle-check" /> Boletim salvo com sucesso no Supabase!
          </div>
        )}
        {saveError && (
          <div style={{ background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", color: "var(--color-text-danger)", fontSize: 14 }}>
            <i className="ti ti-alert-circle" /> {saveError}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {[["recepcao", "ti-phone-call", "Recepção"], ["musculacao", "ti-barbell", "Musculação"]].map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "var(--color-background-info)" : "var(--color-background-secondary)", color: tab === t ? "var(--color-text-info)" : "var(--color-text-secondary)", border: tab === t ? "0.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "8px 18px", cursor: "pointer", fontSize: 14, fontWeight: tab === t ? 500 : 400 }}>
              <i className={`ti ${icon}`} /> {label}
            </button>
          ))}
        </div>

        {tab === "recepcao"
          ? <FormRecepcao name={name} onSave={handleSave} saving={saving} />
          : <FormMusculacao name={name} onSave={handleSave} saving={saving} />}
      </div>
    </div>
  );
}

// ── FORM RECEPÇÃO ─────────────────────────────────────────────────────────────
function FormRecepcao({ name, onSave, saving }) {
  const motivos = ["Preço", "Tempo / indecisão", "Comparando com outra academia", "Não era o momento", "Outro"];
  const blank = { type: "recepcao", date: today(), visits: "", appointments: "", contacts: "", sales: "", noSaleReasons: [], noSaleOther: "", notes: "" };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleReason = (r) => setForm(f => ({ ...f, noSaleReasons: f.noSaleReasons.includes(r) ? f.noSaleReasons.filter(x => x !== r) : [...f.noSaleReasons, r] }));

  const handleSave = () => {
    if (!form.date) return;
    onSave(form).then ? onSave(form).then(() => setForm(blank)) : onSave(form);
    setForm(blank);
  };

  return (
    <Card title="Boletim — Consultor de Vendas" icon="ti-phone-call" iconColor="var(--color-text-info)">
      <Grid2>
        <Field label="Consultor" value={name} disabled />
        <Field label="Data" type="date" value={form.date} onChange={v => set("date", v)} />
        <Field label="Visitas" type="number" value={form.visits} onChange={v => set("visits", v)} placeholder="0" />
        <Field label="Agendamentos" type="number" value={form.appointments} onChange={v => set("appointments", v)} placeholder="0" />
        <Field label="Contatos (listas)" type="number" value={form.contacts} onChange={v => set("contacts", v)} placeholder="0" />
      </Grid2>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Vendas realizadas</label>
        <textarea value={form.sales} onChange={e => set("sales", e.target.value)} placeholder="Nome do cliente - código (ex: ANA CLARA - 23130038). Uma por linha." rows={3} style={{ width: "100%", resize: "vertical", padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "inherit", fontSize: 14 }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 8 }}>Motivos de não fechamento</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {motivos.map(m => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={form.noSaleReasons.includes(m)} onChange={() => toggleReason(m)} /> {m}
            </label>
          ))}
          {form.noSaleReasons.includes("Outro") && (
            <input value={form.noSaleOther} onChange={e => set("noSaleOther", e.target.value)} placeholder="Descreva o motivo..." style={{ marginLeft: 24, width: "calc(100% - 24px)" }} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Field label="Observações do dia" value={form.notes} onChange={v => set("notes", v)} placeholder="Algo relevante..." />
      </div>

      <button onClick={handleSave} disabled={saving} style={{ marginTop: "1.25rem", width: "100%", justifyContent: "center", background: "var(--color-background-info)", color: "var(--color-text-info)", border: "0.5px solid var(--color-border-info)" }}>
        <i className="ti ti-device-floppy" /> {saving ? "Salvando..." : "Salvar boletim"}
      </button>
    </Card>
  );
}

// ── FORM MUSCULAÇÃO ───────────────────────────────────────────────────────────
function FormMusculacao({ name, onSave, saving }) {
  const blank = { type: "musculacao", date: today(), shift: "Manhã", trainings: "", newTrainings: "", renewTrainings: "", engagement: "", equipment: "", organization: "", countDone: "Sim", notes: "" };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.date) return;
    onSave(form);
    setForm(blank);
  };

  return (
    <Card title="Boletim — Musculação" icon="ti-barbell" iconColor="var(--color-text-warning)">
      <Grid2>
        <Field label="Professor / Estagiário" value={name} disabled />
        <Field label="Data" type="date" value={form.date} onChange={v => set("date", v)} />
        <div>
          <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Turno</label>
          <select value={form.shift} onChange={e => set("shift", e.target.value)} style={{ width: "100%" }}>
            {["Manhã", "Tarde", "Noite"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Field label="Treinos prescritos (total)" type="number" value={form.trainings} onChange={v => set("trainings", v)} placeholder="0" />
        <Field label="Novos treinos" type="number" value={form.newTrainings} onChange={v => set("newTrainings", v)} placeholder="0" />
        <Field label="Renovação de treinos" type="number" value={form.renewTrainings} onChange={v => set("renewTrainings", v)} placeholder="0" />
        <Field label="Engajamento (+/-)" value={form.engagement} onChange={v => set("engagement", v)} placeholder="Ex: +7 ou -2" />
      </Grid2>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label="Equipamentos com problema" value={form.equipment} onChange={v => set("equipment", v)} placeholder="Ex: Esteira nº 9 — ou deixe em branco" />
        <Field label="Organização do salão" value={form.organization} onChange={v => set("organization", v)} placeholder="Ex: Sim, 2x · Não — motivo..." />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Contagem no salão feita?</label>
        <div style={{ display: "flex", gap: 16 }}>
          {["Sim", "Não"].map(v => (
            <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
              <input type="radio" name="countDone" value={v} checked={form.countDone === v} onChange={() => set("countDone", v)} /> {v}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Field label="Observações do turno" value={form.notes} onChange={v => set("notes", v)} placeholder="Algo relevante..." />
      </div>

      <button onClick={handleSave} disabled={saving} style={{ marginTop: "1.25rem", width: "100%", justifyContent: "center", background: "var(--color-background-warning)", color: "var(--color-text-warning)", border: "0.5px solid var(--color-border-warning)" }}>
        <i className="ti ti-device-floppy" /> {saving ? "Salvando..." : "Salvar boletim"}
      </button>
    </Card>
  );
}

// ── GESTOR PAGE ───────────────────────────────────────────────────────────────
function GestorPage({ viewers, setViewers, role, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [filterType, setFilterType] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState([]);
  const [feedbacks, setFeedbacksState] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [boletins, fbs] = await Promise.all([fetchBoletins(), fetchFeedbacks()]);
      setData(boletins);
      setFeedbacksState(fbs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setFeedbacks = async (updater) => {
    const next = typeof updater === "function" ? updater(feedbacks) : updater;
    setFeedbacksState(next);
    const changed = Object.entries(next).find(([k, v]) => feedbacks[k] !== v);
    if (changed) await upsertFeedback(changed[0], changed[1]);
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const todayStr = today();
    return data.filter(d => {
      const dt = parseDate(d.date);
      if (!dt) return false;
      if (filterType === "today") return d.date === todayStr;
      if (filterType === "week") return dt >= startOfWeek;
      if (filterType === "custom" && customFrom && customTo) {
        return dt >= parseDate(customFrom) && dt <= parseDate(customTo);
      }
      return true;
    });
  }, [data, filterType, customFrom, customTo]);

  const rData = filtered.filter(d => d.type === "recepcao");
  const mData = filtered.filter(d => d.type === "musculacao");

  const byAuthor = (arr) => arr.reduce((acc, d) => { acc[d.author] = acc[d.author] || []; acc[d.author].push(d); return acc; }, {});
  const rByAuthor = byAuthor(rData);
  const mByAuthor = byAuthor(mData);

  const helpers = {
    totalSales: (e) => e.reduce((n, d) => n + (d.sales?.split("\n").filter(l => l.trim()).length || 0), 0),
    totalContacts: (e) => e.reduce((n, d) => n + (Number(d.contacts) || 0), 0),
    totalVisits: (e) => e.reduce((n, d) => n + (Number(d.visits) || 0), 0),
    totalTrainings: (e) => e.reduce((n, d) => n + (Number(d.trainings) || 0), 0),
    totalEngagement: (e) => e.reduce((n, d) => { const v = String(d.engagement || "").replace("+", ""); return n + (Number(v) || 0); }, 0),
    convRate: function(e) { const v = this.totalVisits(e); const s = this.totalSales(e); return v ? Math.round((s / v) * 100) : 0; },
  };

  const scorecard = (entries, type) => {
    if (type === "recepcao") {
      const cr = helpers.convRate(entries);
      const c = helpers.totalContacts(entries);
      const s = helpers.totalSales(entries);
      let score = 0;
      if (cr >= 50) score += 40; else if (cr >= 30) score += 25; else if (cr >= 10) score += 10;
      if (c >= 20) score += 30; else if (c >= 10) score += 20; else if (c >= 5) score += 10;
      if (s >= 3) score += 30; else if (s >= 1) score += 15;
      return Math.min(score, 100);
    } else {
      const t = helpers.totalTrainings(entries);
      const eng = helpers.totalEngagement(entries);
      let score = 0;
      if (t >= 10) score += 40; else if (t >= 5) score += 25; else if (t >= 2) score += 10;
      if (eng > 10) score += 35; else if (eng > 5) score += 20; else if (eng > 0) score += 10;
      const eqOk = entries.filter(e => !e.equipment?.trim()).length;
      score += Math.round((eqOk / Math.max(entries.length, 1)) * 25);
      return Math.min(score, 100);
    }
  };

  const scoreBadge = (s) => {
    if (s >= 80) return { label: "Excelente", bg: "var(--color-background-success)", color: "var(--color-text-success)" };
    if (s >= 60) return { label: "Bom", bg: "var(--color-background-info)", color: "var(--color-text-info)" };
    if (s >= 40) return { label: "Regular", bg: "var(--color-background-warning)", color: "var(--color-text-warning)" };
    return { label: "Atenção", bg: "var(--color-background-danger)", color: "var(--color-text-danger)" };
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
    { id: "recepcao", label: "Recepção", icon: "ti-phone-call" },
    { id: "musculacao", label: "Musculação", icon: "ti-barbell" },
    ...(role === "gestor" ? [{ id: "config", label: "Acessos", icon: "ti-users" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)" }}>
      <header style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-barbell" style={{ fontSize: 22, color: "var(--color-text-info)" }} />
          <span style={{ fontWeight: 500 }}>Painel do Gestor</span>
          <span style={{ fontSize: 12, background: "var(--color-background-info)", color: "var(--color-text-info)", padding: "2px 8px", borderRadius: "var(--border-radius-md)" }}>
            {role === "gestor" ? "Admin" : "Visualização"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadAll} style={{ fontSize: 13 }}><i className="ti ti-refresh" /> Atualizar</button>
          <button onClick={onLogout} style={{ fontSize: 13 }}><i className="ti ti-logout" /> Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem" }}>
        {/* Filter */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <i className="ti ti-filter" style={{ color: "var(--color-text-secondary)", fontSize: 16 }} />
          {[["today", "Hoje"], ["week", "Esta semana"], ["all", "Tudo"], ["custom", "Personalizado"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilterType(v)} style={{ fontSize: 13, padding: "4px 12px", background: filterType === v ? "var(--color-background-info)" : "transparent", color: filterType === v ? "var(--color-text-info)" : "var(--color-text-secondary)", border: filterType === v ? "0.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>{l}</button>
          ))}
          {filterType === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: 140, fontSize: 13 }} />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>até</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ width: 140, fontSize: 13 }} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1rem", flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: "6px 14px", background: tab === t.id ? "var(--color-background-primary)" : "transparent", color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: tab === t.id ? "0.5px solid var(--color-border-secondary)" : "0.5px solid transparent", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontWeight: tab === t.id ? 500 : 400 }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 15 }} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>
            <i className="ti ti-loader" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
            Carregando dados do Supabase...
          </div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab rData={rData} mData={mData} rByAuthor={rByAuthor} mByAuthor={mByAuthor} helpers={helpers} scorecard={scorecard} scoreBadge={scoreBadge} feedbacks={feedbacks} setFeedbacks={setFeedbacks} filtered={filtered} role={role} />}
            {tab === "recepcao" && <DetailsTab entries={rData} type="recepcao" scorecard={scorecard} scoreBadge={scoreBadge} feedbacks={feedbacks} setFeedbacks={setFeedbacks} helpers={helpers} role={role} />}
            {tab === "musculacao" && <DetailsTab entries={mData} type="musculacao" scorecard={scorecard} scoreBadge={scoreBadge} feedbacks={feedbacks} setFeedbacks={setFeedbacks} helpers={helpers} role={role} />}
            {tab === "config" && role === "gestor" && <ConfigTab viewers={viewers} setViewers={setViewers} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
function DashboardTab({ rData, mData, rByAuthor, mByAuthor, helpers, scorecard, scoreBadge, feedbacks, setFeedbacks, filtered, role }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-chart-bar" /> Resumo geral
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          <StatCard icon="ti-file-text" label="Total boletins" value={filtered.length} />
          <StatCard icon="ti-currency-dollar" label="Vendas" value={helpers.totalSales(rData)} color="success" />
          <StatCard icon="ti-address-book" label="Contatos" value={helpers.totalContacts(rData)} color="info" />
          <StatCard icon="ti-door-enter" label="Visitas" value={helpers.totalVisits(rData)} />
          <StatCard icon="ti-barbell" label="Treinos" value={helpers.totalTrainings(mData)} color="warning" />
          <StatCard icon="ti-flame" label="Engajamento" value={`+${helpers.totalEngagement(mData)}`} color="danger" />
        </div>
      </section>

      {Object.keys(rByAuthor).length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-phone-call" /> Performance — Recepção
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(rByAuthor).map(([author, entries]) => (
              <PersonCard key={author} author={author} entries={entries} type="recepcao" score={scorecard(entries, "recepcao")} badge={scoreBadge(scorecard(entries, "recepcao"))} feedbacks={feedbacks} setFeedbacks={setFeedbacks} helpers={helpers} role={role} />
            ))}
          </div>
        </section>
      )}

      {Object.keys(mByAuthor).length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-barbell" /> Performance — Musculação
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(mByAuthor).map(([author, entries]) => (
              <PersonCard key={author} author={author} entries={entries} type="musculacao" score={scorecard(entries, "musculacao")} badge={scoreBadge(scorecard(entries, "musculacao"))} feedbacks={feedbacks} setFeedbacks={setFeedbacks} helpers={helpers} role={role} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
          <i className="ti ti-inbox" style={{ fontSize: 40, display: "block", marginBottom: "0.75rem" }} />
          <p style={{ margin: 0 }}>Nenhum boletim no período selecionado.</p>
        </div>
      )}
    </div>
  );
}

// ── PERSON CARD ───────────────────────────────────────────────────────────────
function PersonCard({ author, entries, type, score, badge, feedbacks, setFeedbacks, helpers, role }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbText, setFbText] = useState(feedbacks[author] || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setFbText(feedbacks[author] || ""); }, [feedbacks, author]);

  const saveFeedback = async () => {
    setSaving(true);
    await setFeedbacks(prev => ({ ...prev, [author]: fbText }));
    setSaving(false);
    setShowFeedback(false);
  };

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 13, color: "var(--color-text-info)", flexShrink: 0 }}>
            {author.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{author}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
              {entries.length} boletim{entries.length !== 1 ? "s" : ""} · {type === "recepcao" ? "Consultor" : "Prof. Musculação"}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: "var(--border-radius-md)", background: badge.bg, color: badge.color }}>{badge.label}</span>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 5px" }}>Score card · {score}/100</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 7, background: "var(--color-background-tertiary)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${score}%`, height: "100%", background: score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 30 }}>{score}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: "0.75rem" }}>
        {type === "recepcao" ? (
          <>
            <MiniStat label="Vendas" value={helpers.totalSales(entries)} />
            <MiniStat label="Visitas" value={helpers.totalVisits(entries)} />
            <MiniStat label="Contatos" value={helpers.totalContacts(entries)} />
            <MiniStat label="Conversão" value={`${helpers.convRate(entries)}%`} />
          </>
        ) : (
          <>
            <MiniStat label="Treinos" value={helpers.totalTrainings(entries)} />
            <MiniStat label="Engajamento" value={`+${helpers.totalEngagement(entries)}`} />
            <MiniStat label="Boletins" value={entries.length} />
          </>
        )}
      </div>

      {feedbacks[author] && (
        <div style={{ background: "var(--color-background-info)", borderRadius: "var(--border-radius-md)", padding: "0.625rem 0.875rem", marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: "var(--color-text-info)", margin: "0 0 3px", fontWeight: 500 }}>
            <i className="ti ti-message-circle" /> Feedback do gestor
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-info)", margin: 0 }}>{feedbacks[author]}</p>
        </div>
      )}

      {role === "gestor" && (
        <>
          <button onClick={() => setShowFeedback(v => !v)} style={{ fontSize: 13, padding: "5px 12px" }}>
            <i className="ti ti-message-plus" /> {feedbacks[author] ? "Editar feedback" : "Dar feedback"}
          </button>
          {showFeedback && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea value={fbText} onChange={e => setFbText(e.target.value)} rows={3} placeholder="O que está indo bem? O que pode melhorar?" style={{ width: "100%", resize: "vertical", padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "inherit", fontSize: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveFeedback} disabled={saving} style={{ fontSize: 13 }}>
                  <i className="ti ti-device-floppy" /> {saving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setShowFeedback(false)} style={{ fontSize: 13 }}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── DETAILS TAB ───────────────────────────────────────────────────────────────
function DetailsTab({ entries, type, scorecard, scoreBadge, feedbacks, setFeedbacks, helpers, role }) {
  const byAuthor = entries.reduce((acc, d) => { acc[d.author] = acc[d.author] || []; acc[d.author].push(d); return acc; }, {});

  if (entries.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
      <i className="ti ti-inbox" style={{ fontSize: 40, display: "block", marginBottom: "0.75rem" }} />
      <p style={{ margin: 0 }}>Nenhum boletim neste período.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {Object.entries(byAuthor).map(([author, items]) => {
        const sc = scorecard(items, type);
        return (
          <div key={author}>
            <PersonCard author={author} entries={items} type={type} score={sc} badge={scoreBadge(sc)} feedbacks={feedbacks} setFeedbacks={setFeedbacks} helpers={helpers} role={role} />
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map(e => (
                <div key={e.id} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{fmtDate(e.date)}</span>
                    {type === "musculacao" && <span style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-background-warning)", padding: "1px 8px", borderRadius: "var(--border-radius-md)", color: "var(--color-text-warning)" }}>{e.shift}</span>}
                  </div>
                  {type === "recepcao" ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "var(--color-text-secondary)" }}>
                      <span><i className="ti ti-door-enter" /> Visitas: <strong>{e.visits || 0}</strong></span>
                      <span><i className="ti ti-address-book" /> Contatos: <strong>{e.contacts || 0}</strong></span>
                      <span style={{ color: "var(--color-text-success)" }}><i className="ti ti-currency-dollar" /> Vendas: <strong>{e.sales?.split("\n").filter(l => l.trim()).length || 0}</strong></span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "var(--color-text-secondary)" }}>
                      <span><i className="ti ti-barbell" /> Treinos: <strong>{e.trainings || 0}</strong></span>
                      <span><i className="ti ti-flame" /> Engajamento: <strong>{e.engagement || 0}</strong></span>
                      {e.equipment && <span style={{ color: "var(--color-text-warning)" }}><i className="ti ti-tool" /> {e.equipment}</span>}
                    </div>
                  )}
                  {e.notes && <p style={{ margin: "5px 0 0", color: "var(--color-text-secondary)", fontStyle: "italic" }}>{e.notes}</p>}
                  {type === "recepcao" && e.sales?.trim() && (
                    <div style={{ marginTop: 6 }}>
                      {e.sales.split("\n").filter(l => l.trim()).map((s, i) => (
                        <span key={i} style={{ display: "inline-block", fontSize: 12, background: "var(--color-background-success)", color: "var(--color-text-success)", padding: "2px 8px", borderRadius: "var(--border-radius-md)", marginRight: 4, marginTop: 3 }}>{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CONFIG TAB ────────────────────────────────────────────────────────────────
function ConfigTab({ viewers, setViewers }) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const v = await insertViewer(newName.trim(), newEmail.trim());
      setViewers(prev => [...prev, v]);
      setNewName(""); setNewEmail("");
    } catch (e) { alert("Erro ao adicionar."); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteViewer(id);
      setViewers(prev => prev.filter(v => v.id !== id));
    } catch { alert("Erro ao remover."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Card title="Quem pode ver o painel" icon="ti-users" iconColor="var(--color-text-info)">
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
          Pessoas adicionadas aqui acessam o painel sem senha — basta digitar o nome exato no login.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
          {viewers.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{v.name}</p>
                {v.email && <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{v.email}</p>}
              </div>
              <button onClick={() => handleDelete(v.id)} style={{ fontSize: 13, color: "var(--color-text-danger)", border: "0.5px solid var(--color-border-danger)", padding: "4px 10px" }}>
                <i className="ti ti-trash" /> Remover
              </button>
            </div>
          ))}
          {viewers.length === 0 && <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Nenhum visualizador cadastrado.</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Nome</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>E-mail (opcional)</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@academia.com" style={{ width: "100%" }} />
          </div>
        </div>
        <button onClick={handleAdd} disabled={saving} style={{ marginTop: 12 }}>
          <i className="ti ti-user-plus" /> {saving ? "Salvando..." : "Adicionar visualizador"}
        </button>
      </Card>
      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem", fontSize: 13, color: "var(--color-text-secondary)" }}>
        <i className="ti ti-info-circle" /> Senha de admin atual: <code style={{ background: "var(--color-background-tertiary)", padding: "1px 6px", borderRadius: 4 }}>gestor2024</code> — altere a variável <code>GESTOR_PASSWORD</code> em <code>App.jsx</code> antes de publicar.
      </div>
    </div>
  );
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Card({ title, icon, iconColor, children }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8 }}>
        <i className={`ti ${icon}`} style={{ color: iconColor }} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={onChange ? e => onChange(e.target.value) : undefined} placeholder={placeholder} disabled={disabled} style={{ width: "100%", background: disabled ? "var(--color-background-secondary)" : "var(--color-background-primary)", color: disabled ? "var(--color-text-secondary)" : "var(--color-text-primary)" }} />
    </div>
  );
}

function StatCard({ icon, label, value, color = "info" }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color: `var(--color-text-${color})` }} />
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "6px 10px" }}>
      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}
