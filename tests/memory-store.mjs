export class MemoryStore {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    if (!this.map.has(key)) return null;
    return JSON.parse(JSON.stringify(this.map.get(key)));
  }
  async setJSON(key, value) {
    this.map.set(key, JSON.parse(JSON.stringify(value)));
    return { modified: true };
  }
}
