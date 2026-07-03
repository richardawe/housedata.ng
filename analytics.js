(function () {
  "use strict";

  // Self-hosted, no third-party service. Session id is random and lives
  // only in sessionStorage — it resets every browser session and isn't
  // linked to any identity. No IP address or user agent is sent; see
  // track.php for exactly what gets stored server-side.

  var ENDPOINT = "/track.php";

  function getSessionId() {
    try {
      var id = sessionStorage.getItem("hd_sid");
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
        sessionStorage.setItem("hd_sid", id);
      }
      return id;
    } catch (e) {
      return "no-storage";
    }
  }

  function deviceBucket() {
    var w = window.innerWidth;
    if (w < 640) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  }

  var sessionId = getSessionId();

  function track(type, data) {
    var payload = JSON.stringify({
      type: type,
      page: location.pathname.replace(/^\//, "") || "index.html",
      session: sessionId,
      device: deviceBucket(),
      data: data || {}
    });

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }
    } catch (e) { /* fall through to fetch */ }

    try {
      fetch(ENDPOINT, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } });
    } catch (e) { /* analytics must never break the app */ }
  }

  // Pageview, once per load.
  track("pageview", { ref: document.referrer ? new URL(document.referrer).hostname : "" });

  // Everything below listens on the existing app's real DOM via
  // delegation — no changes to app.js/access-bank.js needed, and if this
  // script fails to load or errors, the app itself is unaffected.

  document.addEventListener("click", function (e) {
    var statusChip = e.target.closest("[data-filter-status]");
    if (statusChip) { track("filter_status", { value: statusChip.dataset.filterStatus }); return; }

    var typeChip = e.target.closest("[data-filter-type]");
    if (typeChip) { track("filter_type", { value: typeChip.dataset.filterType }); return; }

    var viewBtn = e.target.closest(".view-btn");
    if (viewBtn) { track("view_toggle", { value: viewBtn.dataset.view }); return; }

    var estateCard = e.target.closest(".estate-card");
    if (estateCard) { track("estate_click", { id: estateCard.dataset.id }); return; }

    var modalOpener = e.target.closest("[data-open-modal]");
    if (modalOpener) {
      var modalId = modalOpener.dataset.openModal;
      if (modalId === "modal-calculator") track("calc_open", { via: modalOpener.dataset.estateName ? "estate-popup" : "banner" });
      else if (modalId === "modal-about-mreif") track("about_mreif_open", {});
      return;
    }

    var accessBankLink = e.target.closest('a[href="access-bank.html"]');
    if (accessBankLink) { track("access_bank_click", {}); return; }
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "state-select") { track("filter_state", { value: e.target.value }); return; }
    if (e.target.id === "infra-toggle") { track("infra_toggle", { on: e.target.checked ? "1" : "0" }); return; }
  });

  // access-bank.html's calculator — track first interaction only, not every keystroke.
  var abTracked = false;
  document.addEventListener("input", function (e) {
    if (!abTracked && e.target.id && e.target.id.indexOf("ab-calc-") === 0) {
      abTracked = true;
      track("ab_calc_used", {});
    }
  });
})();
