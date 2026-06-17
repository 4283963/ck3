const mongoose = require('mongoose');
const InverterData = require('../models/InverterData');
const Config = require('../models/Config');
const MemoryStore = require('./memoryStore');

let useMemory = true;
let memoryStore = null;

const initDataStore = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (mongoURI) {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      useMemory = false;
      console.log('数据存储模式: MongoDB');
      return 'mongodb';
    } else {
      memoryStore = new MemoryStore();
      useMemory = true;
      console.log('数据存储模式: 内存模式 (设置 MONGO_URI 环境变量可启用 MongoDB)');
      return 'memory';
    }
  } catch (error) {
    console.warn('MongoDB 连接失败，切换到内存模式:', error.message);
    memoryStore = new MemoryStore();
    useMemory = true;
    return 'memory';
  }
};

const insertMany = async (docs) => {
  if (useMemory) {
    return memoryStore.insertMany(docs);
  }
  return await InverterData.insertMany(docs);
};

const getLatestData = async (type = null, islandId = null) => {
  if (useMemory) {
    return memoryStore.findLatestByInverter(type, islandId);
  }

  const match = {};
  if (type) match.type = type;
  if (islandId) match.islandId = islandId;

  const result = await InverterData.aggregate([
    { $match: match },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$inverterId',
        data: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$data' } },
    { $sort: { inverterId: 1 } }
  ]);

  return result;
};

const getHistory = async (inverterId = null, limit = 60, islandId = null) => {
  if (useMemory) {
    return memoryStore.findHistory(inverterId, limit, islandId);
  }

  const query = {};
  if (inverterId) query.inverterId = inverterId;
  if (islandId) query.islandId = islandId;

  const data = await InverterData.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  return data.reverse();
};

const calculateSummary = (latestData, lowSocThreshold = 20) => {
  const solarData = latestData.filter(d => d.type === 'solar');
  const batteryData = latestData.filter(d => d.type === 'battery');

  const totalSolarPower = solarData.reduce((sum, d) => sum + d.power, 0);

  let totalBatteryCapacity = 0;
  let totalStoredEnergy = 0;
  batteryData.forEach(b => {
    const cap = b.inverterId && b.inverterId.includes('BATT-003') ? 800 : 1000;
    totalBatteryCapacity += cap;
    totalStoredEnergy += cap * (b.soc / 100);
  });

  const avgSoc = batteryData.length > 0
    ? batteryData.reduce((sum, d) => sum + d.soc, 0) / batteryData.length
    : 0;

  const lowBatteryCount = batteryData.filter(d => d.soc < lowSocThreshold).length;
  const warning = lowBatteryCount > 0;

  const lockedCount = batteryData.filter(d => d.locked).length;

  return {
    totalSolarPower: parseFloat(totalSolarPower.toFixed(2)),
    totalStoredEnergy: parseFloat(totalStoredEnergy.toFixed(2)),
    totalBatteryCapacity,
    avgSoc: parseFloat(avgSoc.toFixed(1)),
    lowBatteryCount,
    warning,
    lockedCount,
    lowSocThreshold,
    solarInverters: solarData.length,
    batteryInverters: batteryData.length,
    timestamp: new Date()
  };
};

const getConfig = async (key) => {
  if (useMemory) {
    return memoryStore.getConfig(key);
  }
  return await Config.findOne({ key });
};

const setConfig = async (key, value) => {
  if (useMemory) {
    return memoryStore.setConfig(key, value);
  }
  return await Config.findOneAndUpdate(
    { key },
    { value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

const setInverterLock = async (inverterId, locked, controlSwitch = 'locked_discharge', reason = '') => {
  if (useMemory) {
    return memoryStore.setInverterLock(inverterId, locked, controlSwitch, reason);
  }

  if (locked) {
    return {
      locked: true,
      controlSwitch,
      lockReason: reason,
      lockedAt: new Date()
    };
  } else {
    return {
      locked: false,
      controlSwitch: 'unlocked'
    };
  }
};

const getInverterLock = async (inverterId) => {
  if (useMemory) {
    return memoryStore.getInverterLock(inverterId);
  }
  return { locked: false, controlSwitch: 'unlocked' };
};

const getAllLockStates = async () => {
  if (useMemory) {
    return memoryStore.getAllLockStates();
  }
  return {};
};

module.exports = {
  initDataStore,
  insertMany,
  getLatestData,
  getHistory,
  calculateSummary,
  getConfig,
  setConfig,
  setInverterLock,
  getInverterLock,
  getAllLockStates
};
