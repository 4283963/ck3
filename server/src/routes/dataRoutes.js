const express = require('express');
const router = express.Router();
const {
  getIslandsList,
  getConfigValue,
  setConfigValue,
  getLockStates,
  unlockInverter,
  getLatestData,
  getSummary,
  getHistory
} = require('../controllers/dataController');

router.get('/islands', getIslandsList);
router.get('/config/:key', getConfigValue);
router.put('/config/:key', setConfigValue);
router.get('/locks', getLockStates);
router.post('/unlock/:inverterId', unlockInverter);
router.get('/latest', getLatestData);
router.get('/summary', getSummary);
router.get('/history', getHistory);

module.exports = router;
