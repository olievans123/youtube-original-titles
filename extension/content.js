(function () {
  "use strict";

  const ATTR = "data-yot";
  const cache = new Map();
  const pending = new Map();

  const CARD_SEL = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-playlist-panel-video-renderer",
    "yt-lockup-view-model",
  ].join(",");

  // ── Helpers ──

  function norm(s) {
    return s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
  }

  function getVideoId(card) {
    const link =
      card.querySelector('a[href*="/watch?"]') ||
      card.querySelector('a[href*="/shorts/"]');
    if (!link) return null;
    try {
      const url = new URL(link.href);
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/"))
        return url.pathname.split("/")[2] || null;
    } catch {}
    return null;
  }

  function isMixOrPlaylist(card) {
    if (card.querySelector('a[href*="list="]')) return true;
    if (card.querySelector('a[href*="/playlist?"]')) return true;
    if (card.querySelector("yt-collection-thumbnail-view-model")) return true;
    return false;
  }

  function getTitleEl(card) {
    return (
      card.querySelector("#video-title") ||
      card.querySelector(
        ".yt-lockup-metadata-view-model__heading-reset .yt-core-attributed-string",
      ) ||
      card.querySelector("span.ytp-videowall-still-info-title")
    );
  }

  async function fetchTitle(videoId) {
    if (cache.has(videoId)) return cache.get(videoId);
    if (pending.has(videoId)) return pending.get(videoId);

    const p = (async () => {
      try {
        const r = await fetch(
          `/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`,
        );
        if (!r.ok) {
          cache.set(videoId, null);
          return null;
        }
        const d = await r.json();
        cache.set(videoId, d.title || null);
        return d.title || null;
      } catch {
        cache.set(videoId, null);
        return null;
      } finally {
        pending.delete(videoId);
      }
    })();

    pending.set(videoId, p);
    return p;
  }

  // ── Process a single card ──

  async function processCard(card) {
    if (card.hasAttribute(ATTR)) return;
    if (isMixOrPlaylist(card)) {
      card.setAttribute(ATTR, "skip");
      return;
    }

    const videoId = getVideoId(card);
    if (!videoId) return;

    const titleEl = getTitleEl(card);
    if (!titleEl) return;

    card.setAttribute(ATTR, videoId);

    const original = await fetchTitle(videoId);
    if (!original) return;

    const current = (titleEl.innerText || titleEl.textContent || "").trim();
    if (!current || norm(current) === norm(original)) return;

    titleEl.innerText = original;
    if (titleEl.hasAttribute("title")) titleEl.title = original;

    const titleLink = card.querySelector("a#video-title-link");
    if (titleLink) titleLink.title = original;

    window.dispatchEvent(new CustomEvent("yot-replaced"));
  }

  // ── Process watch page title ──

  async function processWatchTitle() {
    if (!location.pathname.startsWith("/watch")) return;

    const titleEl =
      document.querySelector(
        "h1.ytd-watch-metadata yt-formatted-string",
      ) ||
      document.querySelector("#title h1 yt-formatted-string");
    if (!titleEl || titleEl.hasAttribute(ATTR)) return;

    const videoId = new URLSearchParams(location.search).get("v");
    if (!videoId) return;

    titleEl.setAttribute(ATTR, videoId);

    const original = await fetchTitle(videoId);
    if (!original) return;

    const current = (titleEl.innerText || titleEl.textContent || "").trim();
    if (!current || norm(current) === norm(original)) return;

    titleEl.innerText = original;
    window.dispatchEvent(new CustomEvent("yot-replaced"));
  }

  // ── Scheduling ──

  let raf = null;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      document.querySelectorAll(CARD_SEL).forEach(processCard);
      processWatchTitle();
    });
  }

  // ── Start ──

  function start() {
    schedule();
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
    });

    // YouTube SPA navigation
    document.addEventListener("yt-navigate-finish", () => {
      document
        .querySelectorAll(`[${ATTR}]`)
        .forEach((el) => el.removeAttribute(ATTR));
      schedule();
    });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
