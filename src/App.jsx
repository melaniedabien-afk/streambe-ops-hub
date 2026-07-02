import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Linkedin, Instagram, Calendar, ChevronRight, ChevronLeft,
  Trash2, CheckCircle2, Circle, LayoutGrid, Search, Sparkles,
  ClipboardList, Users, Megaphone, Loader2, AlertCircle, Globe,
  Rows3, LayoutList, Building2, ExternalLink, Clock, PenLine,
  Image, FileText, Video, Shapes, Link2, ShieldCheck, ShieldAlert,
  ThumbsUp, MessageSquareWarning, History
} from "lucide-react";

/* ---------- Tokens de marca — oficiales, del Manual de Marca Streambe
   (sección Color, p.38) y sección Tipografía (p.42-46). ---------- */
const COLORS = {
  navy: "#10192B",       // Digital
  navyLight: "#1B2C4A",  // variante clara de Digital para hover/dividers
  bg: "#FAFAFA",         // PMS Cool Gray 1 C
  surface: "#FFFFFF",    // PMS White
  cyan: "#2FB1FE",       // Action
  tech: "#0253E8",       // Tech
  soft: "#B1EDFF",       // Soft
  ink: "#10192B",        // Digital, usado como texto principal
  inkSoft: "#5B6B7C",
  border: "#E8E8E3",     // Clear
  amber: "#F59E0B",
  green: "#29C927",      // Positivo
  red: "#EB2D2D",        // Negativo
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
`;

const MODULES = [
  { id: "calendario", label: "Calendario editorial", icon: Calendar, active: true },
  { id: "research", label: "Research competitivo", icon: Search, active: true },
  { id: "plan", label: "Plan 2026", icon: LayoutGrid, active: true },
  { id: "assets", label: "Banco de assets", icon: Sparkles, active: true },
  { id: "equipo", label: "Aprobaciones", icon: Users, active: true },
];

const STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "borrador", label: "Borrador" },
  { id: "aprobacion", label: "Aprobación" },
  { id: "publicado", label: "Publicado" },
];

const CHECKS = [
  { id: "triada", label: "Estructura triádica" },
  { id: "cierre", label: 'Cierre "Be [adjetivo]"' },
  { id: "gira", label: 'Sin la palabra "gira"' },
  { id: "gentica", label: "Sin mención a Gentica" },
];

const PLATFORM_META = {
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  instagram: { label: "Instagram", icon: Instagram, color: "#D6249F" },
};

const STORAGE_KEY = "content-items";
const emptyForm = () => ({
  id: null,
  title: "",
  platform: "linkedin",
  date: "",
  angle: "",
  notes: "",
  status: "idea",
  checks: {},
});

/* ---------- Research competitivo ---------- */
const COMPETITORS_KEY = "competitors";
const SEGMENTS = [
  "Software factory",
  "Agencia digital",
  "Boutique dev",
  "Staff augmentation",
  "Consultora IT",
  "Otro",
];
const emptyCompetitor = () => ({
  id: null,
  name: "",
  website: "",
  segment: "Software factory",
  geo: "",
  services: "",
  pricingNote: "",
  strengths: "",
  weaknesses: "",
  differentiator: "",
});

/* ---------- Plan de marketing 2026 (6 agentes) ---------- */
const PLAN_KEY = "plan-2026-agents";
const PLAN_STATUSES = ["Pendiente", "En curso", "Completado"];
const DEFAULT_AGENTS = [
  {
    id: "marketing-strategist",
    name: "Marketing Strategist",
    status: "Completado",
    notes: "",
  },
  {
    id: "social-community",
    name: "Social Media & Community",
    status: "Completado",
    notes: "",
  },
  {
    id: "content-seo",
    name: "Content & SEO",
    status: "Completado",
    notes: "",
  },
  {
    id: "branding-positioning",
    name: "Branding & Positioning",
    status: "Pendiente",
    notes: "",
  },
  {
    id: "paid-demand",
    name: "Paid Media & Demand",
    status: "Pendiente",
    notes: "",
  },
  {
    id: "alliances-events",
    name: "Alliances & Events",
    status: "Pendiente",
    notes: "",
  },
];

/* ---------- Banco de assets ---------- */
const ASSETS_KEY = "brand-assets";
const ASSET_TYPES = {
  Logo: { icon: Shapes, color: "#0253E8" },
  Imagen: { icon: Image, color: "#2FB1FE" },
  Plantilla: { icon: FileText, color: "#F59E0B" },
  Video: { icon: Video, color: "#EB2D2D" },
};
const emptyAsset = () => ({
  id: null,
  name: "",
  type: "Imagen",
  link: "",
  tags: "",
  approved: true,
  notes: "",
});

/* Validador rápido de copy contra reglas de marca */
const BANNED_WORDS = ["gira", "gentica"];
function scanCopy(text) {
  const lower = text.toLowerCase();
  const hits = BANNED_WORDS.filter((w) => lower.includes(w));
  const hasBeClosing = /\bbe\s+\w+/i.test(text.trim().split("\n").slice(-2).join(" "));
  return { hits, hasBeClosing };
}

/* ---------- Aprobaciones ---------- */
const APPROVALS_LOG_KEY = "approvals-log";

export default function StreambeOpsHub() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("calendario");

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [competitors, setCompetitors] = useState(null);
  const [compError, setCompError] = useState(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compForm, setCompForm] = useState(emptyCompetitor());
  const [compSaving, setCompSaving] = useState(false);
  const [compView, setCompView] = useState("cards"); // "cards" | "matrix"

  const [agents, setAgents] = useState(null);
  const [agentError, setAgentError] = useState(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentForm, setAgentForm] = useState(null);
  const [agentSaving, setAgentSaving] = useState(false);

  const [assets, setAssets] = useState(null);
  const [assetError, setAssetError] = useState(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAsset());
  const [assetSaving, setAssetSaving] = useState(false);
  const [copyText, setCopyText] = useState("");

  const [approvalsLog, setApprovalsLog] = useState(null);
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesTarget, setChangesTarget] = useState(null);
  const [changesComment, setChangesComment] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        setItems(res ? JSON.parse(res.value) : []);
      } catch {
        setItems([]);
      }
      try {
        const res2 = await window.storage.get(COMPETITORS_KEY, true);
        setCompetitors(res2 ? JSON.parse(res2.value) : []);
      } catch {
        setCompetitors([]);
      }
      try {
        const res3 = await window.storage.get(PLAN_KEY, true);
        if (res3) {
          setAgents(JSON.parse(res3.value));
        } else {
          await window.storage.set(PLAN_KEY, JSON.stringify(DEFAULT_AGENTS), true);
          setAgents(DEFAULT_AGENTS);
        }
      } catch {
        setAgents(DEFAULT_AGENTS);
      }
      try {
        const res4 = await window.storage.get(ASSETS_KEY, true);
        setAssets(res4 ? JSON.parse(res4.value) : []);
      } catch {
        setAssets([]);
      }
      try {
        const res5 = await window.storage.get(APPROVALS_LOG_KEY, true);
        setApprovalsLog(res5 ? JSON.parse(res5.value) : []);
      } catch {
        setApprovalsLog([]);
      }
    })();
  }, []);

  const persist = async (next) => {
    setItems(next);
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(next), true);
      if (!res) setError("No se pudo guardar. Probá de nuevo.");
      else setError(null);
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    }
  };

  const persistCompetitors = async (next) => {
    setCompetitors(next);
    try {
      const res = await window.storage.set(COMPETITORS_KEY, JSON.stringify(next), true);
      if (!res) setCompError("No se pudo guardar. Probá de nuevo.");
      else setCompError(null);
    } catch {
      setCompError("No se pudo guardar. Probá de nuevo.");
    }
  };

  const openNewCompetitor = () => {
    setCompForm(emptyCompetitor());
    setCompModalOpen(true);
  };

  const openEditCompetitor = (c) => {
    setCompForm(c);
    setCompModalOpen(true);
  };

  const closeCompModal = () => setCompModalOpen(false);

  const saveCompForm = async () => {
    if (!compForm.name.trim()) return;
    setCompSaving(true);
    let next;
    if (compForm.id) {
      next = competitors.map((c) => (c.id === compForm.id ? compForm : c));
    } else {
      next = [...competitors, { ...compForm, id: crypto.randomUUID() }];
    }
    await persistCompetitors(next);
    setCompSaving(false);
    setCompModalOpen(false);
  };

  const removeCompetitor = async (id) => {
    await persistCompetitors(competitors.filter((c) => c.id !== id));
  };

  const persistAgents = async (next) => {
    setAgents(next);
    try {
      const res = await window.storage.set(PLAN_KEY, JSON.stringify(next), true);
      if (!res) setAgentError("No se pudo guardar. Probá de nuevo.");
      else setAgentError(null);
    } catch {
      setAgentError("No se pudo guardar. Probá de nuevo.");
    }
  };

  const openEditAgent = (agent) => {
    setAgentForm(agent);
    setAgentModalOpen(true);
  };

  const closeAgentModal = () => setAgentModalOpen(false);

  const saveAgentForm = async () => {
    setAgentSaving(true);
    const next = agents.map((a) => (a.id === agentForm.id ? agentForm : a));
    await persistAgents(next);
    setAgentSaving(false);
    setAgentModalOpen(false);
  };

  const persistAssets = async (next) => {
    setAssets(next);
    try {
      const res = await window.storage.set(ASSETS_KEY, JSON.stringify(next), true);
      if (!res) setAssetError("No se pudo guardar. Probá de nuevo.");
      else setAssetError(null);
    } catch {
      setAssetError("No se pudo guardar. Probá de nuevo.");
    }
  };

  const openNewAsset = () => {
    setAssetForm(emptyAsset());
    setAssetModalOpen(true);
  };

  const openEditAsset = (a) => {
    setAssetForm(a);
    setAssetModalOpen(true);
  };

  const closeAssetModal = () => setAssetModalOpen(false);

  const saveAssetForm = async () => {
    if (!assetForm.name.trim()) return;
    setAssetSaving(true);
    let next;
    if (assetForm.id) {
      next = assets.map((a) => (a.id === assetForm.id ? assetForm : a));
    } else {
      next = [...assets, { ...assetForm, id: crypto.randomUUID() }];
    }
    await persistAssets(next);
    setAssetSaving(false);
    setAssetModalOpen(false);
  };

  const removeAsset = async (id) => {
    await persistAssets(assets.filter((a) => a.id !== id));
  };

  const persistApprovalsLog = async (next) => {
    setApprovalsLog(next);
    try {
      await window.storage.set(APPROVALS_LOG_KEY, JSON.stringify(next), true);
    } catch {
      /* best-effort log, no bloquea el flujo principal */
    }
  };

  const logApproval = async (item, action, comment) => {
    const entry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemTitle: item.title,
      action,
      comment: comment || "",
      date: new Date().toISOString(),
    };
    await persistApprovalsLog([entry, ...(approvalsLog || [])]);
  };

  const approveItem = async (item) => {
    const next = items.map((it) =>
      it.id === item.id ? { ...it, status: "publicado", reviewComment: "" } : it
    );
    await persist(next);
    await logApproval(item, "Aprobado");
  };

  const openChangesModal = (item) => {
    setChangesTarget(item);
    setChangesComment("");
    setChangesModalOpen(true);
  };

  const closeChangesModal = () => setChangesModalOpen(false);

  const submitChanges = async () => {
    if (!changesTarget) return;
    const next = items.map((it) =>
      it.id === changesTarget.id ? { ...it, status: "borrador", reviewComment: changesComment } : it
    );
    await persist(next);
    await logApproval(changesTarget, "Cambios solicitados", changesComment);
    setChangesModalOpen(false);
  };

  const openNew = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm(item);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const saveForm = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    let next;
    if (form.id) {
      next = items.map((it) => (it.id === form.id ? form : it));
    } else {
      next = [...items, { ...form, id: crypto.randomUUID() }];
    }
    await persist(next);
    setSaving(false);
    setModalOpen(false);
  };

  const removeItem = async (id) => {
    await persist(items.filter((it) => it.id !== id));
  };

  const moveItem = async (id, dir) => {
    const idx = STATUSES.findIndex((s) => s.id === items.find((it) => it.id === id).status);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= STATUSES.length) return;
    const next = items.map((it) =>
      it.id === id ? { ...it, status: STATUSES[newIdx].id } : it
    );
    await persist(next);
  };

  const toggleCheck = (checkId) => {
    setForm((f) => ({
      ...f,
      checks: { ...f.checks, [checkId]: !f.checks?.[checkId] },
    }));
  };

  const grouped = useMemo(() => {
    const g = {};
    STATUSES.forEach((s) => (g[s.id] = []));
    (items || []).forEach((it) => g[it.status]?.push(it));
    return g;
  }, [items]);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: COLORS.bg,
        minHeight: "100dvh",
        display: "flex",
        color: COLORS.ink,
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* ---------- Sidebar ---------- */}
      {/* Overlay para cerrar sidebar en mobile */}
      <div
        id="sidebar-overlay"
        className={sidebarOpen ? "visible" : ""}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Botón hamburger - visible en mobile/tablet */}
      <button
        id="hamburger-btn"
        aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      <aside
        className={sidebarOpen ? "sidebar-open" : ""}
        style={{
          width: 240,
          background: COLORS.navy,
          color: "#fff",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.tech})`,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>
              Streambe
            </div>
            <div style={{ fontSize: 10.5, color: "#8FA3B8", letterSpacing: 0.3 }}>OPS HUB · MKT</div>
          </div>
        </div>

        {MODULES.map((m) => {
          const Icon = m.icon;
          const isSelected = activeModule === m.id;
          return (
            <button
              key={m.id}
              disabled={!m.active}
              onClick={() => { if (m.active) { setActiveModule(m.id); setSidebarOpen(false); } }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                textAlign: "left",
                fontSize: 13.5,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                cursor: m.active ? "pointer" : "default",
                background: isSelected ? "rgba(18,176,232,0.14)" : "transparent",
                color: m.active ? "#fff" : "#5C7188",
                position: "relative",
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {m.label}
              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: 3,
                    borderRadius: 2,
                    background: `linear-gradient(${COLORS.cyan}, ${COLORS.tech})`,
                  }}
                />
              )}
              {!m.active && (
                <span style={{ marginLeft: "auto", fontSize: 9.5, color: "#425064" }}>pronto</span>
              )}
            </button>
          );
        })}

        <div style={{ marginTop: "auto", paddingTop: 20, fontSize: 11, color: "#5C7188" }}>
          Los 5 módulos comparten la misma base — lo que cargues en uno se refleja en el resto.
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main style={{ flex: 1, padding: "28px 32px", overflowX: "auto" }}>
        {activeModule === "calendario" && (
        <>
        <div className="module-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1
              style={{
                fontFamily: "'Familjen Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                color: COLORS.navy,
              }}
            >
              Calendario editorial
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
              Idea → Borrador → Aprobación → Publicado. Un vistazo del contenido en curso.
            </p>
          </div>
          <button
            onClick={openNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: COLORS.navy,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Plus size={16} /> Nuevo contenido
          </button>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FDECEC",
              color: "#EB2D2D",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {items === null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13, padding: 40 }}>
            <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
            Cargando calendario…
          </div>
        ) : (
          <div className="kanban-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
            {STATUSES.map((status, colIdx) => (
              <div key={status.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 2px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', monospace",
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: COLORS.inkSoft,
                    }}
                  >
                    {status.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#fff",
                      background: COLORS.navyLight,
                      borderRadius: 10,
                      padding: "1px 7px",
                      fontFamily: "'Inter', monospace",
                    }}
                  >
                    {grouped[status.id].length}
                  </span>
                </div>
                <div
                  style={{
                    height: 2,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.tech})`,
                    opacity: 0.5,
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
                  {grouped[status.id].length === 0 && (
                    <div
                      style={{
                        border: `1px dashed ${COLORS.border}`,
                        borderRadius: 10,
                        padding: "18px 10px",
                        textAlign: "center",
                        fontSize: 11.5,
                        color: "#A9B6C3",
                      }}
                    >
                      Sin piezas acá todavía
                    </div>
                  )}

                  {grouped[status.id].map((item) => {
                    const Plat = PLATFORM_META[item.platform]?.icon || Linkedin;
                    const checksDone = Object.values(item.checks || {}).filter(Boolean).length;
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 10,
                          padding: 12,
                          boxShadow: "0 1px 2px rgba(16,24,38,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div
                            onClick={() => openEdit(item)}
                            style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}
                          >
                            {item.title}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", padding: 2 }}
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {item.angle && (
                          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>{item.angle}</div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: PLATFORM_META[item.platform]?.color }}>
                            <Plat size={13} />
                            <span style={{ fontSize: 10.5, fontFamily: "'Inter', monospace", color: COLORS.inkSoft }}>
                              {item.date || "sin fecha"}
                            </span>
                          </div>
                          <div
                            title="Checklist de marca"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 10.5,
                              fontFamily: "'Inter', monospace",
                              color: checksDone === CHECKS.length ? COLORS.green : COLORS.inkSoft,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {checksDone}/{CHECKS.length}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                          <button
                            disabled={colIdx === 0}
                            onClick={() => moveItem(item.id, -1)}
                            style={navBtnStyle(colIdx === 0)}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            disabled={colIdx === STATUSES.length - 1}
                            onClick={() => moveItem(item.id, 1)}
                            style={navBtnStyle(colIdx === STATUSES.length - 1)}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 11.5, color: "#9AA9B8", display: "flex", alignItems: "center", gap: 6 }}>
          <Megaphone size={13} /> Este calendario es compartido: lo que cargues acá lo van a ver todos los que abran esta app.
        </div>
        </>
        )}

        {activeModule === "research" && (
        <>
          <div className="module-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Familjen Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  color: COLORS.navy,
                }}
              >
                Research competitivo
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
                Competencia apta para comparar contra Streambe: mismo segmento, mercado o servicios.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ display: "flex", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                <button
                  onClick={() => setCompView("cards")}
                  style={viewToggleStyle(compView === "cards")}
                  title="Vista tarjetas"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  onClick={() => setCompView("matrix")}
                  style={viewToggleStyle(compView === "matrix")}
                  title="Vista comparativa"
                >
                  <Rows3 size={14} />
                </button>
              </div>
              <button
                onClick={openNewCompetitor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: COLORS.navy,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <Plus size={16} /> Agregar competidor
              </button>
            </div>
          </div>

          {compError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FDECEC",
                color: "#EB2D2D",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={14} /> {compError}
            </div>
          )}

          {competitors === null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13, padding: 40 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Cargando research…
            </div>
          ) : competitors.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
                color: "#A9B6C3",
                fontSize: 13,
              }}
            >
              Todavía no cargaste competidores. Empezá por dabiensandco.com o Henderson Deco.
            </div>
          ) : compView === "cards" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {competitors.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: "0 1px 2px rgba(16,24,38,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div onClick={() => openEditCompetitor(c)} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={14} color={COLORS.inkSoft} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif" }}>
                          {c.name}
                        </span>
                      </div>
                      {c.website && (
                        <a
                          href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 11, color: COLORS.cyan, display: "flex", alignItems: "center", gap: 3, marginTop: 3, textDecoration: "none" }}
                        >
                          <Globe size={11} /> {c.website} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeCompetitor(c.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", padding: 2 }}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 10,
                      fontSize: 10.5,
                      fontFamily: "'Inter', monospace",
                      color: COLORS.tech,
                      background: "rgba(2,83,232,0.1)",
                      borderRadius: 6,
                      padding: "2px 7px",
                    }}
                  >
                    {c.segment}
                  </span>

                  {c.services && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {c.services.split(",").map((s) => s.trim()).filter(Boolean).map((s, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10.5,
                            background: COLORS.bg,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 6,
                            padding: "2px 7px",
                            color: COLORS.inkSoft,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {c.pricingNote && (
                    <div style={{ marginTop: 10, fontSize: 12, color: COLORS.ink }}>
                      <strong style={{ fontWeight: 600 }}>Pricing: </strong>{c.pricingNote}
                    </div>
                  )}

                  {c.differentiator && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 11.5,
                        color: COLORS.inkSoft,
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingTop: 8,
                      }}
                    >
                      <strong style={{ fontWeight: 600, color: COLORS.ink }}>Streambe vs {c.name}: </strong>
                      {c.differentiator}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: COLORS.bg }}>
                    {["Competidor", "Segmento", "Servicios", "Pricing", "Diferencial vs Streambe"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontFamily: "'Inter', monospace",
                          fontSize: 10.5,
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                          color: COLORS.inkSoft,
                          borderBottom: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c) => (
                    <tr key={c.id} onClick={() => openEditCompetitor(c)} style={{ cursor: "pointer" }}>
                      <td style={tdStyle}><strong>{c.name}</strong></td>
                      <td style={tdStyle}>{c.segment}</td>
                      <td style={tdStyle}>{c.services || "—"}</td>
                      <td style={tdStyle}>{c.pricingNote || "—"}</td>
                      <td style={tdStyle}>{c.differentiator || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
        )}

        {activeModule === "plan" && (
        <>
          {(() => {
            const total = agents ? agents.length : 6;
            const done = agents ? agents.filter((a) => a.status === "Completado").length : 0;
            const pct = Math.round((done / total) * 100);
            return (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1
                    style={{
                      fontFamily: "'Familjen Grotesk', sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      margin: 0,
                      color: COLORS.navy,
                    }}
                  >
                    Plan de marketing 2026
                  </h1>
                  <p style={{ margin: "4px 0 14px", fontSize: 13, color: COLORS.inkSoft }}>
                    Seguimiento de los 6 agentes que arman el plan completo.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 8, background: COLORS.border, borderRadius: 6, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.tech})`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "'Inter', monospace", fontSize: 12, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>
                      {done}/{total} completados
                    </span>
                  </div>
                </div>

                {agentError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#FDECEC",
                      color: "#EB2D2D",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      marginBottom: 16,
                    }}
                  >
                    <AlertCircle size={14} /> {agentError}
                  </div>
                )}

                {agents === null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13, padding: 40 }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Cargando plan…
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {agents.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => openEditAgent(a)}
                        style={{
                          background: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 12,
                          padding: 16,
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(16,24,38,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif", lineHeight: 1.3 }}>
                            {a.name}
                          </span>
                          <PenLine size={13} color="#C2CCD6" />
                        </div>

                        <div style={{ marginTop: 10 }}>
                          <StatusBadge status={a.status} />
                        </div>

                        {a.notes && (
                          <div style={{ marginTop: 10, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.4 }}>
                            {a.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </>
        )}

        {activeModule === "assets" && (
        <>
          <div className="module-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Familjen Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  margin: 0,
                  color: COLORS.navy,
                }}
              >
                Banco de assets
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
                Piezas ya aprobadas por marca, más un validador rápido de copy.
              </p>
            </div>
            <button
              onClick={openNewAsset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Plus size={16} /> Agregar asset
            </button>
          </div>

          {/* Validador de copy */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <ShieldCheck size={15} color={COLORS.tech} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif" }}>
                Validador rápido de copy
              </span>
            </div>
            <textarea
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              rows={4}
              placeholder="Pegá acá el texto del post para chequear reglas de marca…"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }}
            />
            {copyText.trim() && (() => {
              const { hits, hasBeClosing } = scanCopy(copyText);
              const clean = hits.length === 0;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: clean ? "#15803D" : "#EB2D2D",
                    }}
                  >
                    {clean ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    {clean ? "Sin palabras prohibidas detectadas" : `Ojo: aparece "${hits.join('", "')}"`}
                  </div>
                  <div style={{ fontSize: 11.5, color: hasBeClosing ? COLORS.inkSoft : "#B45309" }}>
                    {hasBeClosing
                      ? '✓ Encontré un cierre tipo "Be [adjetivo]" hacia el final'
                      : '— No detecté un cierre tipo "Be [adjetivo]" al final. Revisalo a mano.'}
                  </div>
                </div>
              );
            })()}
          </div>

          {assetError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FDECEC",
                color: "#EB2D2D",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={14} /> {assetError}
            </div>
          )}

          {assets === null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13, padding: 40 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Cargando banco de assets…
            </div>
          ) : assets.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
                color: "#A9B6C3",
                fontSize: 13,
              }}
            >
              Todavía no hay assets cargados. Sumá el logo, plantillas o imágenes ya aprobadas.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {assets.map((a) => {
                const meta = ASSET_TYPES[a.type] || ASSET_TYPES.Imagen;
                const TypeIcon = meta.icon;
                return (
                  <div
                    key={a.id}
                    style={{
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      padding: 14,
                      boxShadow: "0 1px 2px rgba(16,24,38,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div
                        onClick={() => openEditAsset(a)}
                        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${meta.color}1A`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <TypeIcon size={15} color={meta.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>{a.name}</div>
                          <div style={{ fontSize: 10.5, color: COLORS.inkSoft, fontFamily: "'Inter', monospace" }}>{a.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAsset(a.id)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", padding: 2 }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {a.link && (
                      <a
                        href={a.link.startsWith("http") ? a.link : `https://${a.link}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: COLORS.cyan,
                          marginTop: 10,
                          textDecoration: "none",
                        }}
                      >
                        <Link2 size={11} /> Abrir asset <ExternalLink size={10} />
                      </a>
                    )}

                    {a.tags && (
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {a.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              background: COLORS.bg,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: 6,
                              padding: "2px 6px",
                              color: COLORS.inkSoft,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 10 }}>
                      {a.approved ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#15803D", fontWeight: 600 }}>
                          <CheckCircle2 size={11} /> Aprobado por marca
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#B45309", fontWeight: 600 }}>
                          <Clock size={11} /> Pendiente de aprobación
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
        )}

        {activeModule === "equipo" && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h1
              style={{
                fontFamily: "'Familjen Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                color: COLORS.navy,
              }}
            >
              Aprobaciones
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
              Todo lo que está en "Aprobación" en el calendario, listo para que Vani lo revise acá.
            </p>
          </div>

          {items === null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13, padding: 40 }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Cargando…
            </div>
          ) : (
            <>
              {items.filter((it) => it.status === "aprobacion").length === 0 ? (
                <div
                  style={{
                    border: `1px dashed ${COLORS.border}`,
                    borderRadius: 12,
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#A9B6C3",
                    fontSize: 13,
                    marginBottom: 26,
                  }}
                >
                  Nada esperando revisión ahora mismo.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
                  {items.filter((it) => it.status === "aprobacion").map((item) => {
                    const Plat = PLATFORM_META[item.platform]?.icon || Linkedin;
                    const checksDone = Object.values(item.checks || {}).filter(Boolean).length;
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 12,
                          padding: 16,
                          boxShadow: "0 1px 2px rgba(16,24,38,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif" }}>
                              {item.title}
                            </div>
                            {item.angle && (
                              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>{item.angle}</div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, color: PLATFORM_META[item.platform]?.color }}>
                                <Plat size={13} />
                                <span style={{ fontSize: 10.5, fontFamily: "'Inter', monospace", color: COLORS.inkSoft }}>
                                  {item.date || "sin fecha"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 10.5,
                                  fontFamily: "'Inter', monospace",
                                  color: checksDone === CHECKS.length ? COLORS.green : "#B45309",
                                }}
                              >
                                <CheckCircle2 size={12} />
                                {checksDone}/{CHECKS.length} checklist de marca
                              </div>
                            </div>
                            {item.notes && (
                              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 8, lineHeight: 1.4 }}>{item.notes}</div>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => openChangesModal(item)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                border: `1px solid ${COLORS.border}`,
                                background: "#fff",
                                color: "#B45309",
                                borderRadius: 8,
                                padding: "8px 12px",
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <MessageSquareWarning size={13} /> Pedir cambios
                            </button>
                            <button
                              onClick={() => approveItem(item)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                border: "none",
                                background: COLORS.green,
                                color: "#fff",
                                borderRadius: 8,
                                padding: "8px 12px",
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <ThumbsUp size={13} /> Aprobar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <History size={14} color={COLORS.inkSoft} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, fontFamily: "'Familjen Grotesk', sans-serif" }}>
              Historial de revisiones
            </span>
          </div>
          {approvalsLog === null || approvalsLog.length === 0 ? (
            <div style={{ fontSize: 12, color: "#A9B6C3" }}>Todavía no hay revisiones registradas.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {approvalsLog.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    color: COLORS.inkSoft,
                    borderBottom: `1px solid ${COLORS.border}`,
                    paddingBottom: 6,
                  }}
                >
                  {log.action === "Aprobado" ? (
                    <CheckCircle2 size={13} color={COLORS.green} style={{ marginTop: 1, flexShrink: 0 }} />
                  ) : (
                    <MessageSquareWarning size={13} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
                  )}
                  <div>
                    <strong style={{ color: COLORS.ink }}>{log.itemTitle}</strong> — {log.action}
                    {log.comment && <span> · "{log.comment}"</span>}
                    <span style={{ fontFamily: "'Inter', monospace", fontSize: 10.5, marginLeft: 6, color: "#A9B6C3" }}>
                      {new Date(log.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
        )}
      </main>

      {/* ---------- Modal ---------- */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,51,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: 420,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {form.id ? "Editar contenido" : "Nuevo contenido"}
              </h2>
              <button onClick={closeModal} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>

            <FieldLabel>Título / idea</FieldLabel>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Streambe México — nombramiento de Fernando Aldana"
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Plataforma</FieldLabel>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  style={inputStyle}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Fecha</FieldLabel>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <FieldLabel>Ángulo (qué lo distingue de otras piezas)</FieldLabel>
            <input
              value={form.angle}
              onChange={(e) => setForm({ ...form, angle: e.target.value })}
              placeholder="Ej: foco en el mercado mexicano, no en la persona"
              style={inputStyle}
            />

            <FieldLabel>Notas</FieldLabel>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <FieldLabel>Checklist de marca</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
              {CHECKS.map((c) => {
                const checked = !!form.checks?.[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCheck(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: "4px 2px",
                      textAlign: "left",
                      fontSize: 12.5,
                      color: checked ? COLORS.ink : COLORS.inkSoft,
                    }}
                  >
                    {checked ? (
                      <CheckCircle2 size={16} color={COLORS.green} />
                    ) : (
                      <Circle size={16} color="#C2CCD6" />
                    )}
                    {c.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={saveForm}
              disabled={saving || !form.title.trim()}
              style={{
                width: "100%",
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                opacity: saving || !form.title.trim() ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Agregar al calendario"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal competidor ---------- */}
      {compModalOpen && (
        <div
          onClick={closeCompModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,51,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: 460,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {compForm.id ? "Editar competidor" : "Nuevo competidor"}
              </h2>
              <button onClick={closeCompModal} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>

            <FieldLabel>Nombre</FieldLabel>
            <input
              value={compForm.name}
              onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
              placeholder="Ej: Henderson Deco"
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Sitio web</FieldLabel>
                <input
                  value={compForm.website}
                  onChange={(e) => setCompForm({ ...compForm, website: e.target.value })}
                  placeholder="ejemplo.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Segmento</FieldLabel>
                <select
                  value={compForm.segment}
                  onChange={(e) => setCompForm({ ...compForm, segment: e.target.value })}
                  style={inputStyle}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <FieldLabel>Servicios (separados por coma)</FieldLabel>
            <input
              value={compForm.services}
              onChange={(e) => setCompForm({ ...compForm, services: e.target.value })}
              placeholder="Ej: Desarrollo web, Apps móviles, Staff aug"
              style={inputStyle}
            />

            <FieldLabel>Pricing / condiciones comerciales</FieldLabel>
            <input
              value={compForm.pricingNote}
              onChange={(e) => setCompForm({ ...compForm, pricingNote: e.target.value })}
              placeholder="Ej: tarifa por hora más baja, sin mínimo mensual"
              style={inputStyle}
            />

            <FieldLabel>Fortalezas</FieldLabel>
            <textarea
              value={compForm.strengths}
              onChange={(e) => setCompForm({ ...compForm, strengths: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <FieldLabel>Debilidades</FieldLabel>
            <textarea
              value={compForm.weaknesses}
              onChange={(e) => setCompForm({ ...compForm, weaknesses: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <FieldLabel>Diferencial de Streambe frente a este competidor</FieldLabel>
            <textarea
              value={compForm.differentiator}
              onChange={(e) => setCompForm({ ...compForm, differentiator: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}
            />

            <button
              onClick={saveCompForm}
              disabled={compSaving || !compForm.name.trim()}
              style={{
                width: "100%",
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: compSaving ? "default" : "pointer",
                opacity: compSaving || !compForm.name.trim() ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {compSaving ? "Guardando…" : compForm.id ? "Guardar cambios" : "Agregar a la comparativa"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal agente del plan ---------- */}
      {agentModalOpen && agentForm && (
        <div
          onClick={closeAgentModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,51,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: 420,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {agentForm.name}
              </h2>
              <button onClick={closeAgentModal} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>

            <FieldLabel>Estado</FieldLabel>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              {PLAN_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setAgentForm({ ...agentForm, status: s })}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `1px solid ${agentForm.status === s ? "transparent" : COLORS.border}`,
                    background: agentForm.status === s ? statusColor(s).bg : "#fff",
                    color: agentForm.status === s ? statusColor(s).text : COLORS.inkSoft,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <FieldLabel>Notas / avance</FieldLabel>
            <textarea
              value={agentForm.notes}
              onChange={(e) => setAgentForm({ ...agentForm, notes: e.target.value })}
              rows={4}
              placeholder="Qué se definió, qué falta, próximos pasos…"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}
            />

            <button
              onClick={saveAgentForm}
              disabled={agentSaving}
              style={{
                width: "100%",
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: agentSaving ? "default" : "pointer",
                opacity: agentSaving ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {agentSaving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal asset ---------- */}
      {assetModalOpen && (
        <div
          onClick={closeAssetModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,51,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: 420,
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {assetForm.id ? "Editar asset" : "Nuevo asset"}
              </h2>
              <button onClick={closeAssetModal} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>

            <FieldLabel>Nombre</FieldLabel>
            <input
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              placeholder="Ej: Logo Streambe México horizontal"
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Tipo</FieldLabel>
                <select
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                  style={inputStyle}
                >
                  {Object.keys(ASSET_TYPES).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Estado</FieldLabel>
                <select
                  value={assetForm.approved ? "si" : "no"}
                  onChange={(e) => setAssetForm({ ...assetForm, approved: e.target.value === "si" })}
                  style={inputStyle}
                >
                  <option value="si">Aprobado por marca</option>
                  <option value="no">Pendiente de aprobación</option>
                </select>
              </div>
            </div>

            <FieldLabel>Link (Drive, Canva, etc.)</FieldLabel>
            <input
              value={assetForm.link}
              onChange={(e) => setAssetForm({ ...assetForm, link: e.target.value })}
              placeholder="https://drive.google.com/…"
              style={inputStyle}
            />

            <FieldLabel>Tags (separados por coma)</FieldLabel>
            <input
              value={assetForm.tags}
              onChange={(e) => setAssetForm({ ...assetForm, tags: e.target.value })}
              placeholder="Ej: México, LinkedIn, cover"
              style={inputStyle}
            />

            <FieldLabel>Notas</FieldLabel>
            <textarea
              value={assetForm.notes}
              onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}
            />

            <button
              onClick={saveAssetForm}
              disabled={assetSaving || !assetForm.name.trim()}
              style={{
                width: "100%",
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: assetSaving ? "default" : "pointer",
                opacity: assetSaving || !assetForm.name.trim() ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {assetSaving ? "Guardando…" : assetForm.id ? "Guardar cambios" : "Agregar al banco"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal pedir cambios ---------- */}
      {changesModalOpen && changesTarget && (
        <div
          onClick={closeChangesModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,30,51,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              width: 400,
              maxWidth: "90vw",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                Pedir cambios
              </h2>
              <button onClick={closeChangesModal} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 0 }}>
              "{changesTarget.title}" vuelve a <strong>Borrador</strong> con tu comentario adjunto.
            </p>

            <FieldLabel>Qué hay que ajustar</FieldLabel>
            <textarea
              value={changesComment}
              onChange={(e) => setChangesComment(e.target.value)}
              rows={4}
              placeholder="Ej: falta el cierre Be [adjetivo], revisar ángulo…"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}
            />

            <button
              onClick={submitChanges}
              style={{
                width: "100%",
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Enviar a borrador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontFamily: "'Inter', monospace",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 6,
        background: c.bg,
        color: c.text,
      }}
    >
      {status === "Completado" && <CheckCircle2 size={11} />}
      {status === "En curso" && <Clock size={11} />}
      {status === "Pendiente" && <Circle size={11} />}
      {status}
    </span>
  );
}

function statusColor(status) {
  if (status === "Completado") return { bg: "rgba(41,201,39,0.12)", text: "#15803D" };
  if (status === "En curso") return { bg: "rgba(245,158,11,0.14)", text: "#B45309" };
  return { bg: "#EEF1F5", text: "#5B6B7C" };
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: "#5B6B7C", margin: "10px 0 5px", textTransform: "uppercase", letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid #E8E8E3",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 13,
  fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
  color: "#101826",
  outline: "none",
};

function navBtnStyle(disabled) {
  return {
    border: "1px solid #E8E8E3",
    background: disabled ? "#F3F6FA" : "#fff",
    borderRadius: 6,
    padding: "3px 6px",
    cursor: disabled ? "default" : "pointer",
    color: disabled ? "#C2CCD6" : "#5B6B7C",
    display: "flex",
  };
}

function viewToggleStyle(selected) {
  return {
    border: "none",
    background: selected ? "#0B1E33" : "#fff",
    color: selected ? "#fff" : "#5B6B7C",
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  };
}

const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #E8E8E3",
  color: "#101826",
  verticalAlign: "top",
};
