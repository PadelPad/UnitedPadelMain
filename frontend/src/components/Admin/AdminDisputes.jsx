import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import "../Approvals/Approvals.css";

const ADMIN_ID = "d7391650-b1ee-4cc8-b4a8-6ebc6eb014e3"; // your admin UUID
const BUCKET   = "evidence";

const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso || ""; } };
const isImg = (p) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(p || "");
const isVid = (p) => /\.(mp4|webm|ogv|mov)$/i.test(p || "");

function Button({ intent = "ghost", onClick, disabled, children }) {
  const base = "btn";
  const cls =
    intent === "primary" ? `${base} btn-primary` :
    intent === "approve" ? `${base} btn-approve` :
    intent === "danger"  ? `${base} btn-danger`  :
                           `${base} btn-ghost`;
  return <button className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}
const Chip = ({ children, tone = "neutral" }) => (
  <span className={`ap-chip ${tone}`}>{children}</span>
);

export default function AdminDisputes() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [busy, setBusy] = useState(false);
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser(); setMe(data?.user ?? null);
  })(); }, []);

  const isAdmin = useMemo(() => me?.id === ADMIN_ID, [me]);

  const loadDisputes = async () => {
    setLoading(true); setErrorMsg("");
    const { data, error } = await supabase
      .from("match_disputes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { setErrorMsg(error.message || "Failed to load disputes."); setRows([]); }
    else setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { if (isAdmin) loadDisputes(); }, [isAdmin]);

  const openDispute = async (row) => {
    setSelected(row);
    setEvidence([]);
    setResolutionText(row?.resolution || "");
    const { data, error } = await supabase
      .from("match_evidence")
      .select("*")
      .eq("dispute_id", row.id)
      .order("created_at", { ascending: true });

    if (error) { setErrorMsg(error.message || "Failed to load evidence."); return; }

    const signed = await Promise.all((data || []).map(async (e) => {
      const { data: urlData, error: urlErr } = await supabase
        .storage.from(BUCKET).createSignedUrl(e.object_path, 60 * 60);
      return { ...e, signedUrl: urlErr ? null : urlData?.signedUrl };
    }));
    setEvidence(signed);
  };

  const resolveDispute = async (status) => {
    if (!selected) return;
    setBusy(true); setErrorMsg("");
    const patch = {
      status, // 'resolved' or 'dismissed'
      resolution: resolutionText || null,
      resolved_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("match_disputes").update(patch).eq("id", selected.id);
    if (error) setErrorMsg(error.message || "Failed to update dispute.");

    await loadDisputes();
    const fresh = (await supabase.from("match_disputes").select("*").eq("id", selected.id).maybeSingle()).data;
    setSelected(fresh || null);
    setBusy(false);
  };

  const nextOpen = (dir = 1) => {
    if (!rows.length) return;
    const idx = selected ? rows.findIndex((r) => r.id === selected.id) : -1;
    let j = idx;
    for (let k = 0; k < rows.length; k++) {
      j = (j + dir + rows.length) % rows.length;
      if (rows[j].status === "open") { openDispute(rows[j]); break; }
    }
  };

  if (!me)
    return <div className="approvals-page ap-page"><div className="ap-page-inner">Loading…</div></div>;
  if (!isAdmin)
    return <div className="approvals-page ap-page"><div className="ap-page-inner">Admins only.</div></div>;

  return (
    <div className="approvals-page ap-page theme-wave">
      <div className="ap-page-inner">
        <div className="page-header">
          <h2>Admin: Disputes</h2>
          <p>Review and resolve match disputes with attached evidence.</p>
          <Button intent="primary" onClick={loadDisputes} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
        </div>

        {errorMsg && <div className="alert">Error: {errorMsg}</div>}

        <div className="ap-admin-grid">
          {/* LEFT: list */}
          <div className="ap-column">
            <div className="cards scroll-y" style={{ maxHeight: "72vh" }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  className={`card ${selected?.id === r.id ? "focus" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => openDispute(r)}
                >
                  <div className="name" style={{ marginBottom: 6 }}>
                    Dispute • <Chip tone={r.status === "open" ? "warn" : r.status === "resolved" ? "good" : "muted"}>{r.status}</Chip>
                  </div>
                  <div className="card-mid">
                    <div><span className="label">Match:</span> {r.match_id}</div>
                    <div><span className="label">Raised by:</span> {r.raised_by}</div>
                    <div><span className="label">Reason:</span> {r.reason || "-"}</div>
                    <div className="dim">Opened: {fmt(r.created_at)}</div>
                    {r.resolved_at && <div className="dim">Resolved: {fmt(r.resolved_at)}</div>}
                  </div>
                </div>
              ))}
              {rows.length === 0 && <div className="empty">No disputes.</div>}
            </div>
          </div>

          {/* RIGHT: detail */}
          <div className="ap-column">
            {!selected ? (
              <div className="empty">Select a dispute to view details.</div>
            ) : (
              <div className="card">
                <div className="name">Dispute #{String(selected.id).slice(0, 8)}</div>
                <div className="card-mid" style={{ marginTop: 6 }}>
                  <div><span className="label">Status:</span> {selected.status}</div>
                  <div><span className="label">Match:</span> {selected.match_id}</div>
                  <div><span className="label">Raised by:</span> {selected.raised_by}</div>
                  <div><span className="label">Reason:</span> {selected.reason || "-"}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className="label">Details:</span>
                    <div style={{ whiteSpace: "pre-wrap" }}>{selected.details || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="label">Evidence</div>
                  <div className="ap-evidence-grid">
                    {evidence.map((ev) => (
                      <div key={ev.id} className="card" style={{ padding: 8 }}>
                        <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>
                          {String(ev.object_path).split("/").pop()}
                        </div>
                        {ev.signedUrl && isImg(ev.object_path) && (
                          <img src={ev.signedUrl} alt="" style={{ width: "100%", borderRadius: 8 }} />
                        )}
                        {ev.signedUrl && isVid(ev.object_path) && (
                          <video src={ev.signedUrl} controls style={{ width: "100%", borderRadius: 8 }} />
                        )}
                        {ev.signedUrl && !isImg(ev.object_path) && !isVid(ev.object_path) && (
                          <a href={ev.signedUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ display: "inline-block", marginTop: 6 }}>Download</a>
                        )}
                      </div>
                    ))}
                    {evidence.length === 0 && <div className="empty">No evidence uploaded.</div>}
                  </div>
                </div>

                <div className="ap-admin-actions">
                  <div className="label">Resolution notes</div>
                  <textarea
                    className="textarea" rows={4}
                    value={resolutionText} onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe the decision."
                  />
                  <div className="actions" style={{ marginTop: 10 }}>
                    <Button intent="approve" onClick={() => resolveDispute("resolved")} disabled={busy}>
                      {busy ? "Saving…" : "Resolve"}
                    </Button>
                    <Button intent="danger" onClick={() => resolveDispute("dismissed")} disabled={busy}>
                      {busy ? "Saving…" : "Dismiss"}
                    </Button>
                    <Button onClick={() => nextOpen(1)}>Next Open →</Button>
                    <Button onClick={() => nextOpen(-1)}>← Prev Open</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
