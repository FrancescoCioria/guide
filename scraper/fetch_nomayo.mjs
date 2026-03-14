import { writeFileSync } from 'fs';

// Province to region mapping for Italy
const provinceToRegion = {
  'Milano': 'Lombardia', 'MI': 'Lombardia', 'Lecce': 'Puglia', 'LE': 'Puglia',
  'Nova Milanese': 'Lombardia', 'Casarano': 'Puglia',
  'Roma': 'Lazio', 'Torino': 'Piemonte', 'Napoli': 'Campania',
  'Firenze': 'Toscana', 'Bologna': 'Emilia-Romagna', 'Genova': 'Liguria',
  'Palermo': 'Sicilia', 'Catania': 'Sicilia', 'Bari': 'Puglia',
  'Venezia': 'Veneto', 'Verona': 'Veneto', 'Padova': 'Veneto',
  'Trieste': 'Friuli-Venezia Giulia', 'Trento': 'Trentino-Alto Adige',
  'Bolzano': 'Trentino-Alto Adige', 'Cagliari': 'Sardegna',
  'Perugia': 'Umbria', 'Ancona': 'Marche', 'Bergamo': 'Lombardia',
  'Brescia': 'Lombardia', 'Como': 'Lombardia', 'Monza': 'Lombardia',
  'Varese': 'Lombardia', 'Pavia': 'Lombardia', 'Mantova': 'Lombardia',
  'Cremona': 'Lombardia', 'Lodi': 'Lombardia', 'Sondrio': 'Lombardia',
};

function getRegion(address) {
  for (const [city, region] of Object.entries(provinceToRegion)) {
    if (address.includes(city)) return region;
  }
  // Default for Milan-area addresses
  if (address.toLowerCase().includes('milan')) return 'Lombardia';
  return 'Lombardia'; // Most nomayo restaurants are in Milan
}

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeGoogleMapsUrl(name, address) {
  const query = `${name} ${address}`.replace(/\s+/g, '+');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`;
}

// Parse restaurants from the scraped text
const restaurants5 = [
  { name: 'Aalto', address: 'Piazza Alvar Aalto, Milano', cuisine: 'Contaminazioni' },
  { name: 'Gong', address: 'Corso Concordia 8, 20129 Milano', cuisine: 'Cinese/Contaminazioni' },
  { name: 'Mu Dim Sum', address: 'Via Aminto Caretto 3, Milano', cuisine: 'Cinese' },
  { name: 'Iyo', address: 'Via Piero della Francesca 74, Milano', cuisine: 'Giapponese' },
  { name: 'Mu Fish', address: 'Via Galileo Galilei 5, Nova Milanese', cuisine: 'Giapponese/Contaminazioni' },
  { name: 'Serica', address: 'Viale Bligny 19/A, Milano', cuisine: 'Cinese' },
  { name: 'Kappou Ninomiya', address: 'Via Fra Galgario 4, Milano', cuisine: 'Giapponese' },
  { name: 'Aji', address: 'Via Piero della Francesca 17, Milano', cuisine: 'Giapponese' },
  { name: 'Dim Sum', address: 'Via Nino Bixio 29, Milano', cuisine: 'Cinese' },
  { name: 'Hekfan', address: 'Via Marco Formentini 2, Milano', cuisine: 'Cinese' },
  { name: 'Il Vizio', address: 'Via Ulrico Hoepli 6, Milano', cuisine: 'Giapponese' },
  { name: "Wicky's Wicuisine", address: 'Corso Italia 6, Milano', cuisine: 'Giapponese' },
  { name: 'Sakeya', address: 'Via Cesare da Sesto 1, Milano', cuisine: 'Giapponese' },
  { name: 'Tokuyoshi', address: 'Via San Calocero 3, Milano', cuisine: 'Italiano/Giapponese' },
];

const restaurants4 = [
  { name: 'Basara', address: 'Via Tortona 12, Milano', cuisine: 'Giapponese' },
  { name: 'Cat Su Sandro', address: 'Milano', cuisine: 'Giapponese' },
  { name: 'Mao Hot Pot', address: 'Via Giuseppe Giusti 41, Milano', cuisine: 'Cinese' },
  { name: 'Nishiki', address: 'Corso Lodi 70, Milano', cuisine: 'Giapponese' },
  { name: 'Li Sei Deli', address: 'Via Vigevano 9, Milano', cuisine: 'Coreano' },
  { name: 'Tomoyoshi Endo', address: 'Via Fabio Filzi 8, Milano', cuisine: 'Giapponese' },
  { name: 'Nagrin', address: 'Via Gustavo Fara 17, Milano', cuisine: 'Coreano' },
  { name: 'Miyabi', address: 'Corso Monforte 26, Milano', cuisine: 'Giapponese' },
  { name: 'The Roll Station', address: 'Corso di Porta Romana 94, Milano', cuisine: 'Contaminazioni' },
  { name: 'Domo', address: 'Via San Marco 40, Milano', cuisine: 'Giapponese' },
  { name: 'Antidoto', address: 'Via Ennio 6, Milano', cuisine: 'Giapponese' },
  { name: "J's Hiro", address: 'Via Vittadini 6, Milano', cuisine: 'Giapponese' },
  { name: 'Le Nove Scodelle', address: 'Viale Monza 4, Milano', cuisine: 'Cinese' },
  { name: 'Manate', address: 'Via Gaspare Rosales 1, Milano', cuisine: 'Giapponese' },
  { name: 'Kanpai', address: 'Via Melzo 12, Milano', cuisine: 'Giapponese' },
  { name: 'Sumire', address: 'Via Varese 1, Milano', cuisine: 'Giapponese' },
  { name: 'Yumi', address: 'Via G. Marconi 23, Lecce', cuisine: 'Giapponese' },
  { name: 'Zaza Ramen', address: 'Via Solferino 48, Milano', cuisine: 'Giapponese' },
  { name: 'Hazama', address: 'Via Savona 41, Milano', cuisine: 'Giapponese' },
  { name: 'Bentoteca', address: 'Via San Calocero 3, Milano', cuisine: 'Giapponese' },
  { name: 'Neo Kisho', address: 'Via Manfredo Camperio 15, Milano', cuisine: 'Giapponese' },
  { name: 'Neko', address: 'Via Giuseppe Mazzini 20, Milano', cuisine: 'Giapponese' },
  { name: 'La Ravioleria Sarpi', address: 'Via Paolo Sarpi 27, Milano', cuisine: 'Cinese' },
  { name: 'Vietnam Mon Amour', address: 'Via Pestalozza 7, Milano', cuisine: 'Vietnamita' },
  { name: 'Omakase', address: 'Corso Cristoforo Colombo 1, Milano', cuisine: 'Giapponese' },
  { name: 'Maison Thai', address: 'Via Dogliotti 1, Casarano', cuisine: 'Tailandese' },
  { name: 'Sol Levante', address: 'Via Lambro 11, Milano', cuisine: 'Giapponese' },
  { name: 'Waby', address: 'Via Carlo de Cristoforis 2, Milano', cuisine: 'Giapponese' },
];

async function geocode(address, retries = 3) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Italy')}&limit=1`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NoMayoScraper/1.0 (guide project)' }
      });
      if (res.status === 429 || res.status >= 500) {
        console.log(`  Rate limited (${res.status}), waiting 3s...`);
        await sleep(3000);
        continue;
      }
      const text = await res.text();
      if (text.startsWith('<')) {
        console.log(`  Got XML response, retrying in 3s...`);
        await sleep(3000);
        continue;
      }
      const data = JSON.parse(text);
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch (e) {
      console.log(`  Error: ${e.message}, retrying in 3s...`);
      await sleep(3000);
    }
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processRestaurants(list, rating) {
  const results = [];
  for (const r of list) {
    const tipologie = r.cuisine.split('/').map(t => t.trim());
    const region = getRegion(r.address);
    const url = makeGoogleMapsUrl(r.name, r.address);

    console.log(`Geocoding: ${r.name} - ${r.address}`);
    const coords = await geocode(r.address);
    await sleep(1500); // Rate limit: 1 req/sec with margin

    results.push({
      name: r.name,
      slug: slugify(r.name),
      url,
      address: r.address,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      categories: [rating],
      regions: [region],
      tipologie,
      guide: 'nomayo'
    });
  }
  return results;
}

console.log('Processing 5 Bacchette restaurants...');
const results5 = await processRestaurants(restaurants5, '5 Bacchette');

console.log('\nProcessing 4 Bacchette restaurants...');
const results4 = await processRestaurants(restaurants4, '4 Bacchette');

const allResults = [...results5, ...results4];

// Report any missing geocodes
const missing = allResults.filter(r => r.lat === null);
if (missing.length > 0) {
  console.log('\nMissing geocodes:');
  missing.forEach(r => console.log(`  - ${r.name}: ${r.address}`));
}

writeFileSync('/Users/francesco/Programmazione/guide/data/nomayo.json', JSON.stringify(allResults, null, 2));
console.log(`\nDone! Saved ${allResults.length} restaurants to data/nomayo.json`);
