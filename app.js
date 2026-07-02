(function () {
  "use strict";

  var STATUS_CLASS = {
    "Completed": "completed",
    "Announced": "announced",
    "Planned": "announced",
    "In Progress": "progress"
  };

  var state = { status: "all", lga: "all", selectedId: null };
  var markers = {};

  var map = L.map("map", { zoomControl: true, minZoom: 8 }).setView([6.52, 3.55], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  function statusClass(status) {
    return STATUS_CLASS[status] || "completed";
  }

  function markerColor(status) {
    var cls = statusClass(status);
    if (cls === "announced") return "#b8862e";
    if (cls === "progress") return "#2f5d8a";
    return "#1e7a4c";
  }

  function makeIcon(status, isSelected) {
    var color = markerColor(status);
    var size = isSelected ? 20 : 14;
    var html =
      '<span style="' +
      "display:block;width:" + size + "px;height:" + size + "px;border-radius:50%;" +
      "background:" + color + ";border:2px solid #fff;" +
      "box-shadow:0 1px 4px rgba(15,25,18,0.45);" +
      '"></span>';
    return L.divIcon({
      className: "estate-marker",
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  function contactLinks(contact) {
    var links = [];
    if (contact.phone) {
      links.push('<a href="tel:' + contact.phone.split(" / ")[0].replace(/\s/g, "") + '">' + esc(contact.phone) + "</a>");
    }
    if (contact.email) {
      links.push('<a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + "</a>");
    }
    if (contact.website) {
      links.push('<a href="' + esc(contact.website) + '" target="_blank" rel="noopener">' + esc(contact.website.replace(/^https?:\/\//, "")) + "</a>");
    }
    return links.join("");
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function popupHtml(estate) {
    var cls = statusClass(estate.status);
    var unitsLine = estate.units
      ? '<div class="popup-row"><span class="k">Scale</span><span>' + esc(estate.units) + "</span></div>"
      : "";
    return (
      '<div class="popup">' +
      '<span class="popup-status status-' + cls + '">' + esc(estate.status) + "</span>" +
      '<p class="popup-name">' + esc(estate.name) + "</p>" +
      '<p class="popup-area">' + esc(estate.area) + " &middot; " + esc(estate.lga) + "</p>" +
      '<div class="popup-row"><span class="k">Unit types</span><span>' + esc(estate.unitTypes) + "</span></div>" +
      unitsLine +
      '<div class="popup-enquire">' +
      '<div class="popup-enquire-label">Enquire</div>' +
      '<div class="popup-enquire-agency">' + esc(estate.enquiryContact.name) + "</div>" +
      '<div class="popup-links">' + contactLinks(estate.enquiryContact) + "</div>" +
      '<p class="popup-note">' + esc(estate.sourceNote) + "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function refreshIcon(id) {
    var m = markers[id];
    if (!m) return;
    var estate = m.estate;
    m.setIcon(makeIcon(estate.status, state.selectedId === id));
  }

  ESTATES.forEach(function (estate) {
    var marker = L.marker([estate.lat, estate.lng], { icon: makeIcon(estate.status, false) });
    marker.estate = estate;
    marker.bindPopup(popupHtml(estate));
    marker.on("click", function () {
      selectEstate(estate.id, false);
    });
    markers[estate.id] = marker;
  });

  function populateLgaSelect() {
    var select = document.getElementById("lga-select");
    var lgas = Array.from(new Set(ESTATES.map(function (e) { return e.lga; }))).sort();
    lgas.forEach(function (lga) {
      var opt = document.createElement("option");
      opt.value = lga;
      opt.textContent = lga;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      state.lga = select.value;
      render();
    });
  }

  function matchesFilter(estate) {
    var statusOk = state.status === "all" || estate.status === state.status;
    var lgaOk = state.lga === "all" || estate.lga === state.lga;
    return statusOk && lgaOk;
  }

  function selectEstate(id, flyTo) {
    var prevId = state.selectedId;
    state.selectedId = id;
    if (prevId) refreshIcon(prevId);
    refreshIcon(id);

    var marker = markers[id];
    if (flyTo) map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 });
    marker.openPopup();

    document.querySelectorAll(".estate-card").forEach(function (card) {
      card.classList.toggle("is-selected", card.dataset.id === id);
    });
  }

  function renderList(visible) {
    var list = document.getElementById("estate-list");
    list.innerHTML = "";

    if (visible.length === 0) {
      var empty = document.createElement("li");
      empty.className = "estate-empty";
      empty.textContent = "No estates match this filter.";
      list.appendChild(empty);
      return;
    }

    visible.forEach(function (estate) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.className = "estate-card" + (state.selectedId === estate.id ? " is-selected" : "");
      btn.dataset.id = estate.id;
      var cls = statusClass(estate.status);
      btn.innerHTML =
        '<div class="estate-card-top"><i class="dot dot-' + cls + '"></i>' +
        '<span class="estate-card-name">' + esc(estate.name) + "</span></div>" +
        '<p class="estate-card-area">' + esc(estate.area) + "</p>" +
        '<span class="estate-card-status status-' + cls + '">' + esc(estate.status) + "</span>";
      btn.addEventListener("click", function () {
        selectEstate(estate.id, true);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function updateMarkerVisibility(visible) {
    var visibleIds = new Set(visible.map(function (e) { return e.id; }));
    Object.keys(markers).forEach(function (id) {
      var marker = markers[id];
      if (visibleIds.has(id)) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }

  function updateChipCounts() {
    var counts = { Completed: 0, Announced: 0, "In Progress": 0 };
    ESTATES.forEach(function (e) {
      var key = e.status === "Planned" ? "Announced" : e.status;
      if (counts[key] !== undefined) counts[key]++;
    });
    document.getElementById("count-all").textContent = ESTATES.length;
  }

  function render() {
    var visible = ESTATES.filter(matchesFilter);
    document.getElementById("sidebar-count").textContent = visible.length + " of " + ESTATES.length;
    renderList(visible);
    updateMarkerVisibility(visible);
  }

  function initChips() {
    var chips = document.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        state.status = chip.dataset.filterStatus;
        render();
      });
    });
  }

  function initViewToggle() {
    var buttons = document.querySelectorAll(".view-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        document.body.dataset.view = btn.dataset.view;
        if (btn.dataset.view === "map") setTimeout(function () { map.invalidateSize(); }, 50);
      });
    });
  }

  // Initial paint
  Object.keys(markers).forEach(function (id) { markers[id].addTo(map); });
  var bounds = L.latLngBounds(ESTATES.map(function (e) { return [e.lat, e.lng]; }));
  map.fitBounds(bounds, { padding: [30, 30] });

  populateLgaSelect();
  updateChipCounts();
  initChips();
  initViewToggle();
  render();
})();
