/**
 * The one-page demo UI served at GET / to browsers.
 * Plain HTML, CSS and JS in one string so it ships inside the serverless
 * function with no build step or static-file tracing. The script avoids
 * template literals so this file can stay a single template string.
 *
 * Design: a checkout terminal on the left (pick a corridor, a price and a
 * payment method) that prints an itemised receipt on the right. System font
 * stacks only, so the page makes no third-party requests.
 */
export const DEMO_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cross-Border Fee API</title>
<meta name="description" content="Itemised all-in price for a cross-border payment into Mexico, Colombia, Brazil or Argentina, printed as a checkout receipt. A demo by Nityashree S.">
<meta name="theme-color" content="#073b30">
<style>
:root{
  --bg:#f3f6f5; --panel:#ffffff; --ink:#0f1f1a; --ink-2:#34463f; --muted:#56665f;
  --line:#dbe4e0; --line-2:#c3d0cb; --field:#f7faf9;
  --brand:#0b5d4b; --brand-hover:#08493b; --brand-ink:#ffffff; --brand-soft:#e2f0eb;
  --band:#073b30; --band-ink:#ffffff; --band-muted:#a9cfc3;
  --tax:#a34a0c; --tax-soft:#fbefe4;
  --focus:#1f8a6d;
  /* The receipt is paper in both themes. */
  --r-paper:#fffefb; --r-ink:#18201d; --r-muted:#59615d; --r-line:#c9cfcc; --r-tax:#a34a0c;
  --s-fx:#0b5d4b; --s-proc:#2f957a; --s-xb:#86c9b4; --s-tax:#cf6a17;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono","DejaVu Sans Mono",monospace;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#08120f; --panel:#101d19; --ink:#e7f0ec; --ink-2:#bfd0c9; --muted:#97aba3;
    --line:#22352e; --line-2:#33493f; --field:#0b1714;
    --brand:#3cc29a; --brand-hover:#5fd3af; --brand-ink:#03211a; --brand-soft:#123129;
    --band:#04211a; --band-ink:#ffffff; --band-muted:#9cc6b8;
    --tax:#f0a565; --tax-soft:#2c1d10; --focus:#5fd3af;
  }
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-underline-offset:3px}
code,.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-radius:6px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}

/* ── Band: header + intro on deep emerald ── */
.band{background:var(--band);color:var(--band-ink);padding-bottom:76px;position:relative}
.band::after{content:"";position:absolute;inset:auto 0 0 0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-.01em;white-space:nowrap;text-decoration:none}
.mark{width:26px;height:26px;border-radius:7px;background:var(--band-ink);color:var(--band);display:grid;place-items:center;font-family:var(--mono);font-size:14px;font-weight:700}
.brand small{font-family:var(--mono);font-weight:500;font-size:11px;letter-spacing:.06em;color:var(--band-muted);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:1px 8px}
nav{display:flex;gap:4px;font-size:14px;white-space:nowrap}
nav a{text-decoration:none;color:var(--band-muted);padding:6px 10px;border-radius:8px}
nav a:hover{color:var(--band-ink);background:rgba(255,255,255,.08)}
.intro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px;align-items:end;padding-top:40px}
.kicker{font-family:var(--mono);font-size:12px;letter-spacing:.04em;color:var(--band-muted)}
.kicker b{color:var(--band-ink);font-weight:600}
h1{font-size:clamp(30px,4.2vw,46px);line-height:1.06;letter-spacing:-.03em;font-weight:750;margin:12px 0 14px;max-width:720px}
h1 em{font-style:normal;color:#9fe3cb}
.lede{color:var(--band-muted);max-width:620px;font-size:16px}
.stamp{font-family:var(--mono);font-size:12px;color:var(--band-muted);text-align:right;line-height:1.7;border-left:1px solid rgba(255,255,255,.18);padding-left:18px}
.stamp b{display:block;color:var(--band-ink);font-size:22px;font-weight:600;letter-spacing:-.01em}

/* ── Layout: terminal (left) prints receipt (right) ── */
.grid{display:grid;grid-template-columns:minmax(0,1fr) 440px;grid-template-areas:"form receipt" "sources receipt";grid-template-rows:auto 1fr;gap:18px 28px;align-items:start;margin-top:-52px;position:relative}
.form{grid-area:form}.sources{grid-area:sources}.receipt-col{grid-area:receipt}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:0 1px 2px rgba(7,59,48,.06),0 12px 32px -12px rgba(7,59,48,.18)}
.form{padding:24px}
.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.panel-head h2{font-size:17px;letter-spacing:-.01em}
.tag{font-family:var(--mono);font-size:12px;color:var(--brand);background:var(--brand-soft);border-radius:999px;padding:4px 10px;white-space:nowrap}
label,legend,.lbl{display:block;font-size:13px;font-weight:600;color:var(--ink-2);margin-bottom:6px}
.hint{font-weight:400;color:var(--muted)}
input,select{width:100%;font:inherit;font-size:15px;color:var(--ink);background:var(--field);border:1px solid var(--line-2);border-radius:10px;padding:11px 12px;appearance:none;-webkit-appearance:none}
select{background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);background-position:calc(100% - 18px) 52%,calc(100% - 13px) 52%;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
input:focus-visible,select:focus-visible{outline:none;border-color:var(--focus);box-shadow:0 0 0 3px color-mix(in srgb,var(--focus) 28%,transparent)}
input[aria-invalid="true"]{border-color:var(--tax)}

/* Corridor: merchant → customer drawn as a route */
.route{display:grid;grid-template-columns:minmax(0,1fr) 112px minmax(0,1.35fr);align-items:end;gap:0;padding:16px;border:1px dashed var(--line-2);border-radius:14px;background:var(--field)}
.route input,.route select{background:var(--panel);font-family:var(--mono);font-weight:600}
.route input{text-transform:uppercase;letter-spacing:.08em}
.path{position:relative;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.path::before{content:"";position:absolute;left:10px;right:10px;top:50%;border-top:2px dashed var(--brand);opacity:.55}
.path span{white-space:nowrap;position:relative;font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--brand);background:var(--field);padding:0 6px;margin-top:-26px}
.path svg{position:relative;color:var(--brand);background:var(--field);padding:0 4px;margin-top:4px}
.chips-row{margin:14px 0 20px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font:inherit;display:inline-flex;align-items:baseline;gap:8px;border:1px solid var(--line-2);background:var(--panel);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;font-size:13px}
.chip b{font-family:var(--mono);font-weight:600;letter-spacing:.02em}
.chip span{color:var(--muted);font-size:12px}
.chip:hover{border-color:var(--brand)}
.chip[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.chip[aria-pressed="true"] span{color:var(--brand-ink);opacity:.85}
.fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:16px;align-items:start}
.money{display:flex;border:1px solid var(--line-2);border-radius:10px;background:var(--field)}
.money:focus-within{border-color:var(--focus);box-shadow:0 0 0 3px color-mix(in srgb,var(--focus) 28%,transparent)}
.money select{width:92px;flex:none;border:0;border-right:1px solid var(--line-2);border-radius:10px 0 0 10px;background-color:transparent;font-family:var(--mono);font-weight:600}
.money input{border:0;border-radius:0 10px 10px 0;background:transparent;font-family:var(--mono);font-size:17px;font-weight:600;text-align:right;min-width:0}
.money input:focus-visible,.money select:focus-visible{box-shadow:none;outline:2px solid var(--focus);outline-offset:-2px}
fieldset{border:0;min-width:0}
.seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line-2);border-radius:10px;padding:3px;background:var(--field);gap:3px}
.seg label{margin:0;position:relative;cursor:pointer}
.seg input{position:absolute;opacity:0;width:1px;height:1px}
.seg span{display:block;text-align:center;font-size:13px;font-weight:600;color:var(--ink-2);padding:8px 4px;border-radius:7px;white-space:nowrap}
.seg input:checked + span{background:var(--brand);color:var(--brand-ink);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.seg input:focus-visible + span{outline:3px solid var(--focus);outline-offset:1px}
.btn{margin-top:22px;width:100%;font:inherit;font-weight:650;font-size:15px;background:var(--brand);color:var(--brand-ink);border:0;border-radius:11px;padding:13px 14px;cursor:pointer;display:flex;justify-content:center;gap:10px;align-items:center}
.btn:hover{background:var(--brand-hover)}
.btn:disabled{opacity:.6;cursor:wait}
.btn kbd{font-family:var(--mono);font-size:11px;font-weight:500;border:1px solid currentColor;border-radius:5px;padding:0 5px;opacity:.7}

.sources{padding:18px 24px;font-size:13px;color:var(--ink-2)}
.sources h2{font-size:12px;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:8px}
.sources dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px}
.sources dt{font-family:var(--mono);color:var(--muted);white-space:nowrap}
.sources dd{min-width:0;overflow-wrap:anywhere}
.ok{color:var(--brand);font-weight:600}
.warn{color:var(--tax);font-weight:600}
.note{margin-top:12px;font-size:12.5px;color:var(--muted)}

/* ── The receipt ── */
.printer{height:18px;border-radius:10px;background:linear-gradient(#1b2b26,#0e1916);box-shadow:inset 0 -6px 0 #050b09,0 2px 6px rgba(0,0,0,.25);position:relative;z-index:2}
.paper{margin:-8px 16px 0;filter:drop-shadow(0 1px 1px rgba(0,0,0,.08)) drop-shadow(0 14px 20px rgba(7,59,48,.16));position:relative;z-index:1}
.paper::after{content:"";display:block;height:10px;background:linear-gradient(135deg,var(--r-paper) 50%,transparent 50%) 0 0/16px 10px repeat-x,linear-gradient(-135deg,var(--r-paper) 50%,transparent 50%) 0 0/16px 10px repeat-x}
.receipt{background:var(--r-paper);color:var(--r-ink);padding:30px 24px 22px;font-family:var(--mono);font-size:13px;line-height:1.45;font-variant-numeric:tabular-nums}
.receipt.printing{animation:feed .5s cubic-bezier(.2,.7,.2,1)}
@keyframes feed{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@media (prefers-reduced-motion:reduce){.receipt.printing{animation:none}}
.r-head{text-align:center;padding-bottom:14px}
.r-title{font-weight:700;letter-spacing:.18em;font-size:13px}
.r-route{font-size:22px;font-weight:700;letter-spacing:.04em;margin:8px 0 2px}
.r-meta{color:var(--r-muted);font-size:12px}
.r-rule{border:0;border-top:1px dashed var(--r-line);margin:12px 0}
.r-lines{width:100%;border-collapse:collapse}
.r-lines th{font-size:11px;font-weight:500;color:var(--r-muted);text-align:left;letter-spacing:.06em;text-transform:uppercase;padding-bottom:6px}
.r-lines td{padding:7px 0;vertical-align:top}
.r-lines .num{text-align:right;white-space:nowrap;padding-left:12px}
.r-lines small{display:block;font-size:11.5px;color:var(--r-muted);margin-top:2px;line-height:1.4;overflow-wrap:anywhere}
.r-lines tr.tax td,.r-lines tr.tax small{color:var(--r-tax)}
.r-lines tr.sub td{border-top:1px dashed var(--r-line);padding-top:10px;color:var(--r-muted)}
.r-total{border-top:2px dashed var(--r-ink);margin-top:10px;padding-top:12px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.r-total .k{font-weight:700;letter-spacing:.14em}
.r-big{font-size:clamp(28px,7vw,34px);font-weight:700;letter-spacing:-.02em;line-height:1.1;text-align:right}
.r-big small{font-size:14px;font-weight:600;margin-left:6px;color:var(--r-muted);letter-spacing:.04em}
.r-markup{display:flex;justify-content:space-between;gap:12px;margin-top:6px;color:var(--r-muted);font-size:12px}
.r-markup b{color:var(--r-ink)}
.bar{display:flex;height:12px;border-radius:3px;overflow:hidden;margin:18px 0 10px;background:#e7ebe9;gap:2px}
.bar div{height:100%;min-width:3px}
.legend{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:11.5px;color:var(--r-muted)}
.legend li{display:flex;gap:6px;align-items:center;min-width:0}
.legend i{width:9px;height:9px;border-radius:2px;flex:none}
.legend b{color:var(--r-ink);font-weight:600;margin-left:auto}
.r-foot{text-align:center;margin-top:18px;color:var(--r-muted);font-size:11.5px}
.barcode{height:34px;margin:0 auto 8px;width:70%;background:repeating-linear-gradient(90deg,var(--r-ink) 0 2px,transparent 2px 4px,var(--r-ink) 4px 5px,transparent 5px 8px,var(--r-ink) 8px 11px,transparent 11px 12px,var(--r-ink) 12px 13px,transparent 13px 17px)}
.r-empty{text-align:center;color:var(--r-muted);padding:34px 0}
.r-err h3{font-size:14px;letter-spacing:.14em;color:var(--r-tax);text-align:center}
.r-err p{margin-top:8px}
.r-err ul{list-style:none;margin-top:10px}
.r-err li{padding:8px 0;border-top:1px dashed var(--r-line)}
.r-err li code{font-weight:700;display:block}

/* Terminal snippet */
.term{margin-top:22px;background:#0c1a16;color:#d8ece4;border-radius:12px;overflow:hidden;border:1px solid #1d3029}
.term-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 14px;border-bottom:1px solid #1d3029;font-family:var(--mono);font-size:11.5px;color:#9cc6b8}
.copy{font:inherit;font-size:12px;border:1px solid #2c4a40;background:#12261f;color:#d8ece4;border-radius:7px;padding:3px 10px;cursor:pointer}
.copy:hover{border-color:#5fd3af}
.term pre{margin:0;padding:14px;font-family:var(--mono);font-size:12px;line-height:1.65;white-space:pre-wrap;word-break:break-all}
.term .p{color:#5fd3af;user-select:none}

/* ── How it works ── */
.section{padding:64px 0 8px}
.section h2{font-size:24px;letter-spacing:-.02em}
.section .sub{color:var(--ink-2);max-width:640px;margin-top:6px}
.flow{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px;counter-reset:step}
.flow li{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;font-size:14px;color:var(--ink-2);position:relative}
.flow li::before{counter-increment:step;content:counter(step);font-family:var(--mono);font-weight:700;font-size:12px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--brand);color:var(--brand-ink);margin-bottom:10px}
.flow li.t::before{background:var(--tax);color:#fff}
.flow b{display:block;color:var(--ink);font-size:15px}
.flow code{font-size:12px;color:var(--muted)}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:22px;font-size:14px;color:var(--ink-2)}
.facts b{display:block;color:var(--ink)}
.facts div{border-top:2px solid var(--brand);padding-top:10px}
footer{border-top:1px solid var(--line);margin-top:56px;padding:24px 0 40px;color:var(--muted);font-size:13px}
footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
footer a{color:var(--ink-2)}

@media (max-width:960px){
  .grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"form" "receipt" "sources";grid-template-rows:auto;gap:28px}
  .receipt-col{max-width:460px;width:100%;margin:0 auto}
  .flow,.facts{grid-template-columns:1fr 1fr}
  .stamp{display:none}
  .intro{grid-template-columns:1fr}
}
@media (max-width:560px){
  .wrap{padding:0 16px}
  nav .hide-sm,.brand small{display:none}
  nav a{padding:6px 8px}
  .intro{padding-top:20px}
  .hint{display:none}
  .band{padding-bottom:64px}
  .form{padding:18px}
  .route{grid-template-columns:minmax(0,.8fr) 56px minmax(0,1.3fr);padding:12px}
  .path span{display:none}
  .fields{grid-template-columns:1fr}
  .flow,.facts{grid-template-columns:1fr}
  .receipt{padding:26px 18px 20px}
  .paper{margin:-8px 10px 0}
  .sources{padding:16px 18px}
}
</style>
</head>
<body>
<div class="band">
  <header class="wrap top">
    <a class="brand" href="/"><span class="mark" aria-hidden="true">⇄</span>Cross-Border Fee API <small>DEMO</small></a>
    <nav aria-label="Site">
      <a href="#how">How it works</a>
      <a class="hide-sm" href="#api">API</a>
      <a href="https://github.com/Nityaa08/cross-border-fee-api">GitHub</a>
      <a class="hide-sm" href="https://nityashree.in">Portfolio</a>
    </nav>
  </header>
  <div class="wrap intro">
    <div>
      <p class="kicker"><b>POST</b> /api/v1/calculate · TypeScript · Express</p>
      <h1>The price tag says $100. <em>The receipt tells the truth.</em></h1>
      <p class="lede">Pick a corridor into Mexico, Colombia, Brazil or Argentina. The API itemises the FX spread, processing fee, cross-border surcharge and local tax, and returns the all-in price in the customer's currency.</p>
    </div>
    <p class="stamp" aria-hidden="true"><b>4 markets</b>3 payment methods<br>1 config file</p>
  </div>
</div>

<main class="wrap">
  <div class="grid">
      <form class="panel form" id="form" novalidate aria-labelledby="form-title">
        <div class="panel-head">
          <h2 id="form-title">Checkout</h2>
          <span class="tag" id="route-tag" aria-live="off">US → MX · USD → MXN</span>
        </div>

        <div class="route">
          <div>
            <label for="merchant">Merchant <span class="hint">ISO code</span></label>
            <input id="merchant" name="merchant" value="US" maxlength="2" autocomplete="off" spellcheck="false" aria-describedby="merchant-hint">
          </div>
          <div class="path" aria-hidden="true">
            <span id="path-kind">cross-border</span>
            <svg width="22" height="14" viewBox="0 0 22 14"><path d="M1 7h18M13 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <label for="customer">Customer</label>
            <select id="customer" name="customer"></select>
          </div>
        </div>
        <p class="sr" id="merchant-hint">Two-letter country code of the merchant, for example US</p>

        <div class="chips-row">
          <p class="lbl" id="chips-label">Try a corridor</p>
          <div class="chips" id="presets" role="group" aria-labelledby="chips-label"></div>
        </div>

        <div class="fields">
          <div>
            <label for="amount">Price</label>
            <div class="money">
              <select id="currency" name="currency" aria-label="Currency"></select>
              <input id="amount" name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" value="100" required>
            </div>
          </div>
          <fieldset>
            <legend>Payment method</legend>
            <div class="seg" id="methods">
              <label><input type="radio" name="method" value="card" checked><span>Card</span></label>
              <label><input type="radio" name="method" value="bank_transfer"><span>Bank transfer</span></label>
              <label><input type="radio" name="method" value="cash_voucher"><span>Cash voucher</span></label>
            </div>
          </fieldset>
        </div>

        <button class="btn" id="go" type="submit">Calculate</button>
      </form>

      <section class="panel sources" id="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Rates &amp; sources</h2>
        <dl id="sources-list"><dt>Loading</dt><dd>Reading <code>GET /api/v1/config</code>…</dd></dl>
        <p class="note">Illustrative numbers: FX rates are fixed constants, not live quotes. The point is the engine and its transparency, not the rates.</p>
      </section>

    <div class="receipt-col">
      <div class="printer" aria-hidden="true"></div>
      <div class="paper">
        <section class="receipt" id="result" aria-live="polite" aria-label="Receipt">
          <div class="r-head"><div class="r-title">CUSTOMER RECEIPT</div></div>
          <div class="r-empty">Run a calculation to print the breakdown.</div>
        </section>
      </div>

      <div class="term" id="api">
        <div class="term-bar"><span>same request, from a terminal</span><button class="copy" id="copy" type="button">Copy</button></div>
        <pre><span class="p" aria-hidden="true">$ </span><span id="curl-text"></span></pre>
      </div>
    </div>
  </div>

  <section class="section" id="how" aria-labelledby="how-title">
    <h2 id="how-title">How it works</h2>
    <p class="sub">A request passes validation, then one pure function applies four steps in a fixed order. Percentage fees are taken on the mid-market amount, so fees never compound on each other.</p>
    <ol class="flow">
      <li><b>FX spread</b>Convert at mid-market, add the corridor's spread. <code>fx.ts</code></li>
      <li><b>Processing</b>Percentage plus a flat USD fee, by payment method.</li>
      <li><b>Cross-border</b>Only when merchant and customer countries differ.</li>
      <li class="t"><b>Local tax</b>IVA, IOF or the AR rule, when the payment is cross-border or in foreign currency.</li>
    </ol>
    <div class="facts">
      <div><b>Config-driven</b>Every rate, spread and tax lives in <code>src/config/fees.ts</code>.</div>
      <div><b>Pure engine</b>Same input, same output. No I/O, so it is easy to test.</div>
      <div><b>Clear errors</b>Bad input is a 400 that names each field; internals never leak.</div>
      <div><b>Tested</b>Jest unit and HTTP tests run in CI on every push.</div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>Built by <a href="https://nityashree.in">Nityashree S</a> · <a href="https://github.com/Nityaa08/cross-border-fee-api">Source on GitHub</a></span>
    <span class="mono"><a href="/health">/health</a> · <a href="/api/v1/config">/api/v1/config</a></span>
  </div>
</footer>

<script>
(function(){
  var COUNTRY_NAMES = {MX:"Mexico", CO:"Colombia", BR:"Brazil", AR:"Argentina"};
  var METHOD_NAMES = {card:"Card", bank_transfer:"Bank transfer", cash_voucher:"Cash voucher"};
  var FEES = {
    fx_conversion_cost:{label:"FX spread", color:"var(--s-fx)"},
    payment_processing_fee:{label:"Processing", color:"var(--s-proc)"},
    cross_border_fee:{label:"Cross-border", color:"var(--s-xb)"},
    tax_withholding:{label:"Tax", color:"var(--s-tax)"}
  };
  var PRESETS = [
    {route:"US→MX", note:"card · $100", amount:100, currency:"USD", customer:"MX", merchant:"US", method:"card"},
    {route:"US→BR", note:"card · $250", amount:250, currency:"USD", customer:"BR", merchant:"US", method:"card"},
    {route:"US→AR", note:"voucher · $50", amount:50, currency:"USD", customer:"AR", merchant:"US", method:"cash_voucher"},
    {route:"CO→CO", note:"domestic", amount:500000, currency:"COP", customer:"CO", merchant:"CO", method:"bank_transfer"}
  ];
  var cfg = null;
  var $ = function(id){ return document.getElementById(id); };

  function num(n){
    return new Intl.NumberFormat("en-US", {minimumFractionDigits:2, maximumFractionDigits:2}).format(n);
  }
  function pct(x){ var s = (x*100).toFixed(1); return (s.slice(-2)===".0" ? s.slice(0,-2) : s) + "%"; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  function country(code){
    if (!cfg) return null;
    for (var i=0;i<cfg.countries.length;i++) if (cfg.countries[i].code===code) return cfg.countries[i];
    return null;
  }
  function fxFor(cur){
    if (!cfg) return null;
    for (var i=0;i<cfg.fx_rates.length;i++) if (cfg.fx_rates[i].to===cur) return cfg.fx_rates[i];
    return null;
  }
  function method(){
    var el = document.querySelector('input[name="method"]:checked');
    return el ? el.value : "card";
  }
  function setMethod(m){
    var el = document.querySelector('input[name="method"][value="' + m + '"]');
    if (el) el.checked = true;
  }
  function fillCurrencies(keep){
    var c = country($("customer").value), local = c && c.currency;
    var sel = $("currency"), prev = keep || sel.value;
    sel.innerHTML = "";
    ["USD", local].forEach(function(x){ if(!x) return; var o=document.createElement("option"); o.value=x; o.textContent=x; sel.appendChild(o); });
    sel.value = (prev===local || prev==="USD") ? prev : "USD";
  }
  function body(){
    return {
      original_amount: parseFloat($("amount").value),
      original_currency: $("currency").value,
      customer_country: $("customer").value,
      merchant_country: $("merchant").value.trim().toUpperCase(),
      payment_method: method()
    };
  }

  // Everything that follows the form without calling the API.
  function sync(){
    var b = body(), c = country(b.customer_country);
    var local = c ? c.currency : "";
    var m = b.merchant_country || "??";
    var domestic = m === b.customer_country;
    $("path-kind").textContent = domestic ? "domestic" : "cross-border";
    $("route-tag").textContent = m + " → " + b.customer_country + " · " +
      (b.original_currency === local ? local + ", no FX" : b.original_currency + " → " + local);
    $("curl-text").textContent = "curl -X POST " + location.origin + "/api/v1/calculate \\\\\\n  -H 'Content-Type: application/json' \\\\\\n  -d '" + JSON.stringify(b) + "'";
    var chips = $("presets").children;
    for (var i=0;i<chips.length;i++){
      var p = PRESETS[i];
      var on = p.amount===b.original_amount && p.currency===b.original_currency && p.customer===b.customer_country && p.merchant===b.merchant_country && p.method===b.payment_method;
      chips[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    renderSources(b);
  }

  function renderSources(b){
    var c = country(b.customer_country);
    if (!c) return;
    var fx = fxFor(c.currency), t = c.tax_rule, html = "";
    if (fx) html += "<dt>FX</dt><dd>USD → " + esc(fx.to) + " mid-market " + esc(fx.mid_market_rate) + " + " + pct(fx.spread_pct) + " spread, dated " + esc(String(fx.updated_at).slice(0,10)) + "</dd>";
    html += "<dt>Tax</dt><dd>" + esc(t.name) + " " + pct(c.tax_withholding_pct) + ". " + esc(t.basis) + ".";
    if (t.source) html += " Source: " + esc(t.source) + ".";
    html += t.checked_on ? ' <span class="ok">Checked ' + esc(t.checked_on) + ".</span>" : ' <span class="warn">Not yet checked against a source.</span>';
    html += "</dd>";
    var pm = c.payment_methods[b.payment_method];
    if (pm) html += "<dt>Fees</dt><dd>" + esc(METHOD_NAMES[b.payment_method]) + " " + pct(pm.percentage_fee) + " + " + esc(pm.flat_fee_usd) + " USD flat; cross-border " + pct(c.cross_border_fee_pct) + "</dd>";
    $("sources-list").innerHTML = html;
  }

  function head(sub){
    var b = body();
    return '<div class="r-head"><div class="r-title">CUSTOMER RECEIPT</div>' +
      '<div class="r-route">' + esc((b.merchant_country || "??") + " → " + b.customer_country) + '</div>' +
      '<div class="r-meta">' + esc(sub) + '</div></div>';
  }
  function stamp(){
    var d = new Date();
    return d.toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"}) + " " + d.toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit"});
  }
  function print(html){
    var r = $("result");
    r.classList.remove("printing"); void r.offsetWidth; r.classList.add("printing");
    r.innerHTML = html;
  }

  function showError(data, status, retryAfter){
    var html = head("HTTP " + status + " · " + stamp()) + '<hr class="r-rule"><div class="r-err">';
    if (status === 429) {
      html += "<h3>SLOW DOWN</h3><p>The public demo allows a limited number of calculations a minute per visitor." +
        (retryAfter ? " Try again in " + esc(retryAfter) + " s." : " Try again shortly.") + "</p>";
      if (data && data.message) html += '<p class="r-meta">' + esc(data.message) + "</p>";
    } else {
      html += "<h3>NOT CALCULATED</h3><p>" + esc(data && data.error ? data.error : "Request failed") + " (HTTP " + status + ")</p>";
      if (data && data.details) {
        html += "<ul>" + data.details.map(function(d){ return "<li><code>" + esc(d.field) + "</code>" + esc(d.message) + "</li>"; }).join("") + "</ul>";
      } else if (data && data.message) {
        html += "<p>" + esc(data.message) + "</p>";
      }
    }
    print(html + "</div>");
  }

  function feeLabel(f){
    if (f.name !== "tax_withholding") return (FEES[f.name] && FEES[f.name].label) || f.name;
    var c = country(body().customer_country), name = c ? c.tax_rule.name : "Tax";
    return name.indexOf("%") >= 0 ? name : name + " (" + pct(f.rate) + ")";
  }

  // The second, muted line of each receipt item: the rule that produced it.
  function ruleLine(f, r){
    var d = String(f.description), dash = d.indexOf(" — "), on = d.indexOf(" on ");
    if (f.name === "fx_conversion_cost" && r.fx_rate) {
      var fx = fxFor(r.final_currency);
      return pct(f.rate) + " spread: " + (fx ? fx.mid_market_rate + " → " : "") + r.fx_rate + " per " + r.original_currency;
    }
    if (f.name === "payment_processing_fee") {
      var c = country(body().customer_country);
      var pm = c && c.payment_methods[body().payment_method];
      if (pm) return pct(pm.percentage_fee) + (pm.flat_fee_usd ? " + " + pm.flat_fee_usd.toFixed(2) + " USD flat" : ", no flat fee") + " · " + METHOD_NAMES[body().payment_method].toLowerCase();
    }
    if (f.name === "cross_border_fee" && dash > 0) return pct(f.rate) + " · " + d.slice(dash + 3);
    if (f.name === "tax_withholding" && on > 0) return pct(f.rate) + " " + d.slice(on + 1).replace("transaction", "payment");
    return d;
  }

  function render(r){
    var cur = r.final_currency;
    var html = head(METHOD_NAMES[body().payment_method].toUpperCase() + " · " + stamp());
    html += '<hr class="r-rule"><table class="r-lines"><caption class="sr">Price and fee lines</caption>' +
      '<thead><tr><th scope="col">Item</th><th scope="col" class="num">' + esc(cur) + '</th></tr></thead><tbody>';
    html += '<tr><td>' + (r.fx_rate ? 'Price at mid-market' : 'Price') + '<small>' + esc(num(r.original_amount) + " " + r.original_currency) +
      (r.fx_rate ? " × " + esc(fxFor(cur) ? fxFor(cur).mid_market_rate : r.fx_rate) : ", no conversion") +
      '</small></td><td class="num">' + num(r.settlement_amount) + '</td></tr>';
    r.fees.forEach(function(f){
      html += '<tr' + (f.name==="tax_withholding" ? ' class="tax"' : '') + '><td>' + esc(feeLabel(f)) + '<small>' + esc(ruleLine(f, r)) +
        '</small></td><td class="num">+' + num(f.amount) + '</td></tr>';
    });
    html += '<tr class="sub"><td>Fees and tax</td><td class="num">+' + num(r.total_fees) + '</td></tr>';
    html += '</tbody></table>';
    html += '<div class="r-total"><span class="k">TOTAL</span><span class="r-big">' + num(r.final_customer_price) + '<small>' + esc(cur) + '</small></span></div>';
    html += '<div class="r-markup"><span>Effective markup</span><span><b>+' + pct(r.total_fees_pct) + '</b> over mid-market</span></div>';

    var total = r.total_fees || 1;
    html += '<div class="bar" role="img" aria-label="How the fees split: ' + esc(r.fees.map(function(f){ return feeLabel(f) + " " + Math.round(f.amount/total*100) + "%"; }).join(", ")) + '">' +
      r.fees.map(function(f){ return '<div style="flex:' + f.amount + ' 1 0;background:' + FEES[f.name].color + '"></div>'; }).join("") + '</div>';
    html += '<ul class="legend" aria-hidden="true">' + r.fees.map(function(f){
      return '<li><i style="background:' + FEES[f.name].color + '"></i>' + esc(FEES[f.name].label) + '<b>' + Math.round(f.amount/total*100) + '%</b></li>';
    }).join("") + '</ul>';
    html += '<div class="r-foot"><div class="barcode" aria-hidden="true"></div>Illustrative rates · not a quote</div>';
    print(html);
  }

  function calculate(e){
    if (e) e.preventDefault();
    var btn = $("go"); btn.disabled = true; btn.textContent = "Calculating…";
    sync();
    var amt = parseFloat($("amount").value);
    $("amount").setAttribute("aria-invalid", isFinite(amt) && amt > 0 ? "false" : "true");
    fetch("/api/v1/calculate", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body())})
      .then(function(res){ return res.json().then(function(d){ return {ok:res.ok, status:res.status, data:d, retry:res.headers.get("Retry-After")}; }); })
      .then(function(r){ if (r.ok) render(r.data); else showError(r.data, r.status, r.retry); })
      .catch(function(){ showError({error:"Network error", message:"Could not reach the API."}, 0); })
      .then(function(){ btn.disabled = false; btn.textContent = "Calculate"; });
  }

  function applyPreset(p){
    $("amount").value = p.amount; $("customer").value = p.customer; fillCurrencies(p.currency);
    $("currency").value = p.currency; $("merchant").value = p.merchant; setMethod(p.method);
    calculate();
  }

  fetch("/api/v1/config").then(function(r){ return r.json(); }).then(function(c){
    cfg = c;
    var sel = $("customer");
    c.countries.forEach(function(k){ var o=document.createElement("option"); o.value=k.code; o.textContent=k.code + " · " + (COUNTRY_NAMES[k.code]||k.code); sel.appendChild(o); });
    sel.value = "MX";
    fillCurrencies("USD");
    var pbox = $("presets");
    PRESETS.forEach(function(p){
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip";
      b.innerHTML = "<b>" + esc(p.route) + "</b><span>" + esc(p.note) + "</span>";
      b.onclick = function(){ applyPreset(p); };
      pbox.appendChild(b);
    });
    calculate();
  }).catch(function(){
    $("sources-list").innerHTML = "<dt>Error</dt><dd>Could not load <code>/api/v1/config</code>.</dd>";
  });

  $("form").addEventListener("submit", calculate);
  $("form").addEventListener("change", function(e){ if (e.target.id === "customer") fillCurrencies(); sync(); });
  $("form").addEventListener("input", sync);
  $("copy").addEventListener("click", function(){
    navigator.clipboard && navigator.clipboard.writeText($("curl-text").textContent).then(function(){ $("copy").textContent = "Copied"; setTimeout(function(){ $("copy").textContent = "Copy"; }, 1500); });
  });
})();
</script>
</body>
</html>
`;
