(function () {
  "use strict";

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getCsrfCookie() {
    var match = document.cookie.match(/(?:^|;\s*)hd_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function apiFetch(url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers["X-CSRF-Token"] = getCsrfCookie();
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    });
  }

  function renderFinanciers(financiers) {
    var el = document.getElementById("fin-list");
    if (!financiers.length) {
      el.innerHTML = '<p class="dash-empty">No lenders added yet.</p>';
      return;
    }
    el.innerHTML = financiers.map(function (f) {
      return (
        '<div class="fin-row' + (f.is_active ? "" : " is-inactive") + '" data-financier-id="' + f.id + '">' +
        '<div><span class="fin-name">' + esc(f.name) + '</span> <span class="fin-meta">' + esc(f.contact_email) + (f.contact_phone ? " · " + esc(f.contact_phone) : "") + "</span></div>" +
        '<button type="button" class="v-btn" data-toggle-active="' + (f.is_active ? "0" : "1") + '">' + (f.is_active ? "Deactivate" : "Activate") + "</button>" +
        "</div>"
      );
    }).join("");
  }

  function loadFinanciers() {
    fetch("../api/admin/financiers.php")
      .then(function (r) { return r.json(); })
      .then(function (data) { renderFinanciers(data.financiers || []); })
      .catch(function () {
        document.getElementById("fin-list").innerHTML = '<p class="dash-empty">Could not load lenders.</p>';
      });
  }

  function initFinancierForm() {
    document.getElementById("fin-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fin-name").value.trim();
      var email = document.getElementById("fin-email").value.trim();
      var phone = document.getElementById("fin-phone").value.trim();

      apiFetch("../api/admin/financiers.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, contactEmail: email, contactPhone: phone })
      }).then(function (result) {
        if (!result.ok) {
          alert(result.data.error || "Failed to add lender");
          return;
        }
        document.getElementById("fin-form").reset();
        loadFinanciers();
      });
    });

    document.getElementById("fin-list").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-toggle-active]");
      if (!btn) return;
      var row = btn.closest("[data-financier-id]");
      var id = parseInt(row.dataset.financierId, 10);
      var nextActive = btn.dataset.toggleActive === "1";
      btn.disabled = true;
      apiFetch("../api/admin/financiers.php", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, isActive: nextActive })
      }).then(function (result) {
        if (!result.ok) {
          btn.disabled = false;
          alert(result.data.error || "Failed to update lender");
          return;
        }
        loadFinanciers();
      });
    });
  }

  function renderLeads(leads) {
    var el = document.getElementById("lead-list");
    if (!leads.length) {
      el.innerHTML = '<p class="dash-empty">No leads captured yet.</p>';
      return;
    }
    el.innerHTML = leads.map(function (l) {
      return (
        '<div class="lead-row">' +
        '<div><span class="lead-name">' + esc(l.applicant_name) + '</span> <span class="lead-meta">' + esc(l.estate_name_snapshot) + " &rarr; " + esc(l.financier_name_snapshot) + "</span><br>" +
        '<span class="lead-meta">' + esc(l.applicant_email) + " · " + esc(l.applicant_phone) + " · " + esc((l.created_at || "").slice(0, 16).replace("T", " ")) + "</span></div>" +
        '<span class="lead-status lead-status-' + esc(l.status) + '">' + esc(l.status) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function loadLeads() {
    fetch("../api/admin/leads.php")
      .then(function (r) { return r.json(); })
      .then(function (data) { renderLeads(data.leads || []); })
      .catch(function () {
        document.getElementById("lead-list").innerHTML = '<p class="dash-empty">Could not load leads.</p>';
      });
  }

  fetch("../api/session.php")
    .then(function (r) { return r.json(); })
    .then(function (session) {
      if (!session.loggedIn || !session.isAdmin) {
        document.getElementById("v-gate").hidden = false;
        return;
      }
      document.getElementById("v-content").hidden = false;
      initFinancierForm();
      loadFinanciers();
      loadLeads();
    })
    .catch(function () {
      document.getElementById("v-gate").hidden = false;
    });
})();
