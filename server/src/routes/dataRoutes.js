const express = require('express');
const router = express.Router();
const { getLatestData, getSummary, getHistory } = require('../controllers/dataController');

router.get('/latest', getLatestData);
router.get('/summary', getSummary);
router.get('/history', getHistory);

module.exports = router;
