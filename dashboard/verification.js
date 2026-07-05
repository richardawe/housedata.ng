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

  function renderSearchResults(estates, invitesByEstate) {
    var el = document.getElementById("v-search-results");
    if (!estates.length) {
      el.innerHTML = '<p class="dash-empty">No matches.</p>';
      return;
    }
    el.innerHTML = estates.slice(0, 20).map(function (e) {
      var invite = invitesByEstate[e.id];
      var statusNote = invite ? '<span class="v-invite-status">last invite: ' + esc(invite.status) + "</span>" : "";
      return (
        '<div class="v-result-row">' +
        '<div><span class="v-result-name">' + esc(e.name) + '</span> <span class="v-result-meta">' + esc(e.area) + " · " + esc(e.state) + "</span></div>" +
        '<div>' + statusNote + ' <button type="button" class="v-btn" data-invite-estate="' + esc(e.id) + '">Invite to verify</button></div>' +
        "</div>"
      );
    }).join("");
  }

  function initSearch(invitesByEstate) {
    var input = document.getElementById("v-search-input");
    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (!q) {
        document.getElementById("v-search-results").innerHTML = "";
        return;
      }
      timer = setTimeout(function () {
        fetch("../api/estates.php?q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (estates) { renderSearchResults(estates, invitesByEstate); })
          .catch(function () {});
      }, 200);
    });

    document.getElementById("v-search-results").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-invite-estate]");
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = "Sending…";
      apiFetch("../api/admin/verification-invites.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estateId: btn.dataset.inviteEstate })
      }).then(function (result) {
        if (result.ok) {
          btn.textContent = "Sent to " + result.data.sentTo;
        } else {
          btn.disabled = false;
          btn.textContent = "Invite to verify";
          alert(result.data.error || "Failed to send invite");
        }
      });
    });
  }

  function renderReviewQueue(invites) {
    var el = document.getElementById("v-review-queue");
    if (!invites.length) {
      el.innerHTML = '<p class="dash-empty">Nothing pending review.</p>';
      return;
    }
    el.innerHTML = invites.map(function (inv) {
      var photos = [inv.image1_path, inv.image2_path, inv.image3_path].filter(Boolean).map(function (p) {
        return '<a href="../' + esc(p) + '" target="_blank" rel="noopener"><img src="../' + esc(p) + '" alt="Submitted photo"></a>';
      }).join("");
      return (
        '<div class="v-card" data-invite-id="' + inv.id + '">' +
        '<div class="v-card-head"><span class="v-card-name">' + esc(inv.estate_name) + '</span><span class="v-invite-status">submitted ' + esc((inv.submitted_at || "").slice(0, 10)) + "</span></div>" +
        '<div class="v-card-meta">' + esc(inv.contact_person || "—") + (inv.contact_phone ? " · " + esc(inv.contact_phone) : "") + " · " + esc(inv.contact_email) + "</div>" +
        (inv.notes ? '<div class="v-card-meta">' + esc(inv.notes) + "</div>" : "") +
        '<div class="v-card-photos">' + photos + "</div>" +
        '<div class="v-card-actions">' +
        '<button type="button" class="v-btn v-btn-approve" data-review-action="approve">Approve &amp; mark Verified</button>' +
        '<button type="button" class="v-btn v-btn-reject" data-review-action="reject">Reject</button>' +
        "</div>" +
        "</div>"
      );
    }).join("");
  }

  function initReviewQueue() {
    document.getElementById("v-review-queue").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-review-action]");
      if (!btn) return;
      var card = btn.closest("[data-invite-id]");
      var inviteId = parseInt(card.dataset.inviteId, 10);
      btn.disabled = true;
      apiFetch("../api/admin/verification-review.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: inviteId, action: btn.dataset.reviewAction })
      }).then(function (result) {
        if (result.ok) {
          card.remove();
        } else {
          btn.disabled = false;
          alert(result.data.error || "Failed to submit review");
        }
      });
    });
  }

  function renderRecentInvites(invites) {
    var el = document.getElementById("v-recent-invites");
    if (!invites.length) {
      el.innerHTML = '<p class="dash-empty">No invites sent yet.</p>';
      return;
    }
    el.innerHTML = invites.slice(0, 30).map(function (inv) {
      return (
        '<div class="v-result-row">' +
        '<div><span class="v-result-name">' + esc(inv.estate_name) + '</span> <span class="v-result-meta">' + esc(inv.contact_email) + "</span></div>" +
        '<span class="v-invite-status">' + esc(inv.status) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function loadDashboard() {
    fetch("../api/admin/verification-invites.php?status=submitted")
      .then(function (r) { return r.json(); })
      .then(function (data) { renderReviewQueue(data.invites || []); })
      .catch(function () {
        document.getElementById("v-review-queue").innerHTML = '<p class="dash-empty">Could not load review queue.</p>';
      });

    fetch("../api/admin/verification-invites.php")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var invites = data.invites || [];
        renderRecentInvites(invites);
        var byEstate = {};
        invites.forEach(function (inv) {
          if (!byEstate[inv.estate_id]) byEstate[inv.estate_id] = inv;
        });
        initSearch(byEstate);
      })
      .catch(function () {
        document.getElementById("v-recent-invites").innerHTML = '<p class="dash-empty">Could not load invites.</p>';
        initSearch({});
      });

    initReviewQueue();
  }

  fetch("../api/session.php")
    .then(function (r) { return r.json(); })
    .then(function (session) {
      if (!session.loggedIn || !session.isAdmin) {
        document.getElementById("v-gate").hidden = false;
        return;
      }
      document.getElementById("v-content").hidden = false;
      loadDashboard();
    })
    .catch(function () {
      document.getElementById("v-gate").hidden = false;
    });
})();
