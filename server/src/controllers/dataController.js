const { getLatestData: fetchLatest, getHistory: fetchHistory, calculateSummary } = require('../services/dataStore');

const getLatestData = async (req, res) => {
  try {
    const { type } = req.query;
    const latestData = await fetchLatest(type);

    res.json({
      success: true,
      data: latestData
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
    const latestData = await fetchLatest(null);
    const summary = calculateSummary(latestData);

    res.json({
      success: true,
      data: summary
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
    const { inverterId, limit = 60 } = req.query;
    const data = await fetchHistory(inverterId, parseInt(limit));

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
  getLatestData,
  getSummary,
  getHistory
};
