const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy API requests to the Matterport API
app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://my.matterport.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  })
);

// Serve static files
app.use('/bundle', express.static(path.join(__dirname, 'bundle')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'map.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
