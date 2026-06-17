const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDataStore } = require('./services/dataStore');
const dataRoutes = require('./routes/dataRoutes');
const { startDataSimulation } = require('./services/dataSimulator');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/data', dataRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '海岛光伏储能监控系统运行正常',
    timestamp: new Date()
  });
});

const startServer = async () => {
  try {
    await initDataStore();
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API 健康检查: http://localhost:${PORT}/api/health`);
    });
    startDataSimulation();
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
