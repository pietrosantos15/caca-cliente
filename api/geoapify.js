// Fonte alternativa ao Overpass: Geoapify Places (dados do OpenStreetMap, servidor estável, chave gratuita).
// Só funciona com a variável GEOAPIFY_KEY configurada na Vercel. Devolve no mesmo formato do Overpass ({elements}).
const KEY = process.env.GEOAPIFY_KEY;
const BASE = process.env.GEOAPIFY_BASE || "https://api.geoapify.com";
const LIMIT = 200;   // por categoria: 1 crédito + 1 a cada 20 lugares (plano grátis: 3000 créditos/dia)
// etiqueta OSM do app -> categorias do Geoapify. [categoria, estrita?]: estrita = categoria larga, filtra de novo pelas etiquetas OSM
const MAP = {
  "amenity=restaurant": [["catering.restaurant"]],
  "amenity=fast_food": [["catering.fast_food"]],
  "amenity=cafe": [["catering.cafe"]],
  "amenity=bar|pub": [["catering.bar"], ["catering.pub"]],
  "shop=bakery": [["commercial.food_and_drink.bakery"]],
  "shop=hairdresser|beauty": [["service.beauty"]],
  "leisure=fitness_centre": [["sport.fitness"], ["activity.sport_club", 1]],
  "amenity=clinic|doctors": [["healthcare.clinic_or_praxis"]],
  "amenity=dentist": [["healthcare.dentist"]],
  "amenity=veterinary": [["pet.veterinary"]],
  "shop=pet": [["pet.shop"]],
  "shop=car_repair": [["service.vehicle.repair"], ["commercial.vehicle", 1]],
  "shop=car_parts": [["commercial.vehicle", 1]],
  "office=estate_agent": [["office.estate_agent"]],
  "office=lawyer": [["office.lawyer"]],
  "sport=pilates": [["sport.fitness", 1]],
  "craft=photovoltaic_installer": [["service.electrician", 1]],
  "office=energy_supplier": [["office.energy_supplier"]],
  "craft=carpenter|joiner": [["service.carpenter"]],
  "office=accountant": [["office.accountant"]],
  "shop=clothes": [["commercial.clothing"]],
  "shop=florist": [["commercial.florist"]],
  "amenity=pharmacy": [["healthcare.pharmacy"]],
  "tourism=hotel|guest_house|hostel": [["accommodation.hotel"], ["accommodation.guest_house"], ["accommodation.hostel"]],
  "amenity=driving_school": [["education.driving_school"]],
  "amenity=language_school": [["education.language_school"]],
  "craft=electrician|plumber|carpenter|painter|hvac": [["service.electrician"], ["service.carpenter"]],
  "shop=tattoo": [["service.beauty.tattoo"]],
  "shop=optician": [["commercial.health_and_beauty.optician"]],
  "shop=supermarket|convenience": [["commercial.supermarket"], ["commercial.convenience"]],
  "shop=hardware|doityourself": [["commercial.houseware_and_hardware", 1]],
  "shop=laundry": [["service.cleaning.laundry"], ["service.cleaning.dry_cleaning"]],
  "amenity=car_wash": [["service.vehicle.car_wash"]],
};
const TYPES = {n: "node", w: "way", r: "relation", node: "node", way: "way", relation: "relation"};
const okTag = (raw, f) => f.some(c => { const [k, v] = c.split("="); return v.split("|").includes(raw[k]); });

function toElement(feat, strict, f){
  const p = feat.properties || {}, raw = (p.datasource && p.datasource.raw) || {};
  if(strict && !okTag(raw, f)) return null;
  const tags = {};
  Object.keys(raw).forEach(k => { if(k !== "osm_id" && k !== "osm_type" && typeof raw[k] === "string") tags[k] = raw[k]; });
  tags.name = p.name || raw.name; if(!tags.name) return null;
  tags["addr:street"] = tags["addr:street"] || p.street; tags["addr:housenumber"] = tags["addr:housenumber"] || p.housenumber;
  tags["addr:suburb"] = tags["addr:suburb"] || p.suburb; tags["addr:city"] = tags["addr:city"] || p.city;
  const c = p.contact || {};
  tags.phone = tags.phone || c.phone; tags.email = tags.email || c.email;
  tags.website = tags.website || p.website || c.website; tags.opening_hours = tags.opening_hours || p.opening_hours;
  const type = TYPES[raw.osm_type], id = raw.osm_id;
  const coords = feat.geometry && feat.geometry.coordinates;
  const lat = p.lat ?? (coords && coords[1]), lon = p.lon ?? (coords && coords[0]);
  if(lat == null || lon == null) return null;
  return type && id ? {type, id: +id || id, lat, lon, tags} : {type: "ext", id: p.place_id || (lat + "," + lon), lat, lon, tags};
}

module.exports = async (req, res) => {
  if(!KEY){ res.status(501).json({error: "GEOAPIFY_KEY não configurada"}); return; }
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const f = Array.isArray(b.f) ? b.f.map(String) : [], lat = +b.lat, lon = +b.lon, radius = Math.min(Math.max(+b.radius || 5000, 500), 50000);
  if(!f.length || !isFinite(lat) || !isFinite(lon)){ res.status(400).json({error: "parâmetros inválidos"}); return; }
  const cats = new Map();   // categoria -> estrita
  f.forEach(c => (MAP[c] || []).forEach(([cat, strict]) => cats.set(cat, !!(cats.get(cat) || strict))));
  if(!cats.size){ res.status(200).json({elements: [], unsupported: true}); return; }
  const jobs = [...cats].map(async ([cat, strict]) => {
    const url = BASE + "/v2/places?categories=" + encodeURIComponent(cat) + "&filter=circle:" + lon + "," + lat + "," + radius + "&bias=proximity:" + lon + "," + lat + "&limit=" + LIMIT + "&lang=pt&apiKey=" + encodeURIComponent(KEY);
    const r = await fetch(url, {headers: {Accept: "application/json"}, signal: AbortSignal.timeout(15000)});
    if(r.status === 400) return [];                       // categoria que o Geoapify não conhece: ignora só ela
    if(!r.ok) throw new Error("Geoapify respondeu " + r.status);
    const j = await r.json();
    return (j.features || []).map(ft => toElement(ft, strict, f)).filter(Boolean);
  });
  const out = await Promise.allSettled(jobs);
  const ok = out.filter(o => o.status === "fulfilled");
  if(!ok.length){ res.status(502).json({error: String(out[0] && out[0].reason && out[0].reason.message || "falha")}); return; }
  const seen = new Set(), elements = [];
  ok.forEach(o => o.value.forEach(e => { const k = e.type + e.id; if(!seen.has(k)){ seen.add(k); elements.push(e); } }));
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.status(200).json({elements});
};
