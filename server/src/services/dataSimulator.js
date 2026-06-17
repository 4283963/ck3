const { insertMany } = require('./dataStore');

const solarInverters = [
  { id: 'SOLAR-001', name: '东区光伏阵列1号', maxPower: 500 },
  { id: 'SOLAR-002', name: '东区光伏阵列2号', maxPower: 500 },
  { id: 'SOLAR-003', name: '西区光伏阵列1号', maxPower: 600 },
  { id: 'SOLAR-004', name: '西区光伏阵列2号', maxPower: 600 },
];

const batteryInverters = [
  { id: 'BATT-001', name: '储能站A组', capacity: 1000, initialSoc: 85 },
  { id: 'BATT-002', name: '储能站B组', capacity: 1000, initialSoc: 17 },
  { id: 'BATT-003', name: '储能站C组', capacity: 800, initialSoc: 65 },
];

let batteryStates = {};
batteryInverters.forEach(b => {
  batteryStates[b.id] = { soc: b.initialSoc, capacity: b.capacity };
});

const getTimeBasedFactor = () => {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const normalized = (hours - 6) / 12;
  if (normalized < 0 || normalized > 1) return 0.1;
  return Math.sin(normalized * Math.PI) * 0.9 + 0.1;
};

const randomWithin = (min, max) => min + Math.random() * (max - min);

const generateSolarData = (inverter) => {
  const timeFactor = getTimeBasedFactor();
  const cloudFactor = randomWithin(0.7, 1.0);
  const power = inverter.maxPower * timeFactor * cloudFactor;
  const voltage = randomWithin(480, 520);
  const current = power / voltage;

  return {
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

const generateBatteryData = (inverter) => {
  const state = batteryStates[inverter.id];
  const totalSolarPower = solarInverters.reduce((sum, inv) => {
    const timeFactor = getTimeBasedFactor();
    return sum + inv.maxPower * timeFactor * 0.85;
  }, 0);
  const totalLoad = 1500 + randomWithin(-200, 200);
  const powerDelta = totalSolarPower - totalLoad;
  const socDelta = (powerDelta / state.capacity) * (5 / 3600) * 100;
  
  state.soc = Math.max(0, Math.min(100, state.soc + socDelta));
  state.soc = parseFloat(state.soc.toFixed(1));

  const isCharging = powerDelta > 0;
  const power = Math.abs(powerDelta / batteryInverters.length);
  const voltage = randomWithin(440, 480);
  const current = power / voltage;

  let status = 'normal';
  if (state.soc < 20) status = 'warning';
  if (state.soc < 10) status = 'error';

  return {
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

    solarInverters.forEach(inv => {
      dataPoints.push(generateSolarData(inv));
    });

    batteryInverters.forEach(inv => {
      dataPoints.push(generateBatteryData(inv));
    });

    const docs = await insertMany(dataPoints);
    console.log(`[${new Date().toLocaleTimeString()}] 已生成 ${docs.length} 条逆变器数据`);
  } catch (error) {
    console.error('生成模拟数据失败:', error.message);
  }
};

const startDataSimulation = () => {
  console.log('启动数据模拟，每5秒生成一次数据...');
  generateAndSaveData();
  setInterval(generateAndSaveData, 5000);
};

module.exports = { startDataSimulation, solarInverters, batteryInverters };
