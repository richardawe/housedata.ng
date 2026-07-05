(function () {
  "use strict";

  function getCsrfCookie() {
    var match = document.cookie.match(/(?:^|;\s*)hd_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function val(id) {
    return document.getElementById(id).value.trim();
  }

  fetch("api/session.php").catch(function () {});

  document.getElementById("submit-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var errorEl = document.getElementById("submit-error");
    var submitBtn = document.getElementById("submit-btn");
    errorEl.hidden = true;
    submitBtn.disabled = true;

    var payload = {
      name: val("sub-name"),
      state: val("sub-state"),
      lga: val("sub-lga"),
      area: val("sub-area"),
      type: document.getElementById("sub-type").value,
      estateStatus: document.getElementById("sub-status").value,
      lat: val("sub-lat"),
      lng: val("sub-lng"),
      unitTypes: val("sub-unit-types"),
      unitsText: val("sub-units-text"),
      priceRange: val("sub-price-range"),
      developerOrg: val("sub-developer-org"),
      submitterName: val("sub-submitter-name"),
      submitterEmail: val("sub-submitter-email"),
      submitterPhone: val("sub-submitter-phone"),
      contactName: val("sub-contact-name"),
      contactPhone: val("sub-contact-phone"),
      contactEmail: val("sub-contact-email"),
      contactWebsite: val("sub-contact-website"),
      sourceNoteDraft: val("sub-source-note"),
      company: val("sub-company")
    };

    fetch("api/submissions.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfCookie() },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) {
          errorEl.textContent = result.data.error || "Something went wrong — try again.";
          errorEl.hidden = false;
          submitBtn.disabled = false;
          return;
        }
        document.getElementById("submit-form-section").hidden = true;
        document.getElementById("submit-done").hidden = false;
      })
      .catch(function () {
        errorEl.textContent = "Something went wrong — try again.";
        errorEl.hidden = false;
        submitBtn.disabled = false;
      });
  });
})();
