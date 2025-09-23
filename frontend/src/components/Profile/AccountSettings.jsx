// /src/components/Profile/AccountSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./AccountSettings.css";

import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import getCroppedImg from "../../utils/cropImage";

import avatar1 from "../../assets/avatar1.png";
import avatar2 from "../../assets/avatar2.png";
import avatar3 from "../../assets/avatar3.png";
import avatar4 from "../../assets/avatar4.png";
import avatar5 from "../../assets/avatar5.png";
import avatar6 from "../../assets/avatar6.png";
import avatar7 from "../../assets/avatar7.png";
import avatar8 from "../../assets/avatar8.png";

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8];
const DEFAULT_AVATAR = "/default-avatar.png";

export default function AccountSettings() {
  const [tab, setTab] = useState("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [toast, setToast] = useState(null);

  // Identity
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tier, setTier] = useState("basic");

  // Profile
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // Security (now persisted)
  const [twoFactor, setTwoFactor] = useState(false);
  const [communication, setCommunication] = useState(true);

  // Billing (mock + portal)
  const [paymentMethod, setPaymentMethod] = useState("Visa **** 4242");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Cropper
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Dirty tracking
  const [initial, setInitial] = useState({
    phoneNumber: "",
    avatarUrl: "",
    twoFactor: false,
    communication: true,
  });

  const dirtyProfile = useMemo(() => {
    const finalAvatar = selectedAvatar || avatarUrl || "";
    return (
      (phoneNumber || "") !== (initial.phoneNumber || "") ||
      (finalAvatar || "") !== (initial.avatarUrl || "")
    );
  }, [phoneNumber, selectedAvatar, avatarUrl, initial]);

  const dirtySecurity = useMemo(() => {
    return (
      Boolean(twoFactor) !== Boolean(initial.twoFactor) ||
      Boolean(communication) !== Boolean(initial.communication)
    );
  }, [twoFactor, communication, initial]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data: au, error: aerr } = await supabase.auth.getUser();
        if (aerr || !au?.user) throw new Error("Not logged in.");
        const user = au.user;

        // Only select columns that exist in your schema
        const { data: prof, error: perr } = await supabase
          .from("profiles")
          .select(
            "username, phone_number, avatar_url, subscription_tier, two_factor_enabled, marketing_opt_in"
          )
          .eq("id", user.id)
          .single();
        if (perr) throw perr;

        if (!mounted) return;

        setEmail(user.email || "");
        setUsername(prof?.username || "");
        setPhoneNumber(prof?.phone_number || "");
        setAvatarUrl(prof?.avatar_url || "");
        setTwoFactor(Boolean(prof?.two_factor_enabled));
        setCommunication(
          prof?.marketing_opt_in === undefined ? true : Boolean(prof?.marketing_opt_in)
        );

        const tierValue = (prof?.subscription_tier || "basic").toString().toLowerCase();
        setTier(tierValue);

        setInitial({
          phoneNumber: prof?.phone_number || "",
          avatarUrl: prof?.avatar_url || "",
          twoFactor: Boolean(prof?.two_factor_enabled),
          communication: prof?.marketing_opt_in === undefined ? true : Boolean(prof?.marketing_opt_in),
        });
      } catch (e) {
        console.error(e);
        showToast("error", e.message || "Failed to load settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2200);
  };

  async function openStripePortal() {
    try {
      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) return showToast("error", "Not logged in.");

      const res = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: au.user.id }),
      });
      const json = await res.json();
      if (json?.url) window.location.href = json.url;
      else showToast("error", "Couldn’t open Stripe billing portal.");
    } catch (e) {
      showToast("error", e.message || "Stripe portal error.");
    }
  }

  function onFileChosen(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleCropSave() {
    setSaving(true);
    try {
      const blob = await getCroppedImg(cropImage, croppedAreaPixels);
      const compressed = await imageCompression(blob, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 300,
        useWebWorker: true,
      });

      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) throw new Error("Not logged in.");

      const filePath = `avatars/${au.user.id}.jpg`;
      const { error: uploadError } = await supabase
        .from("avatars")
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Failed to get public URL.");

      setSelectedAvatar(publicUrl);
      setCropModalOpen(false);
      showToast("success", "Photo updated. Don’t forget to Save.");
    } catch (e) {
      showToast("error", e.message || "Image upload failed.");
    } finally {
      setSaving(false);
    }
  }

  // Save only Profile fields
  async function saveProfile() {
    if (!dirtyProfile) return;
    setSaving(true);
    try {
      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) throw new Error("Not logged in.");

      const finalAvatar = selectedAvatar || avatarUrl || DEFAULT_AVATAR;

      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          avatar_url: finalAvatar,
          phone_number: phoneNumber || null,
        })
        .eq("id", au.user.id);
      if (upErr) throw upErr;

      setAvatarUrl(finalAvatar);
      setInitial((prev) => ({ ...prev, phoneNumber, avatarUrl: finalAvatar }));
      showToast("success", "Profile saved.");
    } catch (e) {
      showToast("error", e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // Save only Security fields
  async function saveSecurity() {
    if (!dirtySecurity) return;
    setSavingSecurity(true);
    try {
      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) throw new Error("Not logged in.");

      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: Boolean(twoFactor),
          marketing_opt_in: Boolean(communication),
        })
        .eq("id", au.user.id);
      if (upErr) throw upErr;

      setInitial((prev) => ({
        ...prev,
        twoFactor: Boolean(twoFactor),
        communication: Boolean(communication),
      }));
      showToast("success", "Security preferences saved.");
    } catch (e) {
      showToast("error", e.message || "Save failed.");
    } finally {
      setSavingSecurity(false);
    }
  }

  function saveMockPayment() {
    if (cardNumber.length < 12) return showToast("error", "Enter a valid card.");
    setPaymentMethod(`Visa **** ${cardNumber.slice(-4)}`);
    setShowPaymentModal(false);
    setCardNumber("");
    setExpiry("");
    setCvv("");
    showToast("success", "Payment method updated (mock).");
  }

  if (loading) return <div className="loader">Loading settings…</div>;

  return (
    <div className="accountPageBackground">
      <div className="accountCard" role="region" aria-label="Account settings">
        <h2>⚙️ Account Settings</h2>

        {/* Tabs */}
        <div className="tabs" role="tablist" aria-label="Settings tabs">
          {[
            { id: "profile", label: "Profile" },
            { id: "security", label: "Security" },
            { id: "billing", label: "Billing" },
          ].map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={`tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {tab === "profile" && (
          <div className="tabPanel" role="tabpanel" aria-labelledby="profile">
            <div className="settingGroup">
              <label>👤 Username</label>
              <input type="text" value={username || ""} disabled />
            </div>

            <div className="settingGroup">
              <label>📧 Email</label>
              <input type="email" value={email || ""} disabled />
            </div>

            <div className="settingGroup">
              <label>🖼️ Profile Picture</label>
              <img
                src={selectedAvatar || avatarUrl || DEFAULT_AVATAR}
                alt="Current avatar"
                className="avatar-preview"
                onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
              />
              <input type="file" accept="image/*" onChange={(e) => onFileChosen(e.target.files?.[0])} />
              <div className="avatar-grid">
                {AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`preset avatar ${idx + 1}`}
                    className={`avatar-option ${selectedAvatar === url ? "selected" : ""}`}
                    onClick={() => setSelectedAvatar(url)}
                  />
                ))}
              </div>
            </div>

            <div className="settingGroup">
              <label>📱 Phone Number</label>
              <PhoneInput
                country={"gb"}
                value={phoneNumber || ""}
                onChange={setPhoneNumber}
                inputStyle={{ width: "100%" }}
                specialLabel=""
              />
              <small className="hint">We’ll use this for match confirmations.</small>
            </div>

            <div className="settingGroup">
              <label>🎟️ Subscription Tier</label>
              <input type="text" value={tier} disabled />
              <button className="settingBtn" onClick={() => setTab("billing")}>
                Manage subscription
              </button>
            </div>

            <button
              className="settingBtn saveBtn"
              onClick={saveProfile}
              disabled={!dirtyProfile || saving}
            >
              {saving ? "Saving…" : "Save Profile Changes"}
            </button>
          </div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div className="tabPanel" role="tabpanel" aria-labelledby="security">
            <div className="settingGroup">
              <label>🔐 Two-Factor Authentication</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={() => setTwoFactor((v) => !v)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settingGroup">
              <label>🔔 Communication Preferences</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={communication}
                  onChange={() => setCommunication((v) => !v)}
                />
                <span className="slider" />
              </label>
            </div>

            <button
              className="settingBtn saveBtn"
              onClick={saveSecurity}
              disabled={!dirtySecurity || savingSecurity}
            >
              {savingSecurity ? "Saving…" : "Save Security Changes"}
            </button>
          </div>
        )}

        {/* BILLING */}
        {tab === "billing" && (
          <div className="tabPanel" role="tabpanel" aria-labelledby="billing">
            <div className="settingGroup">
              <label>💳 Payment Method</label>
              <input type="text" value={paymentMethod} disabled />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="settingBtn" onClick={() => setShowPaymentModal(true)}>
                  Update card (mock)
                </button>
                <button className="settingBtn" onClick={openStripePortal}>
                  Open Stripe Billing Portal
                </button>
              </div>
              <small className="hint">
                The Stripe Billing Portal is the source of truth for plans & invoices.
              </small>
            </div>
          </div>
        )}

        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

        {/* Payment modal (mock) */}
        {showPaymentModal && (
          <div className="modalOverlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>💳 Update Payment Method</h3>
              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={16}
              />
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                maxLength={5}
              />
              <input
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                maxLength={4}
              />
              <div className="modalActions">
                <button onClick={saveMockPayment}>Save</button>
                <button onClick={() => setShowPaymentModal(false)} className="cancelBtn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Avatar crop modal */}
        {cropModalOpen && (
          <div className="modalOverlay" onClick={() => setCropModalOpen(false)}>
            <div className="modal cropperModal" onClick={(e) => e.stopPropagation()}>
              <h3>✂️ Crop your image</h3>
              <div className="cropContainer">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
              <div className="modalActions">
                <button onClick={handleCropSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className="cancelBtn" onClick={() => setCropModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
