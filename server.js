const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database File Paths
const T_DRIVE_DIR = 't:\\10.30 A.M. Production Meeting\\AI WORKAWAY BTA\\data';
const LOCAL_DATA_DIR = path.join(__dirname, 'data');

let DATA_DIR = LOCAL_DATA_DIR;
// Check if T drive is available and writable
try {
  if (fs.existsSync('t:\\')) {
    if (!fs.existsSync(T_DRIVE_DIR)) {
      fs.mkdirSync(T_DRIVE_DIR, { recursive: true });
    }
    DATA_DIR = T_DRIVE_DIR;
    console.log(`Database is set to T: Drive: ${DATA_DIR}`);
  } else {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    console.log(`T: Drive not found. Falling back to local data directory: ${DATA_DIR}`);
  }
} catch (e) {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  console.log(`Error checking T: Drive, falling back to local: ${e.message}`);
}

const DB_FILE = path.join(DATA_DIR, 'workaway.json');
const BACKUP_FILE = path.join(DATA_DIR, 'workaway.backup.json');

// Preset Data
const TYRE_CODES = [
  'K33M1', 'K16V5', 'K27T4', 'K47J8', 'K16D4', 'K26V1', 'K83T4', 'K25N7',
  'K95M6', 'K11M2', 'K269A', 'K94F2', 'K36F3', 'K12J5', 'K771H', 'N11F3',
  'T1400', 'B1026', 'B2201', 'B1182', 'B252G', 'B61C7', 'G1211', 'N1717',
  'N1692', 'N1597', 'N1508', 'N1778', 'N1139', 'N2139', 'N1128', 'F1145',
  'B1578', 'B1443', 'B1779', 'B56N2', 'B15T4', 'F1252', 'F4111', 'B1423',
  'F6857', 'F7894', 'K844A', 'B337X', 'K633R', 'F3146'
];

const AREAS = ['QUAD', 'Tuber', '4roll2', '4roll1', 'BTB-WBR', 'Sapphire', 'BTB-Aero'];
const STORAGE_LOCATIONS = ['QUAD', 'TUBER', 'WA1', 'WA 2', 'WA3'];
const CATEGORIES = ['new', '7day', '7-14day', 'over14day', 'disposition'];

// Helper functions for DB operations
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading database, attempting to load backup...', error);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const backupData = fs.readFileSync(BACKUP_FILE, 'utf8');
        return JSON.parse(backupData || '[]');
      }
    } catch (backupError) {
      console.error('Failed to read backup file:', backupError);
    }
    return [];
  }
}

function writeDatabase(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    // Write primary
    fs.writeFileSync(DB_FILE, jsonString, 'utf8');
    // Write backup for safety
    fs.writeFileSync(BACKUP_FILE, jsonString, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
}

// REST API Endpoints

// 1. Get Preset Metadata (Tyre Codes, Areas, Storage Locations, Categories)
app.get('/api/metadata', (req, res) => {
  res.json({
    tyre_codes: TYRE_CODES,
    areas: AREAS,
    storage_locations: STORAGE_LOCATIONS,
    categories: CATEGORIES,
    db_path: DB_FILE
  });
});

// 2. Get All Records (with optional filtering)
app.get('/api/records', (req, res) => {
  let records = readDatabase();
  const { start_date, end_date, area, storage_location, code, category } = req.query;

  // Filter records
  if (start_date) records = records.filter(r => r.date >= start_date);
  if (end_date) records = records.filter(r => r.date <= end_date);
  if (area) records = records.filter(r => r.area === area);
  if (storage_location) records = records.filter(r => r.storage_location === storage_location);
  if (code) records = records.filter(r => r.code === code);
  if (category) records = records.filter(r => r.category === category);

  // Sort by date descending, then created_at descending
  records.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.created_at - a.created_at;
  });

  res.json(records);
});

// 3. Add a New Record
app.post('/api/records', (req, res) => {
  const { date, area, storage_location, code, category, qty_in, qty_out, notes } = req.body;

  // Validations
  if (!date || !area || !storage_location || !code || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!AREAS.includes(area)) {
    return res.status(400).json({ error: `Invalid area. Must be one of: ${AREAS.join(', ')}` });
  }
  if (!STORAGE_LOCATIONS.includes(storage_location)) {
    return res.status(400).json({ error: `Invalid storage location. Must be one of: ${STORAGE_LOCATIONS.join(', ')}` });
  }
  if (!TYRE_CODES.includes(code)) {
    return res.status(400).json({ error: 'Invalid tyre code.' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
  }

  const num_in = parseFloat(qty_in) || 0;
  const num_out = parseFloat(qty_out) || 0;

  if (num_in < 0 || num_out < 0) {
    return res.status(400).json({ error: 'Quantities cannot be negative.' });
  }
  if (num_in === 0 && num_out === 0) {
    return res.status(400).json({ error: 'Quantity In and Out cannot both be zero.' });
  }

  const records = readDatabase();
  const newRecord = {
    id: '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    date,
    area,
    storage_location,
    code,
    category,
    qty_in: num_in,
    qty_out: num_out,
    notes: notes || '',
    created_at: Date.now()
  };

  records.push(newRecord);
  if (writeDatabase(records)) {
    res.status(201).json(newRecord);
  } else {
    res.status(500).json({ error: 'Failed to save record to database.' });
  }
});

// 4. Update an Existing Record
app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const { date, area, storage_location, code, category, qty_in, qty_out, notes } = req.body;

  let records = readDatabase();
  const recordIndex = records.findIndex(r => r.id === id);

  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Validations (if fields are provided)
  if (area && !AREAS.includes(area)) {
    return res.status(400).json({ error: 'Invalid area.' });
  }
  if (storage_location && !STORAGE_LOCATIONS.includes(storage_location)) {
    return res.status(400).json({ error: 'Invalid storage location.' });
  }
  if (code && !TYRE_CODES.includes(code)) {
    return res.status(400).json({ error: 'Invalid tyre code.' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const num_in = qty_in !== undefined ? (parseFloat(qty_in) || 0) : records[recordIndex].qty_in;
  const num_out = qty_out !== undefined ? (parseFloat(qty_out) || 0) : records[recordIndex].qty_out;

  if (num_in < 0 || num_out < 0) {
    return res.status(400).json({ error: 'Quantities cannot be negative.' });
  }

  // Update fields
  records[recordIndex] = {
    ...records[recordIndex],
    date: date || records[recordIndex].date,
    area: area || records[recordIndex].area,
    storage_location: storage_location || records[recordIndex].storage_location,
    code: code || records[recordIndex].code,
    category: category || records[recordIndex].category,
    qty_in: num_in,
    qty_out: num_out,
    notes: notes !== undefined ? notes : records[recordIndex].notes,
    updated_at: Date.now()
  };

  if (writeDatabase(records)) {
    res.json(records[recordIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update database.' });
  }
});

// 5. Delete a Record
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  let records = readDatabase();
  const recordIndex = records.findIndex(r => r.id === id);

  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  records.splice(recordIndex, 1);

  if (writeDatabase(records)) {
    res.json({ message: 'Record deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete from database.' });
  }
});

// 6. Get Dashboard Summary Data
app.get('/api/dashboard-summary', (req, res) => {
  const records = readDatabase();

  // 1. Calculate General Aggregates
  let totalIn = 0;
  let totalOut = 0;
  const categorySummary = {
    new: { in: 0, out: 0, balance: 0 },
    '7day': { in: 0, out: 0, balance: 0 },
    '7-14day': { in: 0, out: 0, balance: 0 },
    over14day: { in: 0, out: 0, balance: 0 },
    disposition: { in: 0, out: 0, balance: 0 }
  };

  const areaSummary = {};
  const storageSummary = {};
  const codeSummary = {};

  // Initialize
  AREAS.forEach(area => {
    areaSummary[area] = { in: 0, out: 0, balance: 0, disposition_pending: 0 };
  });
  STORAGE_LOCATIONS.forEach(loc => {
    storageSummary[loc] = { in: 0, out: 0, balance: 0 };
  });
  TYRE_CODES.forEach(code => {
    codeSummary[code] = { in: 0, out: 0, balance: 0 };
  });

  records.forEach(r => {
    const qtyIn = r.qty_in || 0;
    const qtyOut = r.qty_out || 0;
    const net = qtyIn - qtyOut;

    totalIn += qtyIn;
    totalOut += qtyOut;

    // Category
    if (categorySummary[r.category]) {
      categorySummary[r.category].in += qtyIn;
      categorySummary[r.category].out += qtyOut;
      categorySummary[r.category].balance += net;
    }

    // Area
    if (areaSummary[r.area]) {
      areaSummary[r.area].in += qtyIn;
      areaSummary[r.area].out += qtyOut;
      areaSummary[r.area].balance += net;
      if (r.category === 'disposition') {
        areaSummary[r.area].disposition_pending += net;
      }
    }

    // Storage Location
    if (storageSummary[r.storage_location]) {
      storageSummary[r.storage_location].in += qtyIn;
      storageSummary[r.storage_location].out += qtyOut;
      storageSummary[r.storage_location].balance += net;
    }

    // Code
    if (codeSummary[r.code]) {
      codeSummary[r.code].in += qtyIn;
      codeSummary[r.code].out += qtyOut;
      codeSummary[r.code].balance += net;
    }
  });

  // Calculate top 10 codes based on current net balance (weight in stock)
  const topCodes = Object.keys(codeSummary)
    .map(code => ({
      code,
      in: codeSummary[code].in,
      out: codeSummary[code].out,
      balance: Math.max(0, codeSummary[code].balance)
    }))
    .filter(c => c.in > 0 || c.out > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  // Daily Trend calculation (last 15 days)
  const dailyTrendMap = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyTrendMap[dateStr] = { date: dateStr, in: 0, out: 0 };
  }

  // Populate daily trends
  records.forEach(r => {
    if (dailyTrendMap[r.date]) {
      dailyTrendMap[r.date].in += r.qty_in || 0;
      dailyTrendMap[r.date].out += r.qty_out || 0;
    }
  });

  const dailyTrend = Object.values(dailyTrendMap).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totals: {
      total_in: totalIn,
      total_out: totalOut,
      net_balance: Math.max(0, totalIn - totalOut),
      disposition_pending: Math.max(0, categorySummary['disposition'].balance)
    },
    categories: categorySummary,
    areas: areaSummary,
    storage_locations: storageSummary,
    top_codes: topCodes,
    daily_trend: dailyTrend
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Workaway Backend is running on http://localhost:${PORT}`);
});
