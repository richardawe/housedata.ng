(function () {
  "use strict";

  var estateNames = {};

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function estateName(id) {
    return estateNames[id] || id;
  }

  function renderTiles(el, tiles) {
    el.innerHTML = tiles.map(function (t) {
      return '<div class="dash-tile"><span class="dash-tile-value">' + esc(t.value) + '</span><span class="dash-tile-label">' + esc(t.label) + "</span></div>";
    }).join("");
  }

  function renderBars(el, entries, options) {
    options = options || {};
    var labelFn = options.labelFn || function (k) { return k; };
    var goldClass = options.gold ? " gold" : "";
    var keys = Object.keys(entries);
    if (!keys.length) {
      el.innerHTML = '<p class="dash-empty">No data yet.</p>';
      return;
    }
    var max = Math.max.apply(null, keys.map(function (k) { return entries[k]; }));
    el.innerHTML = keys.map(function (k) {
      var count = entries[k];
      var pct = max > 0 ? Math.round((count / max) * 100) : 0;
      return (
        '<div class="dash-bar-row">' +
        '<span class="dash-bar-label">' + esc(labelFn(k)) + "</span>" +
        '<span class="dash-bar-track"><span class="dash-bar-fill' + goldClass + '" style="width:' + pct + '%"></span></span>' +
        '<span class="dash-bar-count">' + count + "</span>" +
        "</div>"
      );
    }).join("");
  }

  Promise.all([
    fetch("stats.php").then(function (r) { return r.json(); }),
    fetch("../api/estates.php").then(function (r) { return r.json(); }).catch(function () { return []; })
  ])
    .then(function (results) {
      var s = results[0];
      results[1].forEach(function (e) { estateNames[e.id] = e.name; });

      renderTiles(document.getElementById("dash-tiles"), [
        { value: s.totalPageviews, label: "Total pageviews" },
        { value: s.uniqueSessions, label: "Unique sessions" },
        { value: (s.pageviewsByPage && s.pageviewsByPage["index.html"]) || 0, label: "Map page views" },
        { value: (s.pageviewsByPage && s.pageviewsByPage["access-bank.html"]) || 0, label: "Access Bank page views" }
      ]);

      renderBars(document.getElementById("dash-daily"), s.dailyPageviews || {});
      renderBars(document.getElementById("dash-states"), s.topStatesFiltered || {}, { labelFn: function (k) { return k === "all" ? "All states" : k; } });
      renderBars(document.getElementById("dash-estates"), s.topEstateClicks || {}, { labelFn: estateName, gold: true });
      renderBars(document.getElementById("dash-type-filters"), s.typeFilters || {});
      renderBars(document.getElementById("dash-status-filters"), s.statusFilters || {});
      renderBars(document.getElementById("dash-view-toggle"), s.viewToggles || {});
      renderBars(document.getElementById("dash-device"), s.deviceCounts || {});

      var f = s.financing || {};
      renderTiles(document.getElementById("dash-financing"), [
        { value: f.calculatorOpens || 0, label: "MREIF calculator opened" },
        { value: f.aboutMreifOpens || 0, label: "About MREIF opened" },
        { value: f.accessBankClicks || 0, label: "Access Bank link clicks" },
        { value: f.accessBankCalculatorUsed || 0, label: "Access Bank calculator used" }
      ]);

      document.getElementById("dash-infra").textContent = (s.infraToggleOnCount || 0) + " sessions turned the infrastructure overlay on.";
    })
    .catch(function (err) {
      document.getElementById("dash-tiles").innerHTML = '<p class="dash-empty">Could not load stats.php — ' + esc(err.message) + "</p>";
    });
})();
