const { getLatestData: fetchLatest, getHistory: fetchHistory, calculateSummary, getConfig, setConfig, getAllLockStates, setInverterLock } = require('../services/dataStore');
const { getIslands, getLowSocThreshold } = require('../services/dataSimulator');

const getIslandsList = (req, res) => {
  try {
    const islands = getIslands();
    res.json({
      success: true,
      data: islands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getConfigValue = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await getConfig(key);
    res.json({
      success: true,
      data: config ? config.value : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const setConfigValue = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (key === 'lowSocThreshold') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return res.status(400).json({
          success: false,
          message: '低电量阈值必须是 0-100 之间的数字'
        });
      }
      const saved = await setConfig(key, numValue);
      console.log(`⚙️  低电量阈值已设置为 ${numValue}%`);
      return res.json({
        success: true,
        data: { key, value: saved.value }
      });
    }

    const saved = await setConfig(key, value);
    res.json({
      success: true,
      data: { key, value: saved.value }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLockStates = async (req, res) => {
  try {
    const states = await getAllLockStates();
    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const unlockInverter = async (req, res) => {
  try {
    const { inverterId } = req.params;
    const state = await setInverterLock(inverterId, false);
    console.log(`🔓 [${inverterId}] 已手动解除锁定`);
    res.json({
      success: true,
      data: state
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLatestData = async (req, res) => {
  try {
    const { type, islandId } = req.query;
    const latestData = await fetchLatest(type, islandId);

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    res.json({
      success: true,
      data: latestData,
      islandId: islandId || 'all'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getSummary = async (req, res) => {
  try {
    const { islandId } = req.query;
    const latestData = await fetchLatest(null, islandId);
    const lowSocThreshold = await getLowSocThreshold();
    const summary = calculateSummary(latestData, lowSocThreshold);

    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

    res.json({
      success: true,
      data: {
        ...summary,
        islandId: islandId || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const { inverterId, limit = 60, islandId } = req.query;
    const data = await fetchHistory(inverterId, parseInt(limit), islandId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getIslandsList,
  getConfigValue,
  setConfigValue,
  getLockStates,
  unlockInverter,
  getLatestData,
  getSummary,
  getHistory
};
