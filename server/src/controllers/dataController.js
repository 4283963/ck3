const { getLatestData: fetchLatest, getHistory: fetchHistory, calculateSummary } = require('../services/dataStore');
const { getIslands } = require('../services/dataSimulator');

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
    const summary = calculateSummary(latestData);

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
  getLatestData,
  getSummary,
  getHistory
};
