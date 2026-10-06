// Fonte complementar: Google Places (Text Search). Só funciona se a variável GOOGLE_PLACES_API_KEY estiver configurada no Vercel.
const FIELDS = ["places.id","places.displayName","places.location","places.formattedAddress","places.nationalPhoneNumber","places.websiteUri","places.googleMapsUri","nextPageToken"].join(",");

module.exports = async (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if(!key){ res.status(501).json({error: "GOOGLE_PLACES_API_KEY não configurada"}); return; }
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const queries = (Array.isArray(b.queries) ? b.queries : []).slice(0, 2).map(String);
  const lat = +b.lat, lon = +b.lon, radius = Math.min(Math.max(+b.radius || 5000, 500), 50000);
  if(!queries.length || !isFinite(lat) || !isFinite(lon)){ res.status(400).json({error: "parâmetros inválidos"}); return; }
  const seen = new Map();
  try{
    for(const textQuery of queries){
      let pageToken;
      for(let page = 0; page < 3; page++){
        const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {"Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS},
          body: JSON.stringify({textQuery, languageCode: "pt-BR", regionCode: "BR", pageSize: 20, ...(pageToken ? {pageToken} : {}),
            locationBias: {circle: {center: {latitude: lat, longitude: lon}, radius}}}),
        });
        if(!r.ok){ const t = await r.text(); throw new Error("Places " + r.status + ": " + t.slice(0, 200)); }
        const j = await r.json();
        (j.places || []).forEach(p => seen.set(p.id, {
          id: p.id, name: p.displayName && p.displayName.text, lat: p.location && p.location.latitude, lon: p.location && p.location.longitude,
          addr: p.formattedAddress, phone: p.nationalPhoneNumber, site: p.websiteUri, maps: p.googleMapsUri,
        }));
        pageToken = j.nextPageToken; if(!pageToken) break;
      }
    }
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    res.status(200).json({places: [...seen.values()].filter(p => p.name && p.lat != null)});
  }catch(e){ res.status(502).json({error: String(e.message || e)}); }
};
