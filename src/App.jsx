import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Linkedin, Instagram, Calendar, ChevronRight, ChevronLeft,
  Trash2, CheckCircle2, Circle, LayoutGrid, Search, Sparkles,
  ClipboardList, Users, Megaphone, Loader2, AlertCircle, Globe,
  Rows3, LayoutList, Building2, ExternalLink, Clock, PenLine,
  Image, FileText, Video, Shapes, Link2, ShieldCheck, ShieldAlert,
  ThumbsUp, MessageSquareWarning, History, BookOpen, Download, Upload,
  Lightbulb, Hash, Award, CalendarDays, MessageSquare, UserCircle2,
  Settings, ArrowRight, BarChart3
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
  { id: "dashboard", label: "Resumen", icon: BarChart3, active: true },
  { id: "calendario", label: "Calendario editorial", icon: Calendar, active: true },
  { id: "research", label: "Research competitivo", icon: Search, active: true },
  { id: "assets", label: "Banco de assets", icon: Sparkles, active: true },
  { id: "recursos", label: "Recursos de marca", icon: BookOpen, active: true },
  { id: "equipo", label: "Equipo", icon: Users, active: true },
];

const STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "borrador", label: "Borrador" },
  { id: "aprobacion", label: "Aprobación" },
  { id: "publicado", label: "Publicado" },
];

const CONTENT_STATUS_META = {
  idea: { label: "Idea", bg: "#EEF1F5", text: "#5B6B7C" },
  borrador: { label: "Borrador", bg: "rgba(245,158,11,0.14)", text: "#B45309" },
  aprobacion: { label: "Aprobación", bg: "rgba(2,83,232,0.1)", text: "#0253E8" },
  publicado: { label: "Publicado", bg: "rgba(41,201,39,0.12)", text: "#15803D" },
};

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
  owner: "",
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

/* ---------- Herramientas nuevas del área ---------- */
const IDEAS_KEY = "content-ideas";
const DATES_KEY = "key-dates";
const PERSONAS_KEY = "buyer-personas";
const CASES_KEY = "client-cases";
const HASHTAGS_KEY = "hashtag-library";
const NOTES_KEY = "team-notes";

const ALL_STORAGE_KEYS = [
  STORAGE_KEY, COMPETITORS_KEY, ASSETS_KEY, APPROVALS_LOG_KEY,
  IDEAS_KEY, DATES_KEY, PERSONAS_KEY, CASES_KEY, HASHTAGS_KEY, NOTES_KEY,
];

const emptyPersona = () => ({ id: null, name: "", market: "", description: "", painPoints: "", channels: "" });
const emptyCase = () => ({ id: null, client: "", industry: "", summary: "", results: "", link: "" });
const emptyIdea = () => ({ id: null, text: "", tags: "" });
const emptyKeyDate = () => ({ id: null, date: "", title: "", notes: "" });
const emptyNote = () => ({ id: null, author: "", text: "" });

export default function StreambeOpsHub() {
  const [activeModule, setActiveModule] = useState("dashboard");

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [calView, setCalView] = useState("tablero"); // "tablero" | "fechas"

  const [competitors, setCompetitors] = useState(null);
  const [compError, setCompError] = useState(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compForm, setCompForm] = useState(emptyCompetitor());
  const [compSaving, setCompSaving] = useState(false);
  const [compView, setCompView] = useState("cards"); // "cards" | "matrix"

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

  const [ideas, setIdeas] = useState(null);
  const [ideaFormText, setIdeaFormText] = useState("");
  const [ideaFormTags, setIdeaFormTags] = useState("");

  const [keyDates, setKeyDates] = useState(null);
  const [kdFormDate, setKdFormDate] = useState("");
  const [kdFormTitle, setKdFormTitle] = useState("");
  const [kdFormNotes, setKdFormNotes] = useState("");

  const [personas, setPersonas] = useState(null);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [personaForm, setPersonaForm] = useState(emptyPersona());
  const [personaSaving, setPersonaSaving] = useState(false);

  const [cases, setCases] = useState(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseForm, setCaseForm] = useState(emptyCase());
  const [caseSaving, setCaseSaving] = useState(false);

  const [hashtags, setHashtags] = useState(null);
  const [htFormTag, setHtFormTag] = useState("");
  const [htFormCategory, setHtFormCategory] = useState("");

  const [teamNotes, setTeamNotes] = useState(null);
  const [noteFormAuthor, setNoteFormAuthor] = useState("");
  const [noteFormText, setNoteFormText] = useState("");

  const [recursosTab, setRecursosTab] = useState("personas"); // "personas" | "casos" | "hashtags"
  const [equipoTab, setEquipoTab] = useState("aprobaciones"); // "aprobaciones" | "carga" | "notas"
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);

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
      try {
        const r = await window.storage.get(IDEAS_KEY, true);
        setIdeas(r ? JSON.parse(r.value) : []);
      } catch { setIdeas([]); }
      try {
        const r = await window.storage.get(DATES_KEY, true);
        setKeyDates(r ? JSON.parse(r.value) : []);
      } catch { setKeyDates([]); }
      try {
        const r = await window.storage.get(PERSONAS_KEY, true);
        setPersonas(r ? JSON.parse(r.value) : []);
      } catch { setPersonas([]); }
      try {
        const r = await window.storage.get(CASES_KEY, true);
        setCases(r ? JSON.parse(r.value) : []);
      } catch { setCases([]); }
      try {
        const r = await window.storage.get(HASHTAGS_KEY, true);
        setHashtags(r ? JSON.parse(r.value) : []);
      } catch { setHashtags([]); }
      try {
        const r = await window.storage.get(NOTES_KEY, true);
        setTeamNotes(r ? JSON.parse(r.value) : []);
      } catch { setTeamNotes([]); }
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

  const openNewForApproval = () => {
    setForm({ ...emptyForm(), status: "aprobacion" });
    setModalOpen(true);
  };

  const sendToReview = async (item) => {
    const next = items.map((it) => (it.id === item.id ? { ...it, status: "aprobacion" } : it));
    await persist(next);
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

  /* ---------- Banco de ideas ---------- */
  const persistIdeas = async (next) => {
    setIdeas(next);
    try { await window.storage.set(IDEAS_KEY, JSON.stringify(next), true); } catch {}
  };
  const addIdea = async () => {
    if (!ideaFormText.trim()) return;
    await persistIdeas([...(ideas || []), { id: crypto.randomUUID(), text: ideaFormText, tags: ideaFormTags }]);
    setIdeaFormText("");
    setIdeaFormTags("");
  };
  const removeIdea = async (id) => {
    await persistIdeas((ideas || []).filter((i) => i.id !== id));
  };
  const promoteIdea = async (idea) => {
    const newItem = { ...emptyForm(), id: crypto.randomUUID(), title: idea.text, status: "idea" };
    await persist([...(items || []), newItem]);
    await removeIdea(idea.id);
    setActiveModule("calendario");
  };

  /* ---------- Fechas clave ---------- */
  const persistKeyDates = async (next) => {
    setKeyDates(next);
    try { await window.storage.set(DATES_KEY, JSON.stringify(next), true); } catch {}
  };
  const addKeyDate = async () => {
    if (!kdFormDate || !kdFormTitle.trim()) return;
    const next = [...(keyDates || []), { id: crypto.randomUUID(), date: kdFormDate, title: kdFormTitle, notes: kdFormNotes }];
    next.sort((a, b) => a.date.localeCompare(b.date));
    await persistKeyDates(next);
    setKdFormDate(""); setKdFormTitle(""); setKdFormNotes("");
  };
  const removeKeyDate = async (id) => {
    await persistKeyDates((keyDates || []).filter((d) => d.id !== id));
  };

  /* ---------- Buyer personas ---------- */
  const persistPersonas = async (next) => {
    setPersonas(next);
    try { await window.storage.set(PERSONAS_KEY, JSON.stringify(next), true); } catch {}
  };
  const openNewPersona = () => { setPersonaForm(emptyPersona()); setPersonaModalOpen(true); };
  const openEditPersona = (p) => { setPersonaForm(p); setPersonaModalOpen(true); };
  const savePersonaForm = async () => {
    if (!personaForm.name.trim()) return;
    setPersonaSaving(true);
    let next;
    if (personaForm.id) next = personas.map((p) => (p.id === personaForm.id ? personaForm : p));
    else next = [...personas, { ...personaForm, id: crypto.randomUUID() }];
    await persistPersonas(next);
    setPersonaSaving(false);
    setPersonaModalOpen(false);
  };
  const removePersona = async (id) => {
    await persistPersonas(personas.filter((p) => p.id !== id));
  };

  /* ---------- Casos de éxito ---------- */
  const persistCases = async (next) => {
    setCases(next);
    try { await window.storage.set(CASES_KEY, JSON.stringify(next), true); } catch {}
  };
  const openNewCase = () => { setCaseForm(emptyCase()); setCaseModalOpen(true); };
  const openEditCase = (c) => { setCaseForm(c); setCaseModalOpen(true); };
  const saveCaseForm = async () => {
    if (!caseForm.client.trim()) return;
    setCaseSaving(true);
    let next;
    if (caseForm.id) next = cases.map((c) => (c.id === caseForm.id ? caseForm : c));
    else next = [...cases, { ...caseForm, id: crypto.randomUUID() }];
    await persistCases(next);
    setCaseSaving(false);
    setCaseModalOpen(false);
  };
  const removeCase = async (id) => {
    await persistCases(cases.filter((c) => c.id !== id));
  };

  /* ---------- Biblioteca de hashtags ---------- */
  const persistHashtags = async (next) => {
    setHashtags(next);
    try { await window.storage.set(HASHTAGS_KEY, JSON.stringify(next), true); } catch {}
  };
  const addHashtag = async () => {
    if (!htFormTag.trim()) return;
    const tag = htFormTag.trim().replace(/^#/, "");
    await persistHashtags([...(hashtags || []), { id: crypto.randomUUID(), tag, category: htFormCategory }]);
    setHtFormTag(""); setHtFormCategory("");
  };
  const removeHashtag = async (id) => {
    await persistHashtags((hashtags || []).filter((h) => h.id !== id));
  };

  /* ---------- Notas del equipo ---------- */
  const persistNotes = async (next) => {
    setTeamNotes(next);
    try { await window.storage.set(NOTES_KEY, JSON.stringify(next), true); } catch {}
  };
  const addNote = async () => {
    if (!noteFormText.trim()) return;
    const next = [{ id: crypto.randomUUID(), author: noteFormAuthor || "Sin firma", text: noteFormText, date: new Date().toISOString() }, ...(teamNotes || [])];
    await persistNotes(next);
    setNoteFormText("");
  };
  const removeNote = async (id) => {
    await persistNotes((teamNotes || []).filter((n) => n.id !== id));
  };

  /* ---------- Backup ---------- */
  const exportBackup = async () => {
    const data = {};
    for (const key of ALL_STORAGE_KEYS) {
      try {
        const r = await window.storage.get(key, true);
        data[key] = r ? r.value : null;
      } catch {
        data[key] = null;
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streambe-ops-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage({ type: "ok", text: "Backup descargado." });
  };

  const importBackup = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const key of ALL_STORAGE_KEYS) {
        if (data[key] !== undefined && data[key] !== null) {
          await window.storage.set(key, data[key], true);
        }
      }
      setBackupMessage({ type: "ok", text: "Backup restaurado. Recargando…" });
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setBackupMessage({ type: "error", text: "No se pudo leer el archivo. ¿Es un backup válido?" });
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: COLORS.bg,
        minHeight: "600px",
        display: "flex",
        color: COLORS.ink,
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* ---------- Sidebar ---------- */}
      <aside
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
              onClick={() => m.active && setActiveModule(m.id)}
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

        <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { setBackupMessage(null); setBackupModalOpen(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "9px 12px",
              color: "#C7D2DD",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Settings size={14} /> Backup de datos
          </button>
          <div style={{ fontSize: 11, color: "#5C7188" }}>
            Los módulos comparten la misma base — lo que cargues en uno se refleja en el resto.
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main style={{ flex: 1, padding: "28px 32px", overflowX: "auto" }}>
        {activeModule === "dashboard" && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 22, fontWeight: 700, margin: 0, color: COLORS.navy }}>
              Resumen
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
              Una foto de todo lo que está pasando ahora mismo en la app.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Ideas en el banco", value: (ideas || []).length, icon: Lightbulb, color: COLORS.tech, module: "calendario" },
              { label: "En calendario", value: (items || []).length, icon: Calendar, color: COLORS.cyan, module: "calendario" },
              { label: "Esperando aprobación", value: (items || []).filter((it) => it.status === "aprobacion").length, icon: ThumbsUp, color: COLORS.amber, module: "equipo" },
              { label: "Publicados", value: (items || []).filter((it) => it.status === "publicado").length, icon: CheckCircle2, color: COLORS.green, module: "calendario" },
              { label: "Competidores", value: (competitors || []).length, icon: Search, color: COLORS.tech, module: "research" },
              { label: "Assets aprobados", value: (assets || []).filter((a) => a.approved).length, icon: Sparkles, color: COLORS.cyan, module: "assets" },
              { label: "Buyer personas", value: (personas || []).length, icon: UserCircle2, color: COLORS.tech, module: "recursos" },
              { label: "Casos de éxito", value: (cases || []).length, icon: Award, color: COLORS.amber, module: "recursos" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  onClick={() => setActiveModule(s.module)}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={16} color={s.color} />
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, fontFamily: "'Familjen Grotesk', sans-serif", marginTop: 8 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <CalendarDays size={14} color={COLORS.inkSoft} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, fontFamily: "'Familjen Grotesk', sans-serif" }}>
                  Próximas fechas clave
                </span>
              </div>
              {(keyDates || []).filter((d) => d.date >= new Date().toISOString().slice(0, 10)).length === 0 ? (
                <div style={{ fontSize: 12, color: "#A9B6C3" }}>No hay fechas próximas cargadas.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(keyDates || [])
                    .filter((d) => d.date >= new Date().toISOString().slice(0, 10))
                    .slice(0, 5)
                    .map((d) => (
                      <div key={d.id} style={{ display: "flex", gap: 8, fontSize: 12.5, color: COLORS.ink }}>
                        <span style={{ fontFamily: "'Inter', monospace", color: COLORS.tech, flexShrink: 0 }}>
                          {new Date(d.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </span>
                        {d.title}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <MessageSquare size={14} color={COLORS.inkSoft} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, fontFamily: "'Familjen Grotesk', sans-serif" }}>
                  Últimas notas del equipo
                </span>
              </div>
              {(teamNotes || []).length === 0 ? (
                <div style={{ fontSize: 12, color: "#A9B6C3" }}>Todavía no hay notas.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(teamNotes || []).slice(0, 4).map((n) => (
                    <div key={n.id} style={{ fontSize: 12.5, color: COLORS.ink }}>
                      <strong>{n.author}:</strong> {n.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
        )}

        {activeModule === "calendario" && (
        <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
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
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => setCalView("tablero")}
                style={viewToggleStyle(calView === "tablero")}
                title="Vista tablero"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setCalView("fechas")}
                style={viewToggleStyle(calView === "fechas")}
                title="Vista de fechas"
              >
                <Calendar size={14} />
              </button>
              <button
                onClick={() => setCalView("ideas")}
                style={viewToggleStyle(calView === "ideas")}
                title="Banco de ideas"
              >
                <Lightbulb size={14} />
              </button>
              <button
                onClick={() => setCalView("clave")}
                style={viewToggleStyle(calView === "clave")}
                title="Fechas clave del año"
              >
                <CalendarDays size={14} />
              </button>
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
        ) : calView === "tablero" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 16 }}>
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
        ) : calView === "fechas" ? (
          <DateView items={items} onOpenItem={openEdit} />
        ) : calView === "ideas" ? (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                value={ideaFormText}
                onChange={(e) => setIdeaFormText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addIdea()}
                placeholder="Nueva idea suelta…"
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                value={ideaFormTags}
                onChange={(e) => setIdeaFormTags(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addIdea()}
                placeholder="Tags (opcional)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={addIdea}
                style={{ border: "none", background: COLORS.navy, color: "#fff", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 600 }}
              >
                <Plus size={16} />
              </button>
            </div>
            {(ideas || []).length === 0 ? (
              <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                Tirá acá cualquier idea suelta, sin necesidad de fecha ni formato todavía.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ideas.map((idea) => (
                  <div key={idea.id} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                    <Lightbulb size={14} color={COLORS.tech} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: COLORS.ink }}>{idea.text}</div>
                      {idea.tags && <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 2 }}>{idea.tags}</div>}
                    </div>
                    <button
                      onClick={() => promoteIdea(idea)}
                      title="Pasar al calendario como idea"
                      style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${COLORS.border}`, background: "#fff", borderRadius: 7, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, color: COLORS.navy, cursor: "pointer", flexShrink: 0 }}
                    >
                      Pasar al calendario <ArrowRight size={12} />
                    </button>
                    <button onClick={() => removeIdea(idea.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="date"
                value={kdFormDate}
                onChange={(e) => setKdFormDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                value={kdFormTitle}
                onChange={(e) => setKdFormTitle(e.target.value)}
                placeholder="Ej: Día del Programador"
                style={{ ...inputStyle, flex: 2 }}
              />
              <button
                onClick={addKeyDate}
                style={{ border: "none", background: COLORS.navy, color: "#fff", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 600 }}
              >
                <Plus size={16} />
              </button>
            </div>
            {(keyDates || []).length === 0 ? (
              <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                Cargá efemérides, feriados o eventos de la industria para planificar con anticipación.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {keyDates.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontFamily: "'Inter', monospace", fontSize: 12, color: COLORS.tech, flexShrink: 0 }}>
                      {new Date(d.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>{d.title}</span>
                    <button onClick={() => removeKeyDate(d.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 11.5, color: "#9AA9B8", display: "flex", alignItems: "center", gap: 6 }}>
          <Megaphone size={13} /> Los datos se guardan en este navegador. Si abrís la app en otra compu, no vas a ver lo mismo (ver README).
        </div>
        </>
        )}

        {activeModule === "research" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
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

        {activeModule === "assets" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
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

        {activeModule === "recursos" && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 22, fontWeight: 700, margin: 0, color: COLORS.navy }}>
              Recursos de marca
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
              Conocimiento reutilizable: a quién le hablamos, con qué casos, con qué palabras.
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
            {[
              { id: "personas", label: "Buyer personas" },
              { id: "casos", label: "Casos de éxito" },
              { id: "hashtags", label: "Hashtags & keywords" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setRecursosTab(t.id)}
                style={{
                  border: "none",
                  background: "none",
                  padding: "10px 4px",
                  marginRight: 18,
                  fontSize: 13,
                  fontWeight: 600,
                  color: recursosTab === t.id ? COLORS.navy : COLORS.inkSoft,
                  borderBottom: recursosTab === t.id ? `2px solid ${COLORS.tech}` : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {recursosTab === "personas" && (
            <>
              <button
                onClick={openNewPersona}
                style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}
              >
                <Plus size={16} /> Agregar buyer persona
              </button>
              {(personas || []).length === 0 ? (
                <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                  Definí a quién le hablás en cada mercado (Argentina, Uruguay, Paraguay, España, EE.UU.).
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {personas.map((p) => (
                    <div key={p.id} onClick={() => openEditPersona(p)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <UserCircle2 size={15} color={COLORS.tech} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif" }}>{p.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removePersona(p.id); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {p.market && <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 4, fontFamily: "'Inter', monospace" }}>{p.market}</div>}
                      {p.description && <div style={{ fontSize: 12, color: COLORS.ink, marginTop: 8 }}>{p.description}</div>}
                      {p.painPoints && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}><strong>Dolores:</strong> {p.painPoints}</div>}
                      {p.channels && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}><strong>Canales:</strong> {p.channels}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {recursosTab === "casos" && (
            <>
              <button
                onClick={openNewCase}
                style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}
              >
                <Plus size={16} /> Agregar caso de éxito
              </button>
              {(cases || []).length === 0 ? (
                <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                  Cargá Navent, YPF, Roemmers y los que se vayan sumando.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {cases.map((c) => (
                    <div key={c.id} onClick={() => openEditCase(c)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Award size={14} color={COLORS.amber} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: "'Familjen Grotesk', sans-serif" }}>{c.client}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeCase(c.id); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {c.industry && <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 4, fontFamily: "'Inter', monospace" }}>{c.industry}</div>}
                      {c.summary && <div style={{ fontSize: 12, color: COLORS.ink, marginTop: 8 }}>{c.summary}</div>}
                      {c.results && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}><strong>Resultados:</strong> {c.results}</div>}
                      {c.link && (
                        <a href={c.link.startsWith("http") ? c.link : `https://${c.link}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: COLORS.cyan, display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                          <Link2 size={11} /> Abrir <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {recursosTab === "hashtags" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, maxWidth: 500 }}>
                <input
                  value={htFormTag}
                  onChange={(e) => setHtFormTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                  placeholder="hashtag o keyword"
                  style={{ ...inputStyle, flex: 2 }}
                />
                <input
                  value={htFormCategory}
                  onChange={(e) => setHtFormCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                  placeholder="Categoría"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addHashtag} style={{ border: "none", background: COLORS.navy, color: "#fff", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 600 }}>
                  <Plus size={16} />
                </button>
              </div>
              {(hashtags || []).length === 0 ? (
                <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                  Sumá los hashtags y palabras clave que más usás, para no repetir siempre los mismos.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {hashtags.map((h) => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "6px 12px" }}>
                      <Hash size={12} color={COLORS.tech} />
                      <span style={{ fontSize: 12.5, color: COLORS.ink }}>{h.tag}</span>
                      {h.category && <span style={{ fontSize: 10, color: COLORS.inkSoft }}>· {h.category}</span>}
                      <button onClick={() => removeHashtag(h.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6", padding: 0, display: "flex" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
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
              Equipo
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.inkSoft }}>
              Aprobaciones, quién tiene qué asignado, y avisos generales.
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
            {[
              { id: "aprobaciones", label: "Aprobaciones" },
              { id: "carga", label: "Carga de trabajo" },
              { id: "notas", label: "Notas del equipo" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setEquipoTab(t.id)}
                style={{
                  border: "none",
                  background: "none",
                  padding: "10px 4px",
                  marginRight: 18,
                  fontSize: 13,
                  fontWeight: 600,
                  color: equipoTab === t.id ? COLORS.navy : COLORS.inkSoft,
                  borderBottom: equipoTab === t.id ? `2px solid ${COLORS.tech}` : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {equipoTab === "aprobaciones" && (
          <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setPickerOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#fff",
                  color: COLORS.navy,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <Calendar size={15} /> Traer del calendario
              </button>
              <button
                onClick={openNewForApproval}
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
                <Plus size={16} /> Cargar para revisión
              </button>
            </div>
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
                  Nada esperando revisión ahora mismo. Usá "Traer del calendario" para elegir algo que ya tenés como idea o borrador, o "Cargar para revisión" para algo nuevo.
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

          {equipoTab === "carga" && (() => {
            const byOwner = {};
            (items || []).forEach((it) => {
              const owner = it.owner?.trim() || "Sin asignar";
              if (!byOwner[owner]) byOwner[owner] = [];
              byOwner[owner].push(it);
            });
            const owners = Object.keys(byOwner).sort((a, b) => (a === "Sin asignar" ? 1 : b === "Sin asignar" ? -1 : a.localeCompare(b)));
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {items === null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.inkSoft, fontSize: 13 }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Cargando…
                  </div>
                ) : owners.length === 0 ? (
                  <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                    No hay contenido cargado todavía.
                  </div>
                ) : (
                  owners.map((owner) => (
                    <div key={owner}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <UserCircle2 size={14} color={owner === "Sin asignar" ? "#A9B6C3" : COLORS.tech} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, fontFamily: "'Familjen Grotesk', sans-serif" }}>{owner}</span>
                        <span style={{ fontSize: 10.5, fontFamily: "'Inter', monospace", color: COLORS.inkSoft }}>{byOwner[owner].length} piezas</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {byOwner[owner].map((it) => {
                          const meta = CONTENT_STATUS_META[it.status];
                          return (
                            <div key={it.id} onClick={() => openEdit(it)} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                              <span style={{ flex: 1, fontSize: 12.5, color: COLORS.ink }}>{it.title}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: meta.bg, color: meta.text }}>{meta.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}

          {equipoTab === "notas" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  value={noteFormAuthor}
                  onChange={(e) => setNoteFormAuthor(e.target.value)}
                  placeholder="Tu nombre"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  value={noteFormText}
                  onChange={(e) => setNoteFormText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Escribí un aviso para el equipo…"
                  style={{ ...inputStyle, flex: 2 }}
                />
                <button onClick={addNote} style={{ border: "none", background: COLORS.navy, color: "#fff", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 600 }}>
                  <Plus size={16} />
                </button>
              </div>
              {(teamNotes || []).length === 0 ? (
                <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", color: "#A9B6C3", fontSize: 13 }}>
                  Todavía no hay avisos cargados.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {teamNotes.map((n) => (
                    <div key={n.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 12.5, color: COLORS.ink }}>
                          <strong>{n.author}</strong>
                          <span style={{ fontSize: 10.5, color: "#A9B6C3", marginLeft: 8, fontFamily: "'Inter', monospace" }}>
                            {new Date(n.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <button onClick={() => removeNote(n.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#C2CCD6" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 4 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
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

            <FieldLabel>Responsable (opcional)</FieldLabel>
            <input
              value={form.owner || ""}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Ej: Vani"
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

      {/* ---------- Modal traer del calendario ---------- */}
      {pickerOpen && (
        <div
          onClick={() => setPickerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16,25,43,0.45)",
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
              maxHeight: "80vh",
              overflowY: "auto",
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                Traer del calendario
              </h2>
              <button onClick={() => setPickerOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
              Elegí una idea o un borrador para mandarlo directo a revisión.
            </p>

            {(() => {
              const pending = (items || []).filter((it) => it.status === "idea" || it.status === "borrador");
              if (pending.length === 0) {
                return (
                  <div
                    style={{
                      border: `1px dashed ${COLORS.border}`,
                      borderRadius: 10,
                      padding: "24px 14px",
                      textAlign: "center",
                      color: "#A9B6C3",
                      fontSize: 12.5,
                    }}
                  >
                    No hay ideas ni borradores esperando en el calendario ahora mismo.
                  </div>
                );
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pending.map((item) => {
                    const Plat = PLATFORM_META[item.platform]?.icon;
                    const meta = CONTENT_STATUS_META[item.status];
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        {Plat && <Plat size={14} color={PLATFORM_META[item.platform]?.color} style={{ flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.title}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: 5,
                              background: meta.bg,
                              color: meta.text,
                            }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            await sendToReview(item);
                            setPickerOpen(false);
                          }}
                          style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            border: "none",
                            background: COLORS.navy,
                            color: "#fff",
                            borderRadius: 7,
                            padding: "7px 11px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Enviar <ChevronRight size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------- Modal buyer persona ---------- */}
      {personaModalOpen && (
        <div onClick={() => setPersonaModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,25,43,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 440, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", padding: 22, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {personaForm.id ? "Editar buyer persona" : "Nueva buyer persona"}
              </h2>
              <button onClick={() => setPersonaModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>
            <FieldLabel>Nombre</FieldLabel>
            <input value={personaForm.name} onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })} placeholder="Ej: Gerente de IT en pyme" style={inputStyle} />
            <FieldLabel>Mercado</FieldLabel>
            <input value={personaForm.market} onChange={(e) => setPersonaForm({ ...personaForm, market: e.target.value })} placeholder="Ej: Argentina, Uruguay, España…" style={inputStyle} />
            <FieldLabel>Descripción</FieldLabel>
            <textarea value={personaForm.description} onChange={(e) => setPersonaForm({ ...personaForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <FieldLabel>Dolores / necesidades</FieldLabel>
            <textarea value={personaForm.painPoints} onChange={(e) => setPersonaForm({ ...personaForm, painPoints: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <FieldLabel>Canales donde está</FieldLabel>
            <input value={personaForm.channels} onChange={(e) => setPersonaForm({ ...personaForm, channels: e.target.value })} placeholder="Ej: LinkedIn, eventos de industria" style={{ ...inputStyle, marginBottom: 18 }} />
            <button onClick={savePersonaForm} disabled={personaSaving || !personaForm.name.trim()} style={{ width: "100%", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: personaSaving || !personaForm.name.trim() ? 0.6 : 1 }}>
              {personaSaving ? "Guardando…" : personaForm.id ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal caso de éxito ---------- */}
      {caseModalOpen && (
        <div onClick={() => setCaseModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,25,43,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 440, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", padding: 22, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                {caseForm.id ? "Editar caso de éxito" : "Nuevo caso de éxito"}
              </h2>
              <button onClick={() => setCaseModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>
            <FieldLabel>Cliente</FieldLabel>
            <input value={caseForm.client} onChange={(e) => setCaseForm({ ...caseForm, client: e.target.value })} placeholder="Ej: YPF" style={inputStyle} />
            <FieldLabel>Industria</FieldLabel>
            <input value={caseForm.industry} onChange={(e) => setCaseForm({ ...caseForm, industry: e.target.value })} placeholder="Ej: Energía" style={inputStyle} />
            <FieldLabel>Resumen del proyecto</FieldLabel>
            <textarea value={caseForm.summary} onChange={(e) => setCaseForm({ ...caseForm, summary: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <FieldLabel>Resultados</FieldLabel>
            <textarea value={caseForm.results} onChange={(e) => setCaseForm({ ...caseForm, results: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <FieldLabel>Link (case study, portfolio, etc.)</FieldLabel>
            <input value={caseForm.link} onChange={(e) => setCaseForm({ ...caseForm, link: e.target.value })} placeholder="https://…" style={{ ...inputStyle, marginBottom: 18 }} />
            <button onClick={saveCaseForm} disabled={caseSaving || !caseForm.client.trim()} style={{ width: "100%", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: caseSaving || !caseForm.client.trim() ? 0.6 : 1 }}>
              {caseSaving ? "Guardando…" : caseForm.id ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Modal backup ---------- */}
      {backupModalOpen && (
        <div
          onClick={() => setBackupModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16,25,43,0.45)",
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
              padding: 22,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontSize: 16, margin: 0, color: COLORS.navy }}>
                Backup de datos
              </h2>
              <button onClick={() => setBackupModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9AA9B8" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 18 }}>
              Todo se guarda en este navegador. Descargá una copia de vez en cuando para no perder nada si cambiás de compu o se borra el caché.
            </p>

            <button
              onClick={exportBackup}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                marginBottom: 10,
              }}
            >
              <Download size={16} /> Descargar backup
            </button>

            <label
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#fff",
                color: COLORS.navy,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "11px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Upload size={16} /> Restaurar desde archivo
              <input
                type="file"
                accept="application/json"
                onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

            {backupMessage && (
              <div
                style={{
                  marginTop: 14,
                  fontSize: 12.5,
                  color: backupMessage.type === "ok" ? "#15803D" : "#EB2D2D",
                }}
              >
                {backupMessage.text}
              </div>
            )}
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

function DateView({ items, onOpenItem }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const withDate = items.filter((it) => it.date).sort((a, b) => a.date.localeCompare(b.date));
  const noDate = items.filter((it) => !it.date);

  const groups = [];
  withDate.forEach((it) => {
    const last = groups[groups.length - 1];
    if (last && last.date === it.date) {
      last.items.push(it);
    } else {
      groups.push({ date: it.date, items: [it] });
    }
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const label = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  if (withDate.length === 0 && noDate.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed #E8E8E3",
          borderRadius: 12,
          padding: "40px 20px",
          textAlign: "center",
          color: "#A9B6C3",
          fontSize: 13,
        }}
      >
        Todavía no hay contenido cargado.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {groups.map((group) => {
        const isPast = group.date < todayStr;
        const isToday = group.date === todayStr;
        return (
          <div key={group.date}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span
                style={{
                  fontFamily: "'Familjen Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "#10192B",
                }}
              >
                {formatDate(group.date)}
              </span>
              {isToday && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0253E8", background: "rgba(2,83,232,0.1)", padding: "2px 7px", borderRadius: 6 }}>
                  HOY
                </span>
              )}
              {isPast && group.items.some((it) => it.status !== "publicado") && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#B45309", background: "rgba(245,158,11,0.14)", padding: "2px 7px", borderRadius: 6 }}>
                  ATRASADO
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.items.map((item) => (
                <DateRow key={item.id} item={item} onClick={() => onOpenItem(item)} />
              ))}
            </div>
          </div>
        );
      })}

      {noDate.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Familjen Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, color: "#5B6B7C", marginBottom: 10 }}>
            Sin fecha asignada
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {noDate.map((item) => (
              <DateRow key={item.id} item={item} onClick={() => onOpenItem(item)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DateRow({ item, onClick }) {
  const Plat = PLATFORM_META[item.platform]?.icon;
  const meta = CONTENT_STATUS_META[item.status];
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#FFFFFF",
        border: "1px solid #E8E8E3",
        borderRadius: 10,
        padding: "10px 14px",
        cursor: "pointer",
      }}
    >
      {Plat && <Plat size={14} color={PLATFORM_META[item.platform]?.color} style={{ flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#10192B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
        {item.angle && (
          <div style={{ fontSize: 11.5, color: "#5B6B7C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.angle}
          </div>
        )}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 10.5,
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: 6,
          background: meta.bg,
          color: meta.text,
        }}
      >
        {meta.label}
      </span>
    </div>
  );
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
