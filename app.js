(function () {
  "use strict";

  var STATUS_CLASS = {
    "Completed": "completed",
    "Announced": "announced",
    "Planned": "announced",
    "In Progress": "progress"
  };

  var state = { status: "all", type: "all", stateFilter: "all", area: "all", selectedId: null };
  var markers = {};

  var map = L.map("map", { zoomControl: true, minZoom: 5 }).setView([7.5, 6.5], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  var INFRA_COLOR = { Railway: "#6b4c9a", Road: "#55606b" };
  var INFRA_DASH = {
    Existing: null,
    "Under Construction": "9,7",
    Stalled: "1,7",
    Planned: "2,12"
  };
  var INFRA_WEIGHT = { Existing: 3.5, "Under Construction": 3.5, Stalled: 2.5, Planned: 2.5 };
  var INFRA_OPACITY = { Existing: 0.85, "Under Construction": 0.85, Stalled: 0.55, Planned: 0.55 };

  var infraLayers = { Railway: L.layerGroup(), Road: L.layerGroup() };

  function infraPopupHtml(item) {
    return (
      '<div class="popup">' +
      '<span class="popup-status infra-status-' + item.status.toLowerCase().replace(/\s+/g, "-") + '">' + esc(item.status) + "</span>" +
      '<span class="popup-type ' + (item.category === "Railway" ? "popup-type-rail" : "popup-type-road") + '">' + esc(item.category) + "</span>" +
      '<p class="popup-name">' + esc(item.name) + "</p>" +
      '<p class="popup-note" style="margin-top:6px;">' + esc(item.description) + "</p>" +
      '<p class="popup-note">' + esc(item.sourceNote) + "</p>" +
      "</div>"
    );
  }

  INFRASTRUCTURE.forEach(function (item) {
    var line = L.polyline(item.path, {
      color: INFRA_COLOR[item.category],
      weight: INFRA_WEIGHT[item.status] || 3,
      opacity: INFRA_OPACITY[item.status] != null ? INFRA_OPACITY[item.status] : 0.8,
      dashArray: INFRA_DASH[item.status] || null
    });
    line.bindPopup(infraPopupHtml(item));
    infraLayers[item.category].addLayer(line);
  });

  function updateInfraVisibility() {
    var showInfra = document.getElementById("infra-toggle").checked;
    var showRail = document.getElementById("infra-toggle-rail").checked;
    var showRoad = document.getElementById("infra-toggle-road").checked;

    if (showInfra && showRail) { if (!map.hasLayer(infraLayers.Railway)) infraLayers.Railway.addTo(map); }
    else if (map.hasLayer(infraLayers.Railway)) map.removeLayer(infraLayers.Railway);

    if (showInfra && showRoad) { if (!map.hasLayer(infraLayers.Road)) infraLayers.Road.addTo(map); }
    else if (map.hasLayer(infraLayers.Road)) map.removeLayer(infraLayers.Road);
  }

  function initInfraControls() {
    var master = document.getElementById("infra-toggle");
    var sub = document.getElementById("infra-sub");
    master.addEventListener("change", function () {
      sub.hidden = !master.checked;
      updateInfraVisibility();
    });
    document.getElementById("infra-toggle-rail").addEventListener("change", updateInfraVisibility);
    document.getElementById("infra-toggle-road").addEventListener("change", updateInfraVisibility);
  }

  function statusClass(status) {
    return STATUS_CLASS[status] || "completed";
  }

  function markerColor(status) {
    var cls = statusClass(status);
    if (cls === "announced") return "#b8862e";
    if (cls === "progress") return "#2f5d8a";
    return "#1e7a4c";
  }

  function makeIcon(estate, isSelected) {
    var color = markerColor(estate.status);
    var size = isSelected ? 20 : 14;
    var shapeStyle =
      estate.type === "Private"
        ? "border-radius:3px;transform:rotate(45deg);"
        : "border-radius:50%;";
    var html =
      '<span style="' +
      "display:block;width:" + size + "px;height:" + size + "px;" + shapeStyle +
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
    return links.join("") || '<span class="popup-no-contact">No public contact found — verify with agency.</span>';
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
    var priceLine = estate.priceRange
      ? '<div class="popup-row"><span class="k">Price</span><span>' + esc(estate.priceRange) + "</span></div>"
      : "";
    return (
      '<div class="popup">' +
      '<span class="popup-status status-' + cls + '">' + esc(estate.status) + "</span>" +
      '<span class="popup-type popup-type-' + (estate.type === "Private" ? "priv" : "gov") + '">' + esc(estate.type) + "</span>" +
      '<p class="popup-name">' + esc(estate.name) + "</p>" +
      '<p class="popup-area">' + esc(estate.area) + " &middot; " + esc(estate.lga) + " &middot; " + esc(estate.state) + "</p>" +
      '<div class="popup-row"><span class="k">Unit types</span><span>' + esc(estate.unitTypes) + "</span></div>" +
      unitsLine +
      priceLine +
      '<div class="popup-enquire">' +
      '<div class="popup-enquire-label">Enquire</div>' +
      '<div class="popup-enquire-agency">' + esc(estate.enquiryContact.name) + "</div>" +
      '<div class="popup-links">' + contactLinks(estate.enquiryContact) + "</div>" +
      '<p class="popup-note">' + esc(estate.sourceNote) + "</p>" +
      "</div>" +
      '<div class="popup-finance">' +
      '<div class="popup-enquire-label">Financing</div>' +
      '<button type="button" class="popup-finance-btn" data-open-modal="modal-calculator" data-estate-name="' + esc(estate.name) + '" data-estate-price="' + (extractPriceEstimate(estate.priceRange) || "") + '">Estimate a mortgage for this estate &rarr;</button>' +
      '<p class="popup-note">' + esc(MREIF.disclaimer) + "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function extractPriceEstimate(priceRange) {
    if (!priceRange) return null;
    var avgMatch = priceRange.match(/avg[^\d₦]*₦\s*([\d,.]+)\s*([MB])?/i);
    var match = avgMatch || priceRange.match(/₦\s*([\d,.]+)\s*([MB])?/i);
    if (!match) return null;
    var num = parseFloat(match[1].replace(/,/g, ""));
    if (isNaN(num)) return null;
    var suffix = (match[2] || "").toUpperCase();
    if (suffix === "M") num *= 1e6;
    else if (suffix === "B") num *= 1e9;
    return Math.round(num);
  }

  function refreshIcon(id) {
    var m = markers[id];
    if (!m) return;
    m.setIcon(makeIcon(m.estate, state.selectedId === id));
  }

  ESTATES.forEach(function (estate) {
    var marker = L.marker([estate.lat, estate.lng], { icon: makeIcon(estate, false) });
    marker.estate = estate;
    marker.bindPopup(popupHtml(estate));
    marker.on("click", function () {
      selectEstate(estate.id, false);
    });
    markers[estate.id] = marker;
  });

  function populateStateSelect() {
    var select = document.getElementById("state-select");
    var states = Array.from(new Set(ESTATES.map(function (e) { return e.state; }))).sort();
    states.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      state.stateFilter = select.value;
      state.area = "all";
      populateAreaSelect();
      render();
    });
  }

  function populateAreaSelect() {
    var select = document.getElementById("lga-select");
    select.innerHTML = '<option value="all">All areas</option>';
    var pool = state.stateFilter === "all" ? ESTATES : ESTATES.filter(function (e) { return e.state === state.stateFilter; });
    var areas = Array.from(new Set(pool.map(function (e) { return e.lga; }))).sort();
    areas.forEach(function (lga) {
      var opt = document.createElement("option");
      opt.value = lga;
      opt.textContent = lga;
      select.appendChild(opt);
    });
  }

  function initAreaSelect() {
    var select = document.getElementById("lga-select");
    select.addEventListener("change", function () {
      state.area = select.value;
      render();
    });
  }

  function matchesFilter(estate) {
    var statusOk = state.status === "all" || estate.status === state.status;
    var typeOk = state.type === "all" || estate.type === state.type;
    var stateOk = state.stateFilter === "all" || estate.state === state.stateFilter;
    var areaOk = state.area === "all" || estate.lga === state.area;
    return statusOk && typeOk && stateOk && areaOk;
  }

  function selectEstate(id, flyTo) {
    var prevId = state.selectedId;
    state.selectedId = id;
    if (prevId) refreshIcon(prevId);
    refreshIcon(id);

    var marker = markers[id];
    if (flyTo) map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 12), { duration: 0.6 });
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
      var shapeCls = estate.type === "Private" ? "shape-diamond" : "shape-circle";
      btn.innerHTML =
        '<div class="estate-card-top"><i class="shape ' + shapeCls + ' dot-' + cls + '"></i>' +
        '<span class="estate-card-name">' + esc(estate.name) + "</span></div>" +
        '<p class="estate-card-area">' + esc(estate.area) + " &middot; " + esc(estate.state) + "</p>" +
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

  function render() {
    var visible = ESTATES.filter(matchesFilter);
    var countText = visible.length + " of " + ESTATES.length;
    document.getElementById("sidebar-count").textContent = countText;
    document.getElementById("compact-count").textContent = countText;
    renderList(visible);
    updateMarkerVisibility(visible);
    updateFilterBadge();
  }

  function updateFilterBadge() {
    var badge = document.getElementById("filter-badge");
    var count = 0;
    if (state.status !== "all") count++;
    if (state.type !== "all") count++;
    if (state.stateFilter !== "all") count++;
    if (state.area !== "all") count++;
    badge.hidden = count === 0;
    badge.textContent = count;
  }

  function initChipGroup(selector, onSelect) {
    var chips = document.querySelectorAll(selector);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        onSelect(chip);
        render();
      });
    });
  }

  function initViewToggle() {
    document.body.dataset.view = "map";
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

  var nairaFormat = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  function computeMortgage() {
    var price = parseFloat(document.getElementById("calc-price").value) || 0;
    var equityPct = parseFloat(document.getElementById("calc-equity").value) || 0;
    var ratePct = parseFloat(document.getElementById("calc-rate").value) || 0;
    var years = parseFloat(document.getElementById("calc-term").value) || 0;

    var loanAmount = Math.max(price - price * (equityPct / 100), 0);
    var months = Math.max(Math.round(years * 12), 1);
    var monthlyRate = ratePct / 100 / 12;

    var monthly;
    if (monthlyRate === 0) {
      monthly = loanAmount / months;
    } else {
      monthly = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    }
    if (!isFinite(monthly)) monthly = 0;

    var totalRepayment = monthly * months;
    var totalInterest = totalRepayment - loanAmount;

    document.getElementById("calc-loan-amount").textContent = nairaFormat.format(loanAmount);
    document.getElementById("calc-monthly").textContent = nairaFormat.format(monthly);
    document.getElementById("calc-interest").textContent = nairaFormat.format(Math.max(totalInterest, 0));
    document.getElementById("calc-total").textContent = nairaFormat.format(totalRepayment);
  }

  function initCalculator() {
    ["calc-price", "calc-equity", "calc-rate", "calc-term"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", computeMortgage);
    });
    computeMortgage();
  }

  function openModal(id, trigger) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.hidden = false;
    document.body.classList.add("modal-open");

    if (id === "modal-calculator") {
      var context = document.getElementById("calc-context");
      var estateName = trigger && trigger.dataset.estateName;
      var estatePrice = trigger && trigger.dataset.estatePrice;
      if (estateName) {
        context.hidden = false;
        context.textContent = "Estimating for: " + estateName;
      } else {
        context.hidden = true;
      }
      if (estatePrice) {
        document.getElementById("calc-price").value = estatePrice;
      }
      computeMortgage();
    }
  }

  function closeModal(overlay) {
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function initModals() {
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open-modal]");
      if (opener) {
        openModal(opener.dataset.openModal, opener);
        return;
      }
      var closer = e.target.closest("[data-close-modal]");
      if (closer) {
        closeModal(closer.closest(".modal-overlay"));
        return;
      }
      if (e.target.classList.contains("modal-overlay")) {
        closeModal(e.target);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
          if (!overlay.hidden) closeModal(overlay);
        });
      }
    });
  }

  function openSheet(id) {
    closeSheet();
    var panel = document.getElementById(id);
    if (!panel) return;
    panel.classList.add("sheet-open");
    document.getElementById("sheet-backdrop").hidden = false;
    document.body.classList.add("sheet-locked");
  }

  function closeSheet() {
    document.querySelectorAll(".sheet-open").forEach(function (el) {
      el.classList.remove("sheet-open");
    });
    document.getElementById("sheet-backdrop").hidden = true;
    document.body.classList.remove("sheet-locked");
  }

  function initSheets() {
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open-sheet]");
      if (opener) {
        openSheet(opener.dataset.openSheet);
        return;
      }
      if (e.target.closest("[data-close-sheet]")) {
        closeSheet();
        return;
      }
      if (e.target.id === "sheet-backdrop") {
        closeSheet();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSheet();
    });
  }

  // Initial paint
  Object.keys(markers).forEach(function (id) { markers[id].addTo(map); });
  var bounds = L.latLngBounds(ESTATES.map(function (e) { return [e.lat, e.lng]; }));
  map.fitBounds(bounds, { padding: [30, 30] });

  document.getElementById("count-all").textContent = ESTATES.length;

  populateStateSelect();
  populateAreaSelect();
  initAreaSelect();
  initChipGroup("[data-filter-status]", function (chip) { state.status = chip.dataset.filterStatus; });
  initChipGroup("[data-filter-type]", function (chip) { state.type = chip.dataset.filterType; });
  initViewToggle();
  initCalculator();
  initModals();
  initInfraControls();
  initSheets();
  render();
})();
