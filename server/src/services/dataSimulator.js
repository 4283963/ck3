const { insertMany, getConfig, setInverterLock, getInverterLock } = require('./dataStore');

const islands = [
  { id: 'island-a', name: '东海岛', timezoneOffset: 0 },
  { id: 'island-b', name: '西海岛', timezoneOffset: 3 },
  { id: 'island-c', name: '南海岛', timezoneOffset: -2 },
];

const islandConfigs = {};
const lockStates = {};

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

  batteryConfig.forEach(b => {
    lockStates[b.id] = { locked: false };
  });
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

const generateBatteryData = async (inverter, config, lowSocThreshold) => {
  const state = config.batteryStates[inverter.id];
  const lockState = lockStates[inverter.id] || { locked: false };

  const totalSolarPower = config.solarInverters.reduce((sum, inv) => {
    const timeFactor = getTimeBasedFactor(config.island);
    return sum + inv.maxPower * timeFactor * 0.85;
  }, 0);
  const totalLoad = 1500 + randomWithin(-200, 200);
  let powerDelta = totalSolarPower - totalLoad;

  if (lockState.locked) {
    powerDelta = Math.max(0, powerDelta);
  }

  const socDelta = (powerDelta / state.capacity) * (5 / 3600) * 100;
  state.soc = Math.max(0, Math.min(100, state.soc + socDelta));
  state.soc = parseFloat(state.soc.toFixed(1));

  let power = Math.abs(powerDelta / config.batteryInverters.length);
  const voltage = randomWithin(config.voltageBase - 40, config.voltageBase);
  let current = power / voltage;

  if (lockState.locked && powerDelta < 0) {
    power = 0;
    current = 0;
  }

  let status = 'normal';
  if (state.soc < lowSocThreshold) status = 'warning';
  if (state.soc < 10) status = 'error';

  if (state.soc < lowSocThreshold && !lockState.locked) {
    const lockedState = await setInverterLock(
      inverter.id,
      true,
      'locked_discharge',
      `SOC ${state.soc}% 低于阈值 ${lowSocThreshold}%，自动锁定放电`
    );
    lockStates[inverter.id] = { locked: true, ...lockedState };
    console.log(`🔒 [${inverter.name}] SOC ${state.soc}% < ${lowSocThreshold}%，已自动锁定放电`);
  } else if (state.soc >= lowSocThreshold && lockState.locked && lockState.autoLocked) {
    await setInverterLock(inverter.id, false);
    lockStates[inverter.id] = { locked: false };
    console.log(`🔓 [${inverter.name}] SOC ${state.soc}% 已恢复，解除锁定`);
  }

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

const getLowSocThreshold = async () => {
  const config = await getConfig('lowSocThreshold');
  if (config && typeof config.value === 'number') {
    return config.value;
  }
  return 20;
};

const generateAndSaveData = async () => {
  try {
    const lowSocThreshold = await getLowSocThreshold();
    const dataPoints = [];

    for (const config of Object.values(islandConfigs)) {
      config.solarInverters.forEach(inv => {
        dataPoints.push(generateSolarData(inv, config));
      });

      for (const inv of config.batteryInverters) {
        dataPoints.push(await generateBatteryData(inv, config, lowSocThreshold));
      }
    }

    const docs = await insertMany(dataPoints);
    const lockedCount = docs.filter(d => d.locked).length;
    if (lockedCount > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] 已生成 ${docs.length} 条数据，其中 ${lockedCount} 台处于锁定状态`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] 已生成 ${docs.length} 条逆变器数据（${islands.length}个海岛）`);
    }
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

module.exports = { startDataSimulation, getIslands, getLowSocThreshold };
