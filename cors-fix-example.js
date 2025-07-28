// Add this to your API server (Express.js example)
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://mytickerlist.com'],
  credentials: true
}));