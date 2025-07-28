// Add this to your API server (Express.js example)
const cors = require('cors');

app.use(cors({
  origin: ['https://www.mytickerlist.com', 'https://mytickerlist.com'],
  credentials: true
}));