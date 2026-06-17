const mongoose = require('mongoose');
const InverterData = require('../models/InverterData');
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

const getLatestData = async (type = null) => {
  if (useMemory) {
    return memoryStore.findLatestByInverter(type);
  }

  const match = {};
  if (type) match.type = type;

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

const getHistory = async (inverterId = null, limit = 60) => {
  if (useMemory) {
    return memoryStore.findHistory(inverterId, limit);
  }

  const query = {};
  if (inverterId) query.inverterId = inverterId;

  const data = await InverterData.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  return data.reverse();
};

const calculateSummary = (latestData) => {
  const solarData = latestData.filter(d => d.type === 'solar');
  const batteryData = latestData.filter(d => d.type === 'battery');

  const totalSolarPower = solarData.reduce((sum, d) => sum + d.power, 0);
  const totalBatteryCapacity = 2800;

  let totalStoredEnergy = 0;
  batteryData.forEach(b => {
    const cap = b.inverterId === 'BATT-003' ? 800 : 1000;
    totalStoredEnergy += cap * (b.soc / 100);
  });

  const avgSoc = batteryData.length > 0
    ? batteryData.reduce((sum, d) => sum + d.soc, 0) / batteryData.length
    : 0;

  const lowBatteryCount = batteryData.filter(d => d.soc < 20).length;
  const warning = lowBatteryCount > 0;

  return {
    totalSolarPower: parseFloat(totalSolarPower.toFixed(2)),
    totalStoredEnergy: parseFloat(totalStoredEnergy.toFixed(2)),
    totalBatteryCapacity,
    avgSoc: parseFloat(avgSoc.toFixed(1)),
    lowBatteryCount,
    warning,
    solarInverters: solarData.length,
    batteryInverters: batteryData.length,
    timestamp: new Date()
  };
};

module.exports = {
  initDataStore,
  insertMany,
  getLatestData,
  getHistory,
  calculateSummary
};
