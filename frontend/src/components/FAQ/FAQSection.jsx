import React, { useEffect, useMemo, useRef, useState } from "react";
import padelBg from "../../assets/padel-bg.jpg";
import "./FAQSection.css";

// Optional: Lucide icons (you already use them elsewhere)
import {
  Search as SearchIcon,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Trophy,
  Sparkles,
  Bell,
  Globe,
  BadgeCheck,
  Link as LinkIcon,
  Users2,
  User2,
} from "lucide-react";

/** ---------- DATA (Players vs Clubs) ---------- **/
const PLAYER_CATEGORIES = [
  "Getting Started",
  "Rankings & Matches",
  "Tournaments & Leagues",
  "Badges & Gamification",
  "Notifications & Approvals",
  "Subscriptions & Billing",
  "Privacy & Safety",
];

const PLAYER_FAQS = [
  { category: "Getting Started", slug: "players-overview", q: "What is United Padel for players?", a: "Track verified results, climb Elo leaderboards, earn badges, and join events. Play casually or push for rankings with local filters and national events.", tags: ["intro", "players"] },
  { category: "Getting Started", slug: "players-start", q: "How do I start?", a: "Sign up, complete your profile (name, avatar, region, optional club). You start at 1000 Elo and can submit your first match right away.", tags: ["onboarding"] },
  { category: "Rankings & Matches", slug: "elo", q: "How does Elo work here?", a: "Your rating changes after each match based on opponent strength, match importance (K-factor), and score margin. Upsets move Elo more; dominant wins nudge deltas up.", tags: ["elo", "k-factor"] },
  { category: "Rankings & Matches", slug: "one-rating", q: "Do singles and doubles share one rating?", a: "Yes—one primary Elo. Doubles uses team expectation so partner strength is factored in. Organisers can also run singles-only boards.", tags: ["singles", "doubles"] },
  { category: "Rankings & Matches", slug: "scores", q: "Scorelines & validation", a: "Best of 3 validated (tiebreaks allowed). Clear wins (e.g., 6–0) slightly increase Elo delta vs 7–6. Duplicate checks prevent bad entries.", tags: ["scores", "validation"] },
  { category: "Rankings & Matches", slug: "decay", q: "Inactivity decay", a: "After a grace period, Elo decays slightly (~1–2% per month). The moment you play again, decay stops.", tags: ["decay"] },
  { category: "Tournaments & Leagues", slug: "player-events", q: "Can I create events?", a: "Players on Plus can create a limited tournament. Full league tools (auto fixtures, edits, round views) are an Elite club feature.", tags: ["plus", "elite"] },
  { category: "Notifications & Approvals", slug: "approvals", q: "How do approvals work?", a: "Friendlies require opponent approval; if there’s no response in 48h, the match auto-approves. Disputes pause Elo until resolved.", tags: ["approvals", "48h"] },
  { category: "Badges & Gamification", slug: "badges", q: "How do I earn badges?", a: "Milestones: first win, streaks, podiums, seasonal events, engagement. They don’t change Elo—just your status and flair.", tags: ["badges", "streaks"] },
  { category: "Subscriptions & Billing", slug: "player-plans", q: "Do I need a paid plan?", a: "You can play on Basic. Plus unlocks more uploads, a tournament slot, and extra profile perks. Upgrade/downgrade anytime via Stripe.", tags: ["plans", "stripe"] },
  { category: "Privacy & Safety", slug: "privacy", q: "What data do you keep?", a: "Essential profile + match data for rankings and fair play. Avatars in secure storage. Cards handled by Stripe—we don’t store them.", tags: ["privacy", "security"] },
];

const CLUB_CATEGORIES = [
  "Overview",
  "Leagues & Tournaments",
  "Analytics & Verification",
  "Club Management",
  "Billing & Plans",
  "Policy & Fair Play",
];

const CLUB_FAQS = [
  { category: "Overview", slug: "club-overview", q: "What does United Padel offer clubs?", a: "Run leagues/tournaments, auto-generate fixtures (singles/doubles), manage approvals, view member analytics (Elo trends, heatmaps, streaks), and promote your club.", tags: ["clubs", "overview"] },
  { category: "Leagues & Tournaments", slug: "club-leagues", q: "Who can create leagues?", a: "Elite clubs can create leagues. Fixtures generate per round; admins can reschedule matches, update courts, or lock fixtures when confirmed.", tags: ["elite", "fixtures"] },
  { category: "Leagues & Tournaments", slug: "club-auto-approve", q: "Are event matches auto-approved?", a: "Yes. Admin-submitted tournament/league results are auto-approved and applied to rankings instantly.", tags: ["auto-approve"] },
  { category: "Analytics & Verification", slug: "club-analytics", q: "What analytics do we get?", a: "Member Elo trends, participation, top performers, streaks, filters (team/age/gender/region) and CSV export. Verified members show a checkmark.", tags: ["analytics", "verified"] },
  { category: "Club Management", slug: "club-moderation", q: "Can we moderate content and players?", a: "Yes. Verify members, flag suspicious scores, and issue warnings. Repeated abuse can lead to restrictions or voided results.", tags: ["moderation", "integrity"] },
  { category: "Billing & Plans", slug: "club-billing", q: "How does Elite billing work?", a: "Stripe powers payments. Upgrade/downgrade/cancel anytime. Elite unlocks unlimited uploads, leagues, analytics, priority support, and promotion slots.", tags: ["stripe", "elite"] },
  { category: "Policy & Fair Play", slug: "club-disputes", q: "How do we handle disputes?", a: "Open a dispute on the match. We review history, partner strength, and patterns. Admins can adjust/void results; players are notified.", tags: ["disputes", "fair-play"] },
];

/** ---------- Small UI pieces ---------- **/
function Chip({ label, active, onClick, Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`faq-chip ${active ? "is-active" : ""}`}
      aria-pressed={active}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}

function useAccordion(open) {
  const ref = useRef(null);
  const [max, setMax] = useState(open ? "9999px" : "0px");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setMax(h + "px");
      const id = setTimeout(() => setMax("9999px"), 250);
      return () => clearTimeout(id);
    } else {
      const h = el.scrollHeight;
      // set to pixel height first to allow transition back to 0
      setMax(h + "px");
      requestAnimationFrame(() => setMax("0px"));
    }
  }, [open]);
  return { ref, maxHeight: max };
}

function FAQItem({ id, q, a, isOpen, onToggle }) {
  const { ref, maxHeight } = useAccordion(isOpen);
  const copyLink = (e) => {
    e.stopPropagation();
    const href = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard?.writeText(href).catch(() => {});
  };

  return (
    <div id={id} className={`faq-item ${isOpen ? "open" : ""}`}>
      <button
        className="faq-item__summary"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="faq-item__question">{q}</span>
        <span className="faq-item__actions">
          <button
            className="faq-copy"
            type="button"
            aria-label="Copy link to this answer"
            onClick={copyLink}
            onFocus={(e) => e.stopPropagation()}
          >
            <LinkIcon size={16} />
          </button>
          <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
        </span>
      </button>

      <div
        className="faq-item__content"
        style={{ maxHeight }}
        aria-hidden={!isOpen}
        ref={ref}
      >
        <div className="faq-item__inner">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

/** ---------- Main Section ---------- **/
export default function FAQSection() {
  const [audience, setAudience] = useState("Players"); // Players | Clubs
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const categories = useMemo(
    () => ["All", ...(audience === "Players" ? PLAYER_CATEGORIES : CLUB_CATEGORIES)],
    [audience]
  );

  const data = audience === "Players" ? PLAYER_FAQS : CLUB_FAQS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((f) => {
      const okCat = category === "All" || f.category === category;
      const okSearch =
        !q ||
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        (f.tags || []).some((t) => t.toLowerCase().includes(q));
      return okCat && okSearch;
    });
  }, [data, query, category]);

  // Deep-linking (?faq=elo or #faq-players-elo)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("faq");
    const hash = window.location.hash.replace("#", "");
    if (qParam) setQuery(qParam.toLowerCase());
    if (hash) {
      const [aud, slug] = hash.split("-").length > 2
        ? [hash.split("-")[0], hash.replace(/^.*?-/, "")]
        : [null, hash];
      if (aud && (aud === "players" || aud === "clubs")) {
        setAudience(aud[0].toUpperCase() + aud.slice(1));
      }
      const idx = data.findIndex((f) => f.slug === slug);
      if (idx >= 0) setOpenIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset open item when filters change
  useEffect(() => setOpenIndex(null), [audience, category, query]);

  // JSON-LD for visible items
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: filtered.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
    [filtered]
  );

  // Icons per category (for chips)
  const CatIcon = (label) => {
    const map = {
      "Rankings & Matches": Sparkles,
      "Tournaments & Leagues": Trophy,
      "Badges & Gamification": Sparkles,
      "Notifications & Approvals": Bell,
      "Subscriptions & Billing": ShieldCheck,
      "Privacy & Safety": Globe,
      "Getting Started": HelpCircle,
      "Overview": HelpCircle,
      "Analytics & Verification": BadgeCheck,
      "Club Management": Users2,
      "Billing & Plans": ShieldCheck,
      "Policy & Fair Play": Globe,
      All: HelpCircle,
    };
    return map[label] || HelpCircle;
  };

  return (
    <section
      className="faq-hero"
      style={{ "--faq-bg": `url(${padelBg})` }}
    >
      <div className="faq-overlay" />
      <div className="faq-container">
        <div className="faq-panel">
          <header className="faq-header">
            <div className="faq-title-wrap">
              <Trophy className="faq-title-icon" size={22} aria-hidden="true" />
              <h1 className="faq-title">United Padel — FAQs</h1>
            </div>
            <p className="faq-subtitle">
              Clear answers for <strong>Players</strong> and <strong>Clubs</strong>. Use search or pick a category.
            </p>

            {/* Audience tabs */}
            <div className="faq-tabs" role="tablist" aria-label="Audience">
              {[
                { label: "Players", Icon: User2 },
                { label: "Clubs", Icon: Users2 },
              ].map(({ label, Icon }) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={audience === label}
                  className={`faq-tab ${audience === label ? "is-active" : ""}`}
                  onClick={() => setAudience(label)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Search + categories */}
            <div className="faq-controls">
              <div className="faq-search">
                <SearchIcon size={18} className="faq-search__icon" aria-hidden="true" />
                <input
                  className="faq-search__input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={audience === "Players" ? "Search players’ FAQs…" : "Search clubs’ FAQs…"}
                  aria-label="Search FAQs"
                />
              </div>

              <div className="faq-chips" role="tablist" aria-label="Categories">
                {categories.map((label) => {
                  const Icon = CatIcon(label);
                  return (
                    <Chip
                      key={label}
                      label={label}
                      Icon={Icon}
                      active={category === label}
                      onClick={() => setCategory(label)}
                    />
                  );
                })}
              </div>
            </div>
          </header>

          {/* Items */}
          <div className="faq-list">
            {filtered.length === 0 ? (
              <div className="faq-empty">No results. Try another keyword or category.</div>
            ) : (
              filtered.map((f, i) => (
                <FAQItem
                  key={f.slug || f.q}
                  id={`${audience.toLowerCase()}-${f.slug}`}
                  q={f.q}
                  a={f.a}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))
            )}
          </div>

          {/* Footer line */}
          <footer className="faq-footer">
            <div className="faq-foot-left">
              Need help?{" "}
              <a href="/contact" className="faq-link">Contact support</a> or request a feature.
            </div>
            <div className="faq-foot-right">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Payments by Stripe • Data protected • Fair play first</span>
            </div>
          </footer>
        </div>
      </div>

      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
