import {
  calculateBoundingBox,
  normalizeOsmDataToCityNetwork,
  formatPreviewData,
  parseOsmXmlToElements,
} from '../src/services/osmImportService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.method === 'POST' ? req.body : req.query;
  const cityName = String(params.cityName || 'Selected City');
  const lat = parseFloat(params.lat);
  const lng = parseFloat(params.lng);
  const radiusMeters = parseInt(params.radiusMeters, 10) || 1200;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Invalid or missing lat/lng coordinates.' });
  }

  const bbox = calculateBoundingBox(lat, lng, radiusMeters);

  console.log(`[CityTwin Server] Fetching OSM network for ${cityName} at (${lat}, ${lng}), radius: ${radiusMeters}m`);
  const t0 = Date.now();

  try {
    // Strategy 1: Official OpenStreetMap API 0.6 (fast, authoritative, global)
    const osmUrl = `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
    const osmController = new AbortController();
    const osmTimer = setTimeout(() => osmController.abort(), 12000);

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'CityTwin-UrbanPlanningSimulator/1.0 (https://github.com/rithwikhebbar-cell/CityTwin)',
        Accept: 'application/xml, text/xml',
      },
      signal: osmController.signal,
    });
    clearTimeout(osmTimer);

    if (osmRes.ok) {
      const xml = await osmRes.text();
      const elements = parseOsmXmlToElements(xml);
      if (elements.length > 0) {
        const normalized = normalizeOsmDataToCityNetwork(
          { elements },
          cityName,
          { lat, lng },
          radiusMeters
        );
        const preview = formatPreviewData(normalized);
        console.log(
          `[CityTwin Server] Successfully extracted OSM network via official API in ${Date.now() - t0}ms: ${preview.nodeCount} junctions, ${preview.segmentCount} roads.`
        );
        return res.status(200).json({ success: true, preview });
      }
    }
  } catch (err: any) {
    console.warn(`[CityTwin Server] Official OSM API fetch notice:`, err?.message || err);
  }

  // Strategy 2: Overpass API fallback
  const overpassMirrors = [
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ];

  const query = `[out:json][timeout:25];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}););(._;>;);out body;`;

  for (const ep of overpassMirrors) {
    try {
      const c = new AbortController();
      const timer = setTimeout(() => c.abort(), 15000);
      const mirrorRes = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'CityTwin-UrbanPlanningSimulator/1.0',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: c.signal,
      });
      clearTimeout(timer);

      if (mirrorRes.ok) {
        const json = await mirrorRes.json();
        if (json && Array.isArray(json.elements) && json.elements.length > 0) {
          const normalized = normalizeOsmDataToCityNetwork(
            json,
            cityName,
            { lat, lng },
            radiusMeters
          );
          const preview = formatPreviewData(normalized);
          console.log(
            `[CityTwin Server] Successfully extracted OSM network via Overpass mirror (${ep}) in ${Date.now() - t0}ms: ${preview.nodeCount} junctions, ${preview.segmentCount} roads.`
          );
          return res.status(200).json({ success: true, preview });
        }
      }
    } catch (e: any) {
      console.warn(`[CityTwin Server] Overpass mirror ${ep} failed:`, e?.message || e);
    }
  }

  return res.status(502).json({
    success: false,
    error: `Unable to extract road geometry for "${cityName}". OpenStreetMap mirrors did not respond in time. Please try expanding the scoping radius or retrying.`,
  });
}
