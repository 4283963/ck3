const mongoose = require('mongoose');

const inverterDataSchema = new mongoose.Schema({
  inverterId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['solar', 'battery'],
    required: true
  },
  voltage: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  power: {
    type: Number,
    required: true
  },
  soc: {
    type: Number,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'error'],
    default: 'normal'
  },
  locked: {
    type: Boolean,
    default: false
  },
  controlSwitch: {
    type: String,
    enum: ['unlocked', 'locked_discharge', 'locked_all'],
    default: 'unlocked'
  },
  lockReason: {
    type: String
  },
  lockedAt: {
    type: Date
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

inverterDataSchema.index({ inverterId: 1, timestamp: -1 });

module.exports = mongoose.model('InverterData', inverterDataSchema);
