/**
 * The one-page demo UI served at GET / to browsers.
 * Plain HTML, CSS and JS in one string so it ships inside the serverless
 * function with no build step or static-file tracing. The script avoids
 * template literals so this file can stay a single template string.
 */
export const DEMO_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cross-Border Fee API</title>
<meta name="description" content="Itemised all-in price for a cross-border payment into Mexico, Colombia, Brazil or Argentina. A demo by Nityashree S.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f5f5f2; --surface:#ffffff; --ink:#0b0b0c; --ink-2:#4a4a48; --ink-3:#7a7a76;
  --line:#e2e2dc; --line-2:#cfcfc8; --chip:#ecece7; --warn:#8a4b0f; --warn-bg:#f6ecdf;
  --seg-1:#0b0b0c; --seg-2:#55554f; --seg-3:#8d8d86; --seg-4:#b9b9b1; --seg-5:#dcdcd4;
  --font:"Schibsted Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0b0b0c; --surface:#151516; --ink:#f5f5f2; --ink-2:#c3c3bd; --ink-3:#8b8b85;
    --line:#26262a; --line-2:#36363b; --chip:#1e1e21; --warn:#f0b878; --warn-bg:#2a2117;
    --seg-1:#f5f5f2; --seg-2:#bdbdb6; --seg-3:#8d8d86; --seg-4:#5f5f59; --seg-5:#3a3a36;
  }
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--font);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-underline-offset:3px}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line)}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;height:60px}
.brand{font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.brand span{color:var(--ink-3);font-weight:500}
nav{display:flex;gap:18px;font-size:14px;color:var(--ink-2);white-space:nowrap}
nav a{text-decoration:none}
nav a:hover{color:var(--ink);text-decoration:underline}
.hero{padding:44px 0 28px}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
h1{font-size:clamp(28px,4.4vw,44px);line-height:1.08;letter-spacing:-.025em;font-weight:700;margin:10px 0 12px;max-width:760px}
.lede{color:var(--ink-2);max-width:680px;font-size:16px}
.grid{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:20px;align-items:start}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px}
.card h2{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-bottom:16px}
label{display:block;font-size:13px;font-weight:600;color:var(--ink-2);margin:14px 0 6px}
label:first-of-type{margin-top:0}
input,select{width:100%;font:inherit;font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line-2);border-radius:9px;padding:10px 12px;outline:none;appearance:none;-webkit-appearance:none}
select{background-image:linear-gradient(45deg,transparent 50%,var(--ink-3) 50%),linear-gradient(135deg,var(--ink-3) 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
input:focus,select:focus{border-color:var(--ink);box-shadow:0 0 0 3px color-mix(in srgb,var(--ink) 12%,transparent)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.seg{display:flex;flex-wrap:wrap;gap:6px}
.seg button{font:inherit;font-size:13px;font-weight:500;border:1px solid var(--line-2);background:var(--bg);color:var(--ink-2);padding:7px 11px;border-radius:999px;cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.btn{margin-top:20px;width:100%;font:inherit;font-weight:600;font-size:15px;background:var(--ink);color:var(--bg);border:0;border-radius:10px;padding:12px 14px;cursor:pointer}
.btn:disabled{opacity:.55;cursor:wait}
.presets{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.presets p{font-size:12px;color:var(--ink-3);margin-bottom:8px}
.presets .seg button{font-size:12px;padding:5px 9px}
.price{font-size:clamp(30px,5vw,46px);font-weight:700;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}
.sub{color:var(--ink-2);margin-top:6px;font-variant-numeric:tabular-nums}
.bar{display:flex;height:14px;border-radius:7px;overflow:hidden;margin:22px 0 8px;background:var(--chip)}
.bar div{height:100%;transition:width .35s ease}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--ink-2)}
.legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:-1px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-variant-numeric:tabular-nums}
th{font-size:12px;text-align:left;color:var(--ink-3);font-weight:600;padding:0 0 8px;border-bottom:1px solid var(--line)}
td{padding:11px 0;border-bottom:1px solid var(--line);vertical-align:top}
td.num,th.num{text-align:right;white-space:nowrap;padding-left:12px}
td small{display:block;color:var(--ink-3);font-size:12px;margin-top:2px}
tr.total td{font-weight:700;border-bottom:0}
.empty{color:var(--ink-3);padding:40px 0;text-align:center}
.err{background:var(--warn-bg);color:var(--warn);border-radius:9px;padding:12px 14px;font-size:14px;margin-top:4px}
.err ul{margin:6px 0 0 18px}
.note{display:flex;gap:10px;background:var(--warn-bg);color:var(--warn);border-radius:10px;padding:12px 14px;font-size:13px;margin-top:18px}
.section{padding:44px 0 8px}
.section h3{font-size:22px;letter-spacing:-.015em;margin-bottom:6px}
.section p.lede{font-size:15px}
.diagram{margin-top:18px;overflow-x:auto}
.diagram svg{display:block;min-width:720px;width:100%;height:auto}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}
.step{border-top:2px solid var(--ink);padding-top:10px;font-size:14px;color:var(--ink-2)}
.step b{display:block;color:var(--ink);margin-bottom:2px}
pre{position:relative;padding-top:46px !important;font-family:var(--mono);font-size:12.5px;line-height:1.6;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px;overflow-x:auto;margin-top:16px;color:var(--ink-2)}
.copy{position:absolute;top:10px;right:10px;font:inherit;font-size:12px;border:1px solid var(--line-2);background:var(--bg);color:var(--ink-2);border-radius:7px;padding:4px 9px;cursor:pointer}
footer{border-top:1px solid var(--line);margin-top:48px;padding:24px 0 40px;color:var(--ink-3);font-size:13px}
footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media (max-width:820px){
  .grid{grid-template-columns:1fr}
  .steps{grid-template-columns:1fr 1fr}
  nav .hide-sm,.brand span{display:none}
  nav{gap:14px}
  .wrap{padding:0 16px}
}
</style>
</head>
<body>
<header>
  <div class="wrap top">
    <div class="brand">Cross-Border Fee API <span>· demo</span></div>
    <nav>
      <a href="#how">How it works</a>
      <a class="hide-sm" href="#api">API</a>
      <a href="https://github.com/Nityaa08/cross-border-fee-api">GitHub</a>
      <a class="hide-sm" href="https://nityashree.in">Portfolio</a>
    </nav>
  </div>
</header>

<main class="wrap">
  <section class="hero">
    <div class="eyebrow">TypeScript · Express · pure fee engine</div>
    <h1>What does a customer in Latin America really pay for a cross-border purchase?</h1>
    <p class="lede">Enter a price and a payment route. The API itemises the FX spread, processing fee, cross-border surcharge and tax, and returns the all-in price in the customer's currency. Every rate comes from one config file.</p>
  </section>

  <div class="grid">
    <form class="card" id="form" novalidate>
      <h2>Transaction</h2>
      <label for="amount">Price</label>
      <div class="row">
        <input id="amount" name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" value="100" required>
        <select id="currency" name="currency" aria-label="Currency"></select>
      </div>

      <label for="customer">Customer country</label>
      <select id="customer" name="customer"></select>

      <label for="merchant">Merchant country (ISO code)</label>
      <input id="merchant" name="merchant" value="US" maxlength="2" autocomplete="off" spellcheck="false" style="text-transform:uppercase">

      <label>Payment method</label>
      <div class="seg" id="methods" role="group" aria-label="Payment method"></div>

      <button class="btn" id="go" type="submit">Calculate</button>

      <div class="presets">
        <p>Try a scenario</p>
        <div class="seg" id="presets"></div>
      </div>
    </form>

    <section class="card" id="result" aria-live="polite">
      <h2>All-in customer price</h2>
      <div class="empty">Run a calculation to see the breakdown.</div>
    </section>
  </div>

  <div class="note" role="note">
    <span aria-hidden="true">!</span>
    <span>Illustrative numbers. FX rates are fixed constants dated 2026-02-21, not live quotes, and the Argentina tax rule ("PAIS") is out of date. The point is the engine and its transparency, not the rates.</span>
  </div>

  <section class="section" id="how">
    <h3>How it works</h3>
    <p class="lede">A request passes validation, then a pure calculation function applies four steps in a fixed order. Percentage fees are taken on the mid-market amount, so fees never compound on each other.</p>
    <div class="diagram" aria-label="Request flow diagram">
      <svg viewBox="0 0 960 150" role="img" aria-labelledby="dg-title">
        <title id="dg-title">Request to validation, then FX, processing, cross-border and tax steps, then the itemised response</title>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>
        </defs>
        <g fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--ink-3)">
          <path d="M110 60 H133" marker-end="url(#arr)"/>
          <path d="M245 60 H273" marker-end="url(#arr)"/>
          <path d="M395 60 H413" marker-end="url(#arr)"/>
          <path d="M535 60 H553" marker-end="url(#arr)"/>
          <path d="M675 60 H693" marker-end="url(#arr)"/>
          <path d="M815 60 H846" marker-end="url(#arr)"/>
        </g>
        <g font-family="Schibsted Grotesk, system-ui, sans-serif" font-size="13" text-anchor="middle">
          <rect x="4" y="35" width="106" height="50" rx="9" fill="var(--surface)" stroke="var(--line-2)"/>
          <text x="57" y="57" fill="var(--ink)" font-weight="600">POST</text>
          <text x="57" y="74" fill="var(--ink-3)" font-size="11">/api/v1/calculate</text>

          <rect x="135" y="35" width="110" height="50" rx="9" fill="var(--surface)" stroke="var(--line-2)"/>
          <text x="190" y="57" fill="var(--ink)" font-weight="600">Validate</text>
          <text x="190" y="74" fill="var(--ink-3)" font-size="11">400 + field errors</text>

          <rect x="263" y="20" width="564" height="80" rx="12" fill="none" stroke="var(--ink)" stroke-dasharray="4 4"/>
          <text x="545" y="122" fill="var(--ink-3)" font-size="11">calculateFees(): pure, deterministic, no HTTP</text>

          <rect x="275" y="35" width="120" height="50" rx="9" fill="var(--ink)"/>
          <text x="335" y="57" fill="var(--bg)" font-weight="600">1 · FX</text>
          <text x="335" y="74" fill="var(--bg)" font-size="11" opacity=".75">mid-market + spread</text>

          <rect x="415" y="35" width="120" height="50" rx="9" fill="var(--ink)"/>
          <text x="475" y="57" fill="var(--bg)" font-weight="600">2 · Processing</text>
          <text x="475" y="74" fill="var(--bg)" font-size="11" opacity=".75">% + flat USD fee</text>

          <rect x="555" y="35" width="120" height="50" rx="9" fill="var(--ink)"/>
          <text x="615" y="57" fill="var(--bg)" font-weight="600">3 · Cross-border</text>
          <text x="615" y="74" fill="var(--bg)" font-size="11" opacity=".75">if countries differ</text>

          <rect x="695" y="35" width="120" height="50" rx="9" fill="var(--ink)"/>
          <text x="755" y="57" fill="var(--bg)" font-weight="600">4 · Tax</text>
          <text x="755" y="74" fill="var(--bg)" font-size="11" opacity=".75">if FX or cross-border</text>

          <rect x="848" y="35" width="108" height="50" rx="9" fill="var(--surface)" stroke="var(--line-2)"/>
          <text x="902" y="57" fill="var(--ink)" font-weight="600">Itemised JSON</text>
          <text x="902" y="74" fill="var(--ink-3)" font-size="11">fees[] + price</text>
        </g>
      </svg>
    </div>
    <div class="steps">
      <div class="step"><b>Config-driven</b>Every rate, spread and tax lives in <code>src/config/fees.ts</code>.</div>
      <div class="step"><b>Pure engine</b>Same input, same output. No I/O, so it is easy to test.</div>
      <div class="step"><b>Clear errors</b>Bad input is a 400 that names each field; internals never leak.</div>
      <div class="step"><b>Tested</b>Jest unit and HTTP tests run on every change.</div>
    </div>
  </section>

  <section class="section" id="api">
    <h3>Call the API</h3>
    <p class="lede">The same endpoint this page uses. The command below follows the form. Public requests are rate limited.</p>
    <pre id="curl"><button class="copy" id="copy" type="button">Copy</button><span id="curl-text"></span></pre>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>Built by <a href="https://nityashree.in">Nityashree S</a> · <a href="https://github.com/Nityaa08/cross-border-fee-api">Source on GitHub</a></span>
    <span><a href="/health">/health</a> · <a href="/api/v1/config">/api/v1/config</a></span>
  </div>
</footer>

<script>
(function(){
  var COUNTRY_NAMES = {MX:"Mexico", CO:"Colombia", BR:"Brazil", AR:"Argentina"};
  var METHOD_NAMES = {card:"Card", bank_transfer:"Bank transfer", cash_voucher:"Cash voucher"};
  var FEE_NAMES = {fx_conversion_cost:"FX spread", payment_processing_fee:"Processing", cross_border_fee:"Cross-border", tax_withholding:"Tax"};
  var PRESETS = [
    {label:"US → MX card", amount:100, currency:"USD", customer:"MX", merchant:"US", method:"card"},
    {label:"US → BR card", amount:250, currency:"USD", customer:"BR", merchant:"US", method:"card"},
    {label:"US → AR voucher", amount:50, currency:"USD", customer:"AR", merchant:"US", method:"cash_voucher"},
    {label:"CO → CO domestic", amount:500000, currency:"COP", customer:"CO", merchant:"CO", method:"bank_transfer"}
  ];
  var cfg = null;
  var method = "card";
  var $ = function(id){ return document.getElementById(id); };

  function fmt(n, cur){
    try { return new Intl.NumberFormat(undefined, {style:"currency", currency:cur, maximumFractionDigits:2}).format(n); }
    catch(e){ return cur + " " + n.toFixed(2); }
  }
  function pct(x){ return (x*100).toFixed(1).replace(/\\.0$/, "") + "%"; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]; }); }

  function localCurrency(code){
    if (!cfg) return null;
    for (var i=0;i<cfg.countries.length;i++) if (cfg.countries[i].code===code) return cfg.countries[i].currency;
    return null;
  }
  function fillCurrencies(keep){
    var local = localCurrency($("customer").value);
    var sel = $("currency"), prev = keep || sel.value;
    sel.innerHTML = "";
    ["USD", local].forEach(function(c){ if(!c) return; var o=document.createElement("option"); o.value=c; o.textContent=c; sel.appendChild(o); });
    sel.value = (prev===local || prev==="USD") ? prev : "USD";
  }
  function renderMethods(){
    var box = $("methods"); box.innerHTML = "";
    Object.keys(METHOD_NAMES).forEach(function(m){
      var b = document.createElement("button");
      b.type = "button"; b.textContent = METHOD_NAMES[m];
      b.setAttribute("aria-pressed", m===method ? "true" : "false");
      b.onclick = function(){ method = m; renderMethods(); updateCurl(); };
      box.appendChild(b);
    });
  }
  function body(){
    return {
      original_amount: parseFloat($("amount").value),
      original_currency: $("currency").value,
      customer_country: $("customer").value,
      merchant_country: $("merchant").value.trim().toUpperCase(),
      payment_method: method
    };
  }
  function updateCurl(){
    var b = JSON.stringify(body());
    $("curl-text").textContent = "curl -X POST " + location.origin + "/api/v1/calculate \\\\\\n  -H 'Content-Type: application/json' \\\\\\n  -d '" + b + "'";
  }

  function showError(data, status){
    var html = '<h2>All-in customer price</h2><div class="err"><b>' + esc(data && data.error ? data.error : "Request failed") + '</b> (HTTP ' + status + ')';
    if (data && data.details) {
      html += "<ul>" + data.details.map(function(d){ return "<li><code>" + esc(d.field) + "</code>: " + esc(d.message) + "</li>"; }).join("") + "</ul>";
    } else if (data && data.message) {
      html += "<div>" + esc(data.message) + "</div>";
    }
    $("result").innerHTML = html + "</div>";
  }

  function render(r){
    var cur = r.final_currency;
    var segs = [{label:"Price at mid-market", amount:r.settlement_amount, color:"var(--seg-1)"}];
    var tones = ["var(--seg-2)","var(--seg-3)","var(--seg-4)","var(--seg-5)"];
    r.fees.forEach(function(f, i){ segs.push({label:FEE_NAMES[f.name]||f.name, amount:f.amount, color:tones[i%tones.length]}); });
    var total = r.final_customer_price || 1;

    var html = '<h2>All-in customer price</h2>';
    html += '<div class="price">' + esc(fmt(r.final_customer_price, cur)) + '</div>';
    html += '<div class="sub">for a price of ' + esc(fmt(r.original_amount, r.original_currency)) +
            ' · fees add <b>' + pct(r.total_fees_pct) + '</b> (' + esc(fmt(r.total_fees, cur)) + ')' +
            (r.fx_rate ? ' · effective rate ' + r.fx_rate : '') + '</div>';
    html += '<div class="bar" role="img" aria-label="Price breakdown">' + segs.map(function(s){
      return '<div title="' + esc(s.label) + '" style="width:' + (s.amount/total*100).toFixed(2) + '%;background:' + s.color + '"></div>';
    }).join("") + '</div>';
    html += '<div class="legend">' + segs.map(function(s){ return '<span><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span>'; }).join("") + '</div>';
    html += '<table><thead><tr><th>Line</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>';
    html += '<tr><td>Price at mid-market<small>' + esc(fmt(r.original_amount, r.original_currency)) + (r.fx_rate ? ' converted to ' + esc(cur) : ', no conversion') + '</small></td><td class="num">–</td><td class="num">' + esc(fmt(r.settlement_amount, cur)) + '</td></tr>';
    r.fees.forEach(function(f){
      html += '<tr><td>' + esc(FEE_NAMES[f.name]||f.name) + '<small>' + esc(f.description) + '</small></td><td class="num">' + (f.rate!=null ? pct(f.rate) : '–') + '</td><td class="num">' + esc(fmt(f.amount, cur)) + '</td></tr>';
    });
    html += '<tr class="total"><td>Customer pays</td><td class="num"></td><td class="num">' + esc(fmt(r.final_customer_price, cur)) + '</td></tr>';
    html += '</tbody></table>';
    $("result").innerHTML = html;
  }

  function calculate(e){
    if (e) e.preventDefault();
    var btn = $("go"); btn.disabled = true; btn.textContent = "Calculating…";
    updateCurl();
    fetch("/api/v1/calculate", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body())})
      .then(function(res){ return res.json().then(function(d){ return {ok:res.ok, status:res.status, data:d}; }); })
      .then(function(r){ if (r.ok) render(r.data); else showError(r.data, r.status); })
      .catch(function(){ showError({error:"Network error", message:"Could not reach the API."}, 0); })
      .then(function(){ btn.disabled = false; btn.textContent = "Calculate"; });
  }

  function applyPreset(p){
    $("amount").value = p.amount; $("customer").value = p.customer; fillCurrencies(p.currency);
    $("currency").value = p.currency; $("merchant").value = p.merchant; method = p.method;
    renderMethods(); calculate();
  }

  fetch("/api/v1/config").then(function(r){ return r.json(); }).then(function(c){
    cfg = c;
    var sel = $("customer");
    c.countries.forEach(function(k){ var o=document.createElement("option"); o.value=k.code; o.textContent=(COUNTRY_NAMES[k.code]||k.code) + " (" + k.currency + ")"; sel.appendChild(o); });
    sel.value = "MX";
    fillCurrencies("USD");
    renderMethods();
    var pbox = $("presets");
    PRESETS.forEach(function(p){ var b=document.createElement("button"); b.type="button"; b.textContent=p.label; b.onclick=function(){ applyPreset(p); }; pbox.appendChild(b); });
    calculate();
  });

  $("form").addEventListener("submit", calculate);
  $("customer").addEventListener("change", function(){ fillCurrencies(); updateCurl(); });
  ["amount","currency","merchant"].forEach(function(id){ $(id).addEventListener("input", updateCurl); });
  $("copy").addEventListener("click", function(){
    navigator.clipboard && navigator.clipboard.writeText($("curl-text").textContent).then(function(){ $("copy").textContent = "Copied"; setTimeout(function(){ $("copy").textContent = "Copy"; }, 1500); });
  });
})();
</script>
</body>
</html>
`;
