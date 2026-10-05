// Duplicate prevention: persists hashes of already-posted articles to disk.
const fs = require('fs');
const path = require('path');
const { dataDir } = require('../config');

const file = path.join(dataDir, 'posted.json');
let ids = new Set();

try {
  fs.mkdirSync(dataDir, { recursive: true });
  ids = new Set(JSON.parse(fs.readFileSync(file, 'utf8')));
} catch {
  ids = new Set();
}

const save = () => fs.writeFileSync(file, JSON.stringify([...ids].slice(-2000)));

module.exports = {
  has: (id) => ids.has(id),
  add(id) {
    ids.add(id);
    save();
  },
};
