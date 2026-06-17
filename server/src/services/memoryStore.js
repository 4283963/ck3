class MemoryStore {
  constructor() {
    this.data = [];
    this.idCounter = 0;
  }

  insertMany(docs) {
    const now = new Date();
    const newDocs = docs.map(doc => ({
      ...doc,
      _id: ++this.idCounter,
      timestamp: now,
      __v: 0
    }));
    this.data.push(...newDocs);
    if (this.data.length > 10000) {
      this.data = this.data.slice(-5000);
    }
    return newDocs;
  }

  findLatestByInverter(type = null) {
    const latestMap = new Map();
    this.data.forEach(doc => {
      if (type && doc.type !== type) return;
      const existing = latestMap.get(doc.inverterId);
      if (!existing || new Date(doc.timestamp) > new Date(existing.timestamp)) {
        latestMap.set(doc.inverterId, doc);
      }
    });
    return Array.from(latestMap.values()).sort((a, b) => a.inverterId.localeCompare(b.inverterId));
  }

  findHistory(inverterId = null, limit = 60) {
    let filtered = this.data;
    if (inverterId) {
      filtered = filtered.filter(d => d.inverterId === inverterId);
    }
    const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sorted.slice(0, limit).reverse();
  }
}

module.exports = MemoryStore;
