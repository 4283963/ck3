const { insertMany } = require('./dataStore');

const islands = [
  { id: 'island-a', name: '东海岛', timezoneOffset: 0 },
  { id: 'island-b', name: '西海岛', timezoneOffset: 3 },
  { id: 'island-c', name: '南海岛', timezoneOffset: -2 },
];

const islandConfigs = {};

islands.forEach(island => {
  const solarConfig = [
    { id: `${island.id}-SOLAR-001`, name: `${island.name}东区1号`, maxPower: 500 },
    { id: `${island.id}-SOLAR-002`, name: `${island.name}东区2号`, maxPower: 500 },
    { id: `${island.id}-SOLAR-003`, name: `${island.name}西区1号`, maxPower: 600 },
    { id: `${island.id}-SOLAR-004`, name: `${island.name}西区2号`, maxPower: 600 },
  ];

  const batteryConfig = [
    { id: `${island.id}-BATT-001`, name: `${island.name}储能A组`, capacity: 1000, initialSoc: 85 + island.timezoneOffset * 5 },
    { id: `${island.id}-BATT-002`, name: `${island.name}储能B组`, capacity: 1000, initialSoc: island.id === 'island-b' ? 15 : 72 },
    { id: `${island.id}-BATT-003`, name: `${island.name}储能C组`, capacity: 800, initialSoc: 90 + island.timezoneOffset * 3 },
  ];

  const batteryStates = {};
  batteryConfig.forEach(b => {
    batteryStates[b.id] = { soc: b.initialSoc, capacity: b.capacity };
  });

  islandConfigs[island.id] = {
    island,
    solarInverters: solarConfig,
    batteryInverters: batteryConfig,
    batteryStates,
    voltageBase: 480 + island.timezoneOffset * 10,
  };
});

const getTimeBasedFactor = (island) => {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60 + island.timezoneOffset;
  const normalized = (hours - 6) / 12;
  if (normalized < 0 || normalized > 1) return 0.1;
  return Math.sin(normalized * Math.PI) * 0.9 + 0.1;
};

const randomWithin = (min, max) => min + Math.random() * (max - min);

const generateSolarData = (inverter, config) => {
  const timeFactor = getTimeBasedFactor(config.island);
  const cloudFactor = randomWithin(0.7, 1.0);
  const power = inverter.maxPower * timeFactor * cloudFactor;
  const voltage = randomWithin(config.voltageBase - 20, config.voltageBase + 20);
  const current = power / voltage;

  return {
    islandId: config.island.id,
    islandName: config.island.name,
    inverterId: inverter.id,
    name: inverter.name,
    type: 'solar',
    voltage: parseFloat(voltage.toFixed(2)),
    current: parseFloat(current.toFixed(2)),
    power: parseFloat(power.toFixed(2)),
    temperature: parseFloat(randomWithin(35, 55).toFixed(1)),
    status: 'normal',
  };
};

const generateBatteryData = (inverter, config) => {
  const state = config.batteryStates[inverter.id];
  const totalSolarPower = config.solarInverters.reduce((sum, inv) => {
    const timeFactor = getTimeBasedFactor(config.island);
    return sum + inv.maxPower * timeFactor * 0.85;
  }, 0);
  const totalLoad = 1500 + randomWithin(-200, 200);
  const powerDelta = totalSolarPower - totalLoad;
  const socDelta = (powerDelta / state.capacity) * (5 / 3600) * 100;
  
  state.soc = Math.max(0, Math.min(100, state.soc + socDelta));
  state.soc = parseFloat(state.soc.toFixed(1));

  const power = Math.abs(powerDelta / config.batteryInverters.length);
  const voltage = randomWithin(config.voltageBase - 40, config.voltageBase);
  const current = power / voltage;

  let status = 'normal';
  if (state.soc < 20) status = 'warning';
  if (state.soc < 10) status = 'error';

  return {
    islandId: config.island.id,
    islandName: config.island.name,
    inverterId: inverter.id,
    name: inverter.name,
    type: 'battery',
    voltage: parseFloat(voltage.toFixed(2)),
    current: parseFloat(current.toFixed(2)),
    power: parseFloat(power.toFixed(2)),
    soc: state.soc,
    temperature: parseFloat(randomWithin(25, 40).toFixed(1)),
    status,
  };
};

const generateAndSaveData = async () => {
  try {
    const dataPoints = [];

    Object.values(islandConfigs).forEach(config => {
      config.solarInverters.forEach(inv => {
        dataPoints.push(generateSolarData(inv, config));
      });

      config.batteryInverters.forEach(inv => {
        dataPoints.push(generateBatteryData(inv, config));
      });
    });

    const docs = await insertMany(dataPoints);
    console.log(`[${new Date().toLocaleTimeString()}] 已生成 ${docs.length} 条逆变器数据（${islands.length}个海岛）`);
  } catch (error) {
    console.error('生成模拟数据失败:', error.message);
  }
};

const startDataSimulation = () => {
  console.log(`启动数据模拟，每5秒生成一次数据（覆盖 ${islands.length} 个海岛）...`);
  generateAndSaveData();
  setInterval(generateAndSaveData, 5000);
};

const getIslands = () => islands;

module.exports = { startDataSimulation, getIslands };
