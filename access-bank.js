(function () {
  "use strict";

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderProductCards() {
    var grid = document.getElementById("ab-product-grid");
    ACCESS_BANK.products.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "ab-product-card";
      var rateLine = p.rateKnown
        ? '<div class="ab-product-rate">' + p.rate + '% p.a.</div>'
        : '<div class="ab-product-rate ab-product-rate-unknown">Rate not publicly disclosed — contact Access Bank</div>';
      var equityLine = p.equityPct
        ? '<div class="ab-product-row"><span class="k">Equity</span><span>' + p.equityPct + '%</span></div>'
        : "";
      card.innerHTML =
        '<h3 class="ab-product-name">' + esc(p.name) + "</h3>" +
        rateLine +
        equityLine +
        '<p class="ab-product-mechanic">' + esc(p.mechanic) + "</p>";
      grid.appendChild(card);
    });
  }

  function renderOtherProducts() {
    var list = document.getElementById("ab-other-list");
    ACCESS_BANK.otherProducts.forEach(function (p) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + esc(p.name) + ":</strong> " + esc(p.note);
      list.appendChild(li);
    });
  }

  function renderEligibility() {
    var list = document.getElementById("ab-eligibility-list");
    ACCESS_BANK.eligibility.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function renderLimitsAndLinks() {
    document.getElementById("ab-limit-individual").textContent = ACCESS_BANK.facilityLimits.individual;
    document.getElementById("ab-limit-corporate").textContent = ACCESS_BANK.facilityLimits.corporate;
    document.getElementById("ab-limit-tenor").textContent = ACCESS_BANK.facilityLimits.maxTenorYears;
    document.getElementById("ab-limit-age").textContent = ACCESS_BANK.facilityLimits.maxAge;
    document.getElementById("ab-apply-link").href = ACCESS_BANK.applyUrl;
    document.getElementById("ab-mreif-channel-link").href = ACCESS_BANK.mreifChannelUrl;
    document.getElementById("ab-disclaimer").textContent = ACCESS_BANK.disclaimer;
  }

  var nairaFormat = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  function computeMortgage() {
    var price = parseFloat(document.getElementById("ab-calc-price").value) || 0;
    var equityPct = parseFloat(document.getElementById("ab-calc-equity").value) || 0;
    var ratePct = parseFloat(document.getElementById("ab-calc-rate").value) || 0;
    var years = parseFloat(document.getElementById("ab-calc-term").value) || 0;

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

    document.getElementById("ab-calc-loan-amount").textContent = nairaFormat.format(loanAmount);
    document.getElementById("ab-calc-monthly").textContent = nairaFormat.format(monthly);
    document.getElementById("ab-calc-interest").textContent = nairaFormat.format(Math.max(totalInterest, 0));
    document.getElementById("ab-calc-total").textContent = nairaFormat.format(totalRepayment);
  }

  function initCalculator() {
    ["ab-calc-price", "ab-calc-equity", "ab-calc-rate", "ab-calc-term"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", computeMortgage);
    });
    computeMortgage();
  }

  renderProductCards();
  renderOtherProducts();
  renderEligibility();
  renderLimitsAndLinks();
  initCalculator();
})();
