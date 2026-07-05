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

  function renderQueue(submissions) {
    var el = document.getElementById("sub-queue");
    if (!submissions.length) {
      el.innerHTML = '<p class="dash-empty">Nothing pending review.</p>';
      return;
    }
    el.innerHTML = submissions.map(function (s) {
      return (
        '<div class="v-card" data-submission-id="' + s.id + '">' +
        '<div class="v-card-head"><span class="v-card-name">' + esc(s.name) + '</span><span class="v-invite-status">' + esc((s.created_at || "").slice(0, 10)) + "</span></div>" +
        '<div class="v-card-meta">' + esc(s.area) + " · " + esc(s.lga) + " · " + esc(s.state) + " &middot; " + esc(s.type) + " &middot; " + esc(s.estate_status) + "</div>" +
        '<div class="v-card-row"><span class="k">Coordinates:</span> ' + esc(s.lat) + ", " + esc(s.lng) + "</div>" +
        (s.unit_types ? '<div class="v-card-row"><span class="k">Unit types:</span> ' + esc(s.unit_types) + "</div>" : "") +
        (s.units_text ? '<div class="v-card-row"><span class="k">Scale:</span> ' + esc(s.units_text) + "</div>" : "") +
        (s.price_range ? '<div class="v-card-row"><span class="k">Price:</span> ' + esc(s.price_range) + "</div>" : "") +
        '<div class="v-card-row"><span class="k">Developer/org:</span> ' + esc(s.developer_org) + "</div>" +
        '<div class="v-card-row"><span class="k">Submitted by:</span> ' + esc(s.submitter_name) + " · " + esc(s.submitter_email) + (s.submitter_phone ? " · " + esc(s.submitter_phone) : "") + "</div>" +
        (s.contact_name || s.contact_email || s.contact_phone
          ? '<div class="v-card-row"><span class="k">Public contact:</span> ' + esc(s.contact_name || "") + " " + esc(s.contact_phone || "") + " " + esc(s.contact_email || "") + "</div>"
          : "") +
        (s.source_note_draft ? '<div class="v-card-row"><span class="k">Note:</span> ' + esc(s.source_note_draft) + "</div>" : "") +
        '<div class="v-card-actions">' +
        '<button type="button" class="v-btn v-btn-approve" data-review-action="approve">Approve &amp; publish</button>' +
        '<input type="text" class="v-reject-notes" placeholder="Reason (optional, sent to submitter)">' +
        '<button type="button" class="v-btn v-btn-reject" data-review-action="reject">Reject</button>' +
        "</div>" +
        "</div>"
      );
    }).join("");
  }

  function initQueue() {
    document.getElementById("sub-queue").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-review-action]");
      if (!btn) return;
      var card = btn.closest("[data-submission-id]");
      var submissionId = parseInt(card.dataset.submissionId, 10);
      var action = btn.dataset.reviewAction;
      var notesInput = card.querySelector(".v-reject-notes");
      var reviewNotes = notesInput ? notesInput.value.trim() : "";

      card.querySelectorAll("button").forEach(function (b) { b.disabled = true; });

      apiFetch("../api/admin/submissions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submissionId, action: action, reviewNotes: reviewNotes })
      }).then(function (result) {
        if (result.ok) {
          card.remove();
        } else {
          card.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
          alert(result.data.error || "Failed to submit review");
        }
      });
    });
  }

  function loadQueue() {
    fetch("../api/admin/submissions.php?status=pending")
      .then(function (r) { return r.json(); })
      .then(function (data) { renderQueue(data.submissions || []); })
      .catch(function () {
        document.getElementById("sub-queue").innerHTML = '<p class="dash-empty">Could not load submissions.</p>';
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
      initQueue();
      loadQueue();
    })
    .catch(function () {
      document.getElementById("v-gate").hidden = false;
    });
})();
