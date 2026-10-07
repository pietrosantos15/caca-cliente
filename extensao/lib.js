/* Funções puras: normalização de telefone, classificação de site, pontuação, mensagem, CSV. Usado pelo painel e pelos testes. */
(function (root) {
  const digits = s => String(s || "").replace(/\D/g, "");

  function normPhone(raw) {
    let d = digits(raw);
    if (!d) return "";
    d = d.replace(/^0+/, "");
    if (d.length === 10 || d.length === 11) d = "55" + d;
    if (!/^55\d{10,11}$/.test(d)) return "";
    return d;
  }
  const isMobile = n => /^55\d{2}9\d{8}$/.test(n || "");

  function fmtPhone(n) {
    if (!n) return "";
    const d = n.replace(/^55/, "");
    return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }

  const SOCIAL_HOSTS = ["facebook.com","fb.com","fb.me","instagram.com","wa.me","whatsapp.com","tiktok.com","youtube.com","youtu.be","twitter.com","x.com","linkedin.com","ifood.com.br","booking.com","tripadvisor.com","tripadvisor.com.br","olx.com.br","mercadolivre.com.br"];
  const WEAK = /(linktr\.ee|bio\.link|beacons\.ai|taplink|negocio\.site|business\.site|wixsite\.com|sites\.google\.com|canva\.site|carrd\.co|lojaintegrada|yolasite|webnode|wordpress\.com|blogspot|site123|hotmart|kwai|linkin\.bio)/;

  function siteKind(url) {
    if (!url) return "none";
    let host = "";
    try { host = new URL(/^https?:/.test(url) ? url : "https://" + url).hostname.replace(/^www\./, "").toLowerCase(); } catch (e) { return "none"; }
    if (!host) return "none";
    if (/(^|\.)(google)\./.test(host) && !/sites\.google/.test(host)) return "none";
    if (WEAK.test(host)) return "weak";
    if (SOCIAL_HOSTS.some(h => host === h || host.endsWith("." + h))) return "social";
    return "own";
  }

  function score(l) {
    let s = 20;
    if (l.phone) s += 25;
    if (isMobile(l.whatsapp || l.phone)) s += 15;
    const k = l.siteKind;
    if (k === "none" || k === "social") s += 30; else if (k === "weak") s += 10; else if (k === "own") s -= 40;
    if ((l.reviews || 0) >= 5) s += 5;
    return Math.max(0, Math.min(100, s));
  }
  const tempOf = s => (s >= 70 ? "hot" : s >= 45 ? "warm" : "cold");

  const IG_RESERVED = /^(p|reel|reels|explore|accounts|stories|direct|tv|about|developer|legal)$/;
  // aceita link do Instagram, @perfil ou perfil puro; devolve só o usuário ("" se inválido)
  function igHandle(s) {
    if (!s) return "";
    const m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(s);
    const h = m ? m[1] : String(s).trim().replace(/^@/, "").replace(/\s+/g, "");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(h) || IG_RESERVED.test(h)) return "";
    return h.replace(/\.$/, "");
  }

  function finalize(raw, ctx) {
    const phone = normPhone(raw.phone);
    const site = raw.site || "";
    const kind = siteKind(site);
    const l = {
      id: raw.id, name: raw.name, cat: raw.cat || "", addr: raw.addr || "", phone,
      whatsapp: isMobile(phone) ? phone : "", site, siteKind: kind,
      social: kind === "social" ? site : "", insta: igHandle(raw.insta || (kind === "social" ? site : "")), rating: raw.rating || 0, reviews: raw.reviews || 0,
      url: raw.url || "", lat: raw.lat || null, lon: raw.lon || null,
      nicho: ctx.nicho, m: ctx.m || "", city: ctx.city, t: Date.now(), stage: "novo", notes: ""
    };
    l.score = score(l); l.temp = tempOf(l.score);
    return l;
  }

  function message(l, cfg, NICHE_TPL, DEFAULT_TPL) {
    const tpl = (cfg.customTpl && cfg.customTpl.trim()) || NICHE_TPL[l.m] || DEFAULT_TPL;
    return tpl.replace(/\{eu\}/g, cfg.me || "Pietro").replace(/\{cidade\}/g, l.city || cfg.city || "sua cidade")
      .replace(/\{nome\}/g, l.name).replace(/\{nicho\}/g, (l.nicho || "").toLowerCase());
  }
  const waLink = (l, text) => l.whatsapp ? `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(text)}` : "";

  function toCSV(rows) {
    const cols = ["Nome", "Temperatura", "Score", "Etapa", "Nicho", "Cidade", "Telefone", "WhatsApp", "Site", "Endereço", "Nota", "Avaliações", "Instagram", "Google Maps", "Anotações"];
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const T = { hot: "Quente", warm: "Morno", cold: "Frio" };
    const lines = rows.map(l => [l.name, T[l.temp], l.score, l.stage, l.nicho, l.city, fmtPhone(l.phone), l.whatsapp ? "+" + l.whatsapp : "", l.site, l.addr, l.rating || "", l.reviews || "", l.insta ? "@" + l.insta : "", l.url, l.notes].map(q).join(";"));
    return "﻿" + [cols.map(q).join(";"), ...lines].join("\r\n");
  }

  const api = { igHandle, digits, normPhone, isMobile, fmtPhone, siteKind, score, tempOf, finalize, message, waLink, toCSV };
  if (typeof module !== "undefined") module.exports = api; else root.GL = api;
})(typeof self !== "undefined" ? self : this);
