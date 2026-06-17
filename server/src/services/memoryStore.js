class MemoryStore {
  constructor() {
    this.data = [];
    this.idCounter = 0;
    this.configs = new Map();
    this.lockStates = new Map();
  }

  insertMany(docs) {
    const now = new Date();
    const newDocs = docs.map(doc => {
      const lockState = this.lockStates.get(doc.inverterId);
      const enriched = {
        ...doc,
        _id: ++this.idCounter,
        timestamp: now,
        __v: 0
      };
      if (lockState && lockState.locked) {
        enriched.locked = true;
        enriched.controlSwitch = lockState.controlSwitch;
        enriched.lockReason = lockState.lockReason;
        enriched.lockedAt = lockState.lockedAt;
      } else {
        enriched.locked = false;
        enriched.controlSwitch = 'unlocked';
      }
      return enriched;
    });
    this.data.push(...newDocs);
    if (this.data.length > 10000) {
      this.data = this.data.slice(-5000);
    }
    return newDocs;
  }

  findLatestByInverter(type = null, islandId = null) {
    const latestMap = new Map();
    this.data.forEach(doc => {
      if (type && doc.type !== type) return;
      if (islandId && doc.islandId !== islandId) return;
      const existing = latestMap.get(doc.inverterId);
      if (!existing || new Date(doc.timestamp) > new Date(existing.timestamp)) {
        latestMap.set(doc.inverterId, doc);
      }
    });
    return Array.from(latestMap.values()).sort((a, b) => a.inverterId.localeCompare(b.inverterId));
  }

  findHistory(inverterId = null, limit = 60, islandId = null) {
    let filtered = this.data;
    if (inverterId) {
      filtered = filtered.filter(d => d.inverterId === inverterId);
    }
    if (islandId) {
      filtered = filtered.filter(d => d.islandId === islandId);
    }
    const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sorted.slice(0, limit).reverse();
  }

  setConfig(key, value) {
    this.configs.set(key, {
      key,
      value,
      updatedAt: new Date()
    });
    return this.configs.get(key);
  }

  getConfig(key) {
    return this.configs.get(key) || null;
  }

  setInverterLock(inverterId, locked, controlSwitch = 'locked_discharge', reason = '') {
    if (locked) {
      this.lockStates.set(inverterId, {
        locked: true,
        controlSwitch,
        lockReason: reason,
        lockedAt: new Date()
      });
    } else {
      this.lockStates.delete(inverterId);
    }
    return this.lockStates.get(inverterId) || { locked: false, controlSwitch: 'unlocked' };
  }

  getInverterLock(inverterId) {
    return this.lockStates.get(inverterId) || { locked: false, controlSwitch: 'unlocked' };
  }

  getAllLockStates() {
    const result = {};
    for (const [id, state] of this.lockStates) {
      result[id] = state;
    }
    return result;
  }
}

module.exports = MemoryStore;
