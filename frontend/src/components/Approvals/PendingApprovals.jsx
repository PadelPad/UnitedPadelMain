import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "../../supabaseClient.js";
import "./Approvals.css";

/** Your new view (no column rename issues) */
const VIEW_INBOX = "v_inbox_pending_approvals";
const TABLE_MATCHES = "matches";
const TABLE_MATCH_SETS = "match_sets"; // optional; keep if you have it

const EVIDENCE_BUCKET = "evidence";
const AUTO_HOURS = 48;

/* ---------------- helpers ---------------- */
const sanitizeName = (s) => (s || "").replace(/[^\w.\-]+/g, "_").slice(0, 120);
const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso || ""; } };
const isImg = (n) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n || "");

const isEmptyVal = (v) => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim().toLowerCase();
  return s === "" || s === "null" || s === "undefined";
};

/** Robust score resolver that works off just the view row */
function resolveScoreFromRow(row = {}) {
  for (const k of ["score_text", "score", "final_score", "result", "scoreline"]) {
    if (!isEmptyVal(row[k])) return String(row[k]);
  }
  const textSets = ["set1_score","set2_score","set3_score"]
    .map((k) => row[k])
    .filter((v) => !isEmptyVal(v));
  if (textSets.length) return textSets.join(", ");
  return "—";
}

const splitSets = (scoreText) =>
  String(scoreText || "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x && x.toLowerCase() !== "null");

function timeLeft(createdAt) {
  if (!createdAt) return null;
  const end = new Date(new Date(createdAt).getTime() + AUTO_HOURS * 3600 * 1000);
  const now = new Date();
  const ms = end - now;
  if (ms <= 0) return { h: 0, m: 0, done: true, end };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { h, m, done: false, end };
}

/* tiny confetti (CSS-driven) */
function confetti(whereEl) {
  const c = document.createElement("div");
  c.className = "ap-confetti";
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("i");
    p.style.setProperty("--dx", (Math.random() * 2 - 1).toFixed(2));
    p.style.setProperty("--dy", (Math.random() * -1 - 0.35).toFixed(2));
    p.style.setProperty("--rot", (Math.random() * 360).toFixed(0));
    p.style.setProperty("--delay", (Math.random() * 80).toFixed(0) + "ms");
    c.appendChild(p);
  }
  (whereEl || document.body).appendChild(c);
  setTimeout(() => c.remove(), 1200);
}

/* ---------------- UI atoms ---------------- */
const Kbd = ({ children }) => <kbd className="ap-kbd">{children}</kbd>;
const Tag = ({ children }) => <span className="tag">{children}</span>;
function Button({ intent = "ghost", onClick, disabled, children, title }) {
  const base = "btn";
  const cls =
    intent === "primary" ? `${base} btn-primary` :
    intent === "approve" ? `${base} btn-approve` :
    intent === "danger"  ? `${base} btn-danger`  :
                           `${base} btn-ghost`;
  return (
    <button className={cls} onClick={onClick} disabled={disabled} title={title} aria-label={title || undefined}>
      {children}
    </button>
  );
}
function Toast({ text }) { if (!text) return null; return <div className="ap-toast" role="status" aria-live="polite">{text}</div>; }

/* ---------------- Dispute modal ---------------- */
function DisputeModal({ open, onClose, onSubmit, busy }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);
  const zoneRef = useRef(null);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);
  useEffect(() => { if (!open) { setReason(""); setDetails(""); setFiles([]); } }, [open]);

  if (!open) return null;

  const isImgName = (n) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n || "");

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-head">
          <h3 className="modal-title">Open a Dispute</h3>
          <div className="ap-modal-hint">Explain what’s wrong and (optionally) attach evidence.</div>
        </div>

        <label className="label">Reason</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Incorrect score, wrong winner" maxLength={180} />

        <label className="label">Details (optional)</label>
        <textarea className="textarea" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add context: what happened, correct score, etc." />

        <div
          className="upload-zone"
          ref={zoneRef}
          onDragOver={(e) => { e.preventDefault(); zoneRef.current?.classList.add("drag"); }}
          onDragLeave={() => zoneRef.current?.classList.remove("drag")}
          onDrop={(e) => {
            e.preventDefault(); zoneRef.current?.classList.remove("drag");
            const f = Array.from(e.dataTransfer.files || []); if (f.length) setFiles((prev) => [...prev, ...f].slice(0, 10));
          }}
        >
          <div className="upload-title">Attach evidence (optional)</div>
          <div className="upload-sub">Drag &amp; drop or click (max 10 files)</div>
          <input
            type="file" multiple className="upload-input" title=""
            onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) setFiles((prev) => [...prev, ...f].slice(0, 10)); e.target.value = ""; }}
          />
          {!!files.length && (
            <div className="file-list">
              {files.map((f, i) => (
                <span key={i} className="file-pill" title={f.name}>
                  {isImgName(f.name) && (
                    <img alt="" className="file-thumb" src={URL.createObjectURL(f)} onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                  )}
                  <span className="file-name">{f.name}</span>
                  <span className="file-remove" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>✕</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="actions ap-modal-actions">
          <Button onClick={onClose} title="Close (Esc)">Cancel</Button>
          <Button intent="danger" onClick={() => onSubmit({ reason, details, files })} disabled={busy || !reason.trim()} title="Submit Dispute">
            {busy ? "Submitting…" : "Submit Dispute"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main page ---------------- */
export default function PendingApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busyMatchId, setBusyMatchId] = useState(null);
  const [disputeFor, setDisputeFor] = useState(null);
  const [me, setMe] = useState(null);
  const [toast, setToast] = useState(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const [scoreMap, setScoreMap] = useState({});
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("up.approvalStreak") || 0));
  useEffect(() => { localStorage.setItem("up.approvalStreak", String(streak)); }, [streak]);

  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser(); setMe(data?.user || null);
  })(); }, []);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3500); };

  const hydrateScores = useCallback(async (rowsIn) => {
    const missingIds = [...new Set((rowsIn || [])
      .filter((r) => resolveScoreFromRow(r) === "—")
      .map((r) => r.match_id)
      .filter(Boolean))];
    if (!missingIds.length) return;

    const nextMap = {};

    try {
      const { data: m1 } = await supabase
        .from(TABLE_MATCHES)
        .select(`id, score, score_text, final_score, scoreline, set1_score, set2_score, set3_score`)
        .in("id", missingIds);
      (m1 || []).forEach((row) => {
        const s = resolveScoreFromRow(row);
        if (s && s !== "—") nextMap[row.id] = s;
      });
    } catch {}

    const still = missingIds.filter((id) => !nextMap[id]);
    if (TABLE_MATCH_SETS && still.length) {
      try {
        const { data: m2 } = await supabase
          .from(TABLE_MATCH_SETS)
          .select(`match_id, set_no, team1_games, team2_games, tiebreak`)
          .in("match_id", still)
          .order("set_no", { ascending: true });
        if (Array.isArray(m2) && m2.length) {
          const byMatch = new Map();
          m2.forEach((r) => {
            if (!byMatch.has(r.match_id)) byMatch.set(r.match_id, []);
            byMatch.get(r.match_id).push(r);
          });
          for (const [mid, arr] of byMatch.entries()) {
            const s = arr
              .sort((a, b) => (a.set_no ?? 0) - (b.set_no ?? 0))
              .map((s) => {
                const a = s.team1_games; const b = s.team2_games;
                if (isEmptyVal(a) || isEmptyVal(b)) return null;
                return `${a}–${b}${s.tiebreak ? ` (${s.tiebreak})` : ""}`;
              })
              .filter(Boolean)
              .join(", ");
            if (s) nextMap[mid] = s;
          }
        }
      } catch {}
    }

    if (Object.keys(nextMap).length) setScoreMap((prev) => ({ ...prev, ...nextMap }));
  }, []);

  const loadInbox = useCallback(async () => {
    setLoading(true); setErrorMsg(""); setScoreMap({});
    const { data, error } = await supabase
      .from(VIEW_INBOX)
      .select("*")
      .order("mc_created_at", { ascending: false });
    if (error) {
      setErrorMsg(error.message || "Failed to load approvals.");
      setRows([]); setLoading(false);
      return;
    }
    setRows(data || []); setFocusIndex(0); setLoading(false);
    try { await hydrateScores(data || []); } catch {}
  }, [hydrateScores]);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    let ch;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      ch = supabase
        .channel(`inbox-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "match_confirmations", filter: `user_id=eq.${uid}` },
          () => loadInbox()
        )
        .subscribe();
    })();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [loadInbox]);

  useEffect(() => {
    const onKey = (e) => {
      if (disputeFor) { if (e.key === "Escape") setDisputeFor(null); return; }
      if (!rows.length) return;
      const max = rows.length - 1;
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex((i) => Math.min(max, i + 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIndex((i) => Math.max(0, i - 1)); }
      if (e.key.toLowerCase() === "r") loadInbox();
      const current = rows[focusIndex];
      if (!current) return;
      if (e.key.toLowerCase() === "a") approve(current);
      if (e.key.toLowerCase() === "d") setDisputeFor(current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, focusIndex, disputeFor, loadInbox]);

  const approve = async (r) => {
    setBusyMatchId(r.match_id); setErrorMsg("");
    const { data, error } = await supabase.rpc("set_match_confirmation", {
      p_match_id: r.match_id,
      p_action: "approve",
      p_reason: null,
      p_details: null,
    });
    if (error || data?.ok === false) {
      setErrorMsg(error?.message || data?.message || "Approval failed.");
      setBusyMatchId(null);
      return;
    }
    confetti(document.querySelector(".ap-page-inner"));
    setStreak((s) => s + 1);
    setRows((prev) => prev.filter((x) => x.match_id !== r.match_id));
    setBusyMatchId(null);
  };

  const uploadEvidence = async (disputeId, files, uid) => {
    if (!files?.length || !disputeId || !uid) return { firstError: null };
    const uploads = files.map(async (f) => {
      const path = `${disputeId}/${uid}/${Date.now()}_${sanitizeName(f.name)}`;
      const { error: upErr } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false });
      if (!upErr) {
        await supabase.from("match_evidence").insert({ dispute_id: disputeId, object_path: path, uploaded_by: uid });
      }
      return upErr;
    });
    const results = await Promise.all(uploads);
    return { firstError: results.find(Boolean) || null };
  };

  const submitDispute = async ({ reason, details, files }) => {
    if (!disputeFor) return;
    setBusyMatchId(disputeFor.match_id); setErrorMsg("");

    const { data: rpcData, error: rpcErr } = await supabase.rpc("set_match_confirmation", {
      p_match_id: disputeFor.match_id,
      p_action: "reject",
      p_reason: reason || null,
      p_details: details || null,
    });
    if (rpcErr || rpcData?.ok === false) {
      setErrorMsg(rpcErr?.message || rpcData?.message || "Dispute failed.");
      setBusyMatchId(null);
      return;
    }

    let disputeId = rpcData?.dispute_id || null;
    const meId = (await supabase.auth.getUser())?.data?.user?.id;
    if (disputeId && meId && files?.length) {
      const { firstError } = await uploadEvidence(disputeId, files, meId);
      if (firstError) setErrorMsg(firstError.message || "Some files failed to upload.");
    }

    setRows((prev) => prev.filter((x) => x.match_id !== disputeFor.match_id));
    setBusyMatchId(null);
    setDisputeFor(null);
    setTimeout(() => setToast("Dispute submitted."), 0);
  };

  const approveAll = async () => {
    if (!rows.length) return;
    for (let i = 0; i < rows.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await approve(rows[i]);
    }
    confetti(document.querySelector(".ap-page-inner"));
    setToast("All approved ✓");
  };

  const list = useMemo(() => rows || [], [rows]);

  return (
    <div className="approvals-page theme-wave ap-page">
      <div className="ap-page-inner">
        <header className="ap-hero">
          <div className="ap-hero-left">
            <h2>Inbox: Match Confirmations</h2>
            <p>Confirm or reject results you were tagged in.</p>

            <div className="ap-toolbar sticky">
              <Button intent="primary" onClick={loadInbox} disabled={loading} title="Refresh (R)">
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              <Button intent="approve" onClick={approveAll} disabled={!list.length || loading} title="Approve all visible">
                Approve All
              </Button>
              <div className="ap-streak" title="Approval streak (client-side only)">
                <div className="ring" style={{ ["--v"]: Math.min(1, streak / 10) }} />
                <div className="num">{streak}</div>
                <div className="cap">streak</div>
              </div>
            </div>

            <div className="ap-hints">
              Pro tips: <Kbd>↑</Kbd>/<Kbd>↓</Kbd> navigate • <Kbd>A</Kbd> approve • <Kbd>D</Kbd> dispute • <Kbd>R</Kbd> refresh
            </div>
          </div>
          <div className="ap-hero-right"><div className="ap-hero-orb" /></div>
        </header>

        <Toast text={toast} />
        {errorMsg && <div className="alert">Error: {errorMsg}</div>}

        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="empty">No pending approvals 🎉</div>
        ) : (
          <ul className="cards">
            {list.map((r, i) => {
              const focused = i === focusIndex;
              const tl = r.match_level === "friendly" ? timeLeft(r.mc_created_at) : null;

              const resolved = scoreMap[r.match_id] || resolveScoreFromRow(r);
              const setPills = splitSets(resolved);

              return (
                <li key={`${r.match_id}-${r.user_id}`} className={`card ap-card ${focused ? "focus" : ""}`} tabIndex={0}>
                  <div className="card-top">
                    <img
                      src={r.player_avatar_url || ""}
                      alt=""
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      className="avatar"
                    />
                    <div className="who">
                      <div className="name">{r.player_username || "Player"}</div>
                      <div className="meta">Team {r.team_number} • {r.is_winner ? "Winner" : "Loser"}</div>
                    </div>
                    <div className="tags">
                      <Tag>{r.match_type || "match"}</Tag>
                      <Tag>{r.match_level || "friendly"}</Tag>
                    </div>
                  </div>

                  <div className="ap-divider" />

                  <div className="card-mid">
                    <div className="score-line">
                      <span className="label">Score:</span> {resolved}
                      {!!setPills.length && (
                        <span className="set-pills">
                          {setPills.map((s, idx) => <span key={idx} className="set-pill">{s}</span>)}
                        </span>
                      )}
                    </div>
                    <div className="dim">Played: {fmt(r.played_at)}</div>
                  </div>

                  {!!tl && !tl.done && (
                    <div className="countdown" title={`Auto-approve at ${fmt(tl.end?.toISOString?.() || tl.end)}`}>
                      Auto-approve in <strong>{tl.h}h {tl.m}m</strong>
                    </div>
                  )}

                  <div className="card-actions">
                    <Button intent="approve" onClick={() => approve(r)} disabled={busyMatchId === r.match_id} title="Approve (A)">
                      {busyMatchId === r.match_id ? "Saving…" : "Approve"}
                    </Button>
                    <Button intent="danger" onClick={() => setDisputeFor(r)} disabled={busyMatchId === r.match_id} title="Dispute (D)">
                      Dispute
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <DisputeModal
          open={!!disputeFor}
          onClose={() => setDisputeFor(null)}
          onSubmit={submitDispute}
          busy={!!(busyMatchId && disputeFor && busyMatchId === disputeFor.match_id)}
        />
      </div>
    </div>
  );
}
