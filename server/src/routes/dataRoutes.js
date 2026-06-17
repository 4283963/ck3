const express = require('express');
const router = express.Router();
const { getIslandsList, getLatestData, getSummary, getHistory } = require('../controllers/dataController');

router.get('/islands', getIslandsList);
router.get('/latest', getLatestData);
router.get('/summary', getSummary);
router.get('/history', getHistory);

module.exports = router;
