/* Roda dentro do Google Maps. Lê a lista de resultados que você abriu (e, no modo detalhado, cada ficha). Não envia nada para fora do navegador. */
(() => {
  if (window.__garimpoLoaded) return;
  window.__garimpoLoaded = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  let stopFlag = false, running = false;

  const feedEl = () => document.querySelector('div[role="feed"]');
  const linksIn = root => [...root.querySelectorAll('a[href*="/maps/place/"]')];
  const txt = el => (el ? (el.innerText || el.textContent || "").trim() : "");

  function placeId(href) {
    const m = /!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i.exec(href || "") || /!19s([^?&]+)/.exec(href || "");
    if (m) return m[1];
    const n = /\/maps\/place\/([^/]+)/.exec(href || "");
    return n ? decodeURIComponent(n[1]) : href;
  }
  function coords(href) {
    const m = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(href || "") || /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(href || "");
    return m ? { lat: +m[1], lon: +m[2] } : {};
  }
  const toNum = s => parseFloat(String(s || "").replace(/\./g, "").replace(",", ".")) || 0;

  /* ---------- leitura da lista ---------- */
  function cardOf(a) { return a.closest(".Nv2PK") || a.closest('div[role="article"]') || a.parentElement; }

  function parseCard(a) {
    const card = cardOf(a);
    const text = txt(card);
    const href = a.href;
    const out = { id: placeId(href), name: a.getAttribute("aria-label") || txt(card.querySelector(".qBF1Pd")) || text.split("\n")[0], url: href, ...coords(href) };
    const rImg = card.querySelector('span[role="img"][aria-label]');
    if (rImg) {
      const lab = rImg.getAttribute("aria-label");
      const r = /([\d.,]+)\s*(estrelas?|stars?)/i.exec(lab); if (r) out.rating = toNum(r[1]);
      const n = /([\d.]+)\s*(coment|avalia|review)/i.exec(lab); if (n) out.reviews = parseInt(n[1].replace(/\./g, ""), 10);
    }
    if (!out.reviews) { const n = /\((\d[\d.]*)\)/.exec(text); if (n) out.reviews = parseInt(n[1].replace(/\./g, ""), 10); }
    const ph = /(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/.exec(text); if (ph) out.phone = ph[1];
    // categoria · endereço costumam estar numa linha "Categoria · Endereço"
    const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
    const info = lines.find(l => l.includes("·") && !/^\d/.test(l) && !/(Aberto|Fechado|Fecha|Abre|Open|Closed)/i.test(l.split("·")[0]));
    if (info) { const p = info.split("·").map(s => s.trim()); out.cat = p[0]; out.addr = p.slice(1).join(", "); }
    const w = card.querySelector('a[data-value="Website"], a[data-value="Site"]');
    if (w && w.href && !/google\./.test(w.href)) out.site = w.href;
    else {
      const ext = linksIn(card).length ? [...card.querySelectorAll("a[href]")].find(x => /^https?:/.test(x.href) && !/google\.[a-z.]+\/(maps|search|url)/.test(x.href) && !/\/maps\/place\//.test(x.href)) : null;
      if (ext) out.site = ext.href;
    }
    return out;
  }

  /* ---------- leitura da ficha (painel de detalhes) ---------- */
  function readDetail(basic) {
    const d = { ...basic };
    const main = document.querySelector('div[role="main"]') || document;
    const h1 = document.querySelector("h1.DUwDvf, h1");
    if (h1 && txt(h1)) d.name = txt(h1);
    const phBtn = main.querySelector('button[data-item-id^="phone"], a[data-item-id^="phone"]');
    if (phBtn) {
      const id = phBtn.getAttribute("data-item-id") || "";
      const m = /tel:([\d+]+)/.exec(id);
      d.phone = m ? m[1] : (/[\d()\s-]{8,}/.exec(phBtn.getAttribute("aria-label") || txt(phBtn)) || [d.phone])[0];
    }
    const web = main.querySelector('a[data-item-id="authority"]');
    d.site = web && web.href ? web.href : "";
    const ad = main.querySelector('button[data-item-id="address"]');
    if (ad) d.addr = (ad.getAttribute("aria-label") || txt(ad)).replace(/^(Endereço|Address):?\s*/i, "").trim();
    const cat = main.querySelector("button.DkEaL");
    if (cat) d.cat = txt(cat);
    d.detailed = true;
    return d;
  }

  async function waitFor(fn, ms = 6000, step = 150) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(step); }
    return null;
  }

  async function backToList() {
    const back = document.querySelector('button[aria-label="Voltar"], button[aria-label="Back"], button[aria-label*="Fechar"], button[aria-label="Close"]');
    if (back) back.click(); else history.back();
    await waitFor(feedEl, 5000);
    await sleep(rnd(500, 900));
  }

  /* ---------- rolagem para carregar mais resultados ---------- */
  function endOfList() {
    const f = feedEl(); if (!f) return true;
    return !!document.querySelector("span.HlvSq") || /você chegou ao final|end of the list|chegou ao fim/i.test(txt(f).slice(-400));
  }
  async function loadMore(max, report) {
    let stable = 0, last = -1;
    while (!stopFlag) {
      const f = feedEl(); if (!f) break;
      const n = linksIn(f).length;
      report("scroll", n);
      if (n >= max || endOfList()) break;
      if (n === last) { if (++stable >= 4) break; } else stable = 0;
      last = n;
      f.scrollTo({ top: f.scrollHeight, behavior: "instant" in f ? "instant" : "auto" });
      await sleep(rnd(1100, 2000));
    }
  }

  /* ---------- execução ---------- */
  async function scrape(opts) {
    const max = opts.max || 60, detailed = opts.mode !== "fast";
    const send = m => { try { chrome.runtime.sendMessage({ from: "garimpo", ...m }); } catch (e) { /* painel fechado */ } };
    const report = (phase, n) => send({ t: "progress", phase, n });
    stopFlag = false; running = true;
    try {
      let f = feedEl();
      if (!f) {
        // ficha única (pesquisa com um só resultado)
        if (document.querySelector('h1.DUwDvf')) {
          const d = readDetail({ id: placeId(location.href), url: location.href, ...coords(location.href) });
          send({ t: "lead", lead: d }); send({ t: "done", total: 1 }); return;
        }
        send({ t: "error", msg: "Não encontrei a lista de resultados. Faça uma pesquisa no Google Maps (ex.: “dentista em Sorocaba”) e tente de novo." });
        return;
      }
      await loadMore(max, report);
      const hrefs = []; const seen = new Set();
      for (const a of linksIn(feedEl())) { const id = placeId(a.href); if (!seen.has(id)) { seen.add(id); hrefs.push(a.href); } if (hrefs.length >= max) break; }
      // coleta rápida da lista (já guarda o básico)
      const basics = new Map();
      for (const a of linksIn(feedEl())) { const id = placeId(a.href); if (!basics.has(id)) basics.set(id, parseCard(a)); }
      let i = 0;
      for (const href of hrefs) {
        if (stopFlag) break;
        const id = placeId(href);
        let lead = basics.get(id) || { id, url: href };
        if (detailed) {
          const a = linksIn(feedEl() || document).find(x => placeId(x.href) === id);
          if (a) {
            a.scrollIntoView({ block: "center" }); await sleep(rnd(200, 500));
            a.click();
            const ok = await waitFor(() => document.querySelector("h1.DUwDvf") && /\/maps\/place\//.test(location.href), 7000);
            if (ok) { await sleep(rnd(700, 1300)); lead = readDetail(lead); await backToList(); }
          }
        }
        i++; send({ t: "lead", lead }); send({ t: "progress", phase: "read", n: i, total: hrefs.length });
        await sleep(rnd(250, 700));
      }
      send({ t: "done", total: i, stopped: stopFlag });
    } catch (e) {
      send({ t: "error", msg: "Erro durante a coleta: " + (e && e.message || e) });
    } finally { running = false; }
  }

  function diagnose() {
    const f = feedEl();
    const links = f ? linksIn(f) : [];
    const sample = links[0] ? parseCard(links[0]) : null;
    return { url: location.href, feed: !!f, cards: links.length, detail: !!document.querySelector("h1.DUwDvf"), sample, running };
  }

  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (!msg || msg.to !== "garimpo-content") return;
    if (msg.t === "ping") { reply({ ok: true, ...diagnose() }); return; }
    if (msg.t === "scrape") { if (running) { reply({ ok: false, busy: true }); return; } reply({ ok: true }); scrape(msg); return; }
    if (msg.t === "stop") { stopFlag = true; reply({ ok: true }); return; }
  });
})();
