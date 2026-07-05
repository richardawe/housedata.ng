(function () {
  "use strict";

  function getCsrfCookie() {
    var match = document.cookie.match(/(?:^|;\s*)hd_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function showSection(id) {
    ["verify-loading", "verify-invalid", "verify-done", "verify-form-section"].forEach(function (sectionId) {
      document.getElementById(sectionId).hidden = sectionId !== id;
    });
  }

  function getToken() {
    var params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }

  function init() {
    var token = getToken();
    if (!token) {
      showSection("verify-invalid");
      return;
    }

    fetch("api/session.php")
      .then(function () {
        return fetch("api/verify-estate.php?token=" + encodeURIComponent(token));
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.status === "pending") {
          document.getElementById("verify-estate-name").textContent = data.estateName;
          document.getElementById("verify-estate-location").textContent = data.area + " · " + data.state;
          showSection("verify-form-section");
        } else if (data.status === "submitted" || data.status === "approved") {
          showSection("verify-done");
        } else {
          document.getElementById("verify-invalid-reason").textContent =
            data.status === "expired"
              ? "This link has expired. Ask us to send a new one."
              : "It may have expired, already been used, or the URL is incomplete.";
          showSection("verify-invalid");
        }
      })
      .catch(function () {
        showSection("verify-invalid");
      });

    document.getElementById("verify-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var errorEl = document.getElementById("verify-error");
      var submitBtn = document.getElementById("verify-submit");
      errorEl.hidden = true;

      var image1 = document.getElementById("verify-image1").files[0];
      var image2 = document.getElementById("verify-image2").files[0];
      var image3 = document.getElementById("verify-image3").files[0];
      if (!image1 || !image2 || !image3) {
        errorEl.textContent = "Please choose all 3 photos.";
        errorEl.hidden = false;
        return;
      }

      var formData = new FormData();
      formData.append("token", token);
      formData.append("contactPerson", document.getElementById("verify-contact-person").value.trim());
      formData.append("contactPhone", document.getElementById("verify-contact-phone").value.trim());
      formData.append("notes", document.getElementById("verify-notes").value.trim());
      formData.append("image1", image1);
      formData.append("image2", image2);
      formData.append("image3", image3);

      submitBtn.disabled = true;
      fetch("api/verify-estate.php", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfCookie() },
        body: formData
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (result) {
          if (!result.ok) {
            errorEl.textContent = result.data.error || "Something went wrong — try again.";
            errorEl.hidden = false;
            submitBtn.disabled = false;
            return;
          }
          showSection("verify-done");
        })
        .catch(function () {
          errorEl.textContent = "Something went wrong — try again.";
          errorEl.hidden = false;
          submitBtn.disabled = false;
        });
    });
  }

  init();
})();
