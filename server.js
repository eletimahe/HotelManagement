// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/* In-memory "DB" */
let MENU = [
  { id: 1, name: 'Chicken Biryani', description: 'Aromatic basmati rice', price: 180, image:'https://i.imgur.com/8Km9tLL.jpg', category:'Non-Veg' },
  { id: 2, name: 'Paneer Butter Masala', description: 'Creamy tomato gravy', price: 150, image:'https://i.imgur.com/9pHcJ3c.jpg', category:'Veg' },
  { id: 3, name: 'Chocolate Ice Cream', description: 'Rich and creamy', price: 80, image:'https://i.imgur.com/jAqXc1O.jpg', category:'Dessert' }
];
let ORDERS = [];
let NEXT_ORDER_ID = 1;
let NEXT_MENU_ID = MENU.length + 1;

/* ---------- API ---------- */

// GET /api/menu
app.get('/api/menu', (req, res) => res.json(MENU));

// POST /api/menu  (admin add)
app.post('/api/menu', (req, res) => {
  const p = req.body;
  const item = { id: NEXT_MENU_ID++, name: p.name, description: p.description || '', price: Number(p.price)||0, image: p.image||'', category: p.category||'' };
  MENU.push(item); res.json(item);
});

// POST /api/order
app.post('/api/order', (req, res) => {
  const { table, items, note } = req.body;
  if(!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'no items' });
  const order = {
    id: NEXT_ORDER_ID++,
    table: String(table || 'NA'),
    items: items.map(i => ({ id: i.id, name: i.name || ('item-'+i.id), qty: i.qty || 1, price: i.price || 0 })),
    note: note||'',
    createdAt: Date.now(),
    status: 'new'
  };
  ORDERS.push(order);

  // notify kitchen in real-time
  io.emit('new-order', order);

  res.json({ ok: true, orderId: order.id });
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  // return pending orders
  res.json(ORDERS.filter(o => o.status !== 'completed'));
});

// POST /api/orders/:id/complete
app.post('/api/orders/:id/complete', (req, res) => {
  const id = Number(req.params.id);
  const o = ORDERS.find(x=>x.id===id);
  if(!o) return res.status(404).json({ error: 'not found' });
  o.status = 'completed';
  res.json({ ok: true });
});

// POST /api/generate-qr
app.post('/api/generate-qr', async (req, res) => {
  const table = String(req.body.table || 'NA');
  const url = `${req.protocol}://${req.get('host')}/?table=${encodeURIComponent(table)}`;
  try{
    const dataUrl = await QRCode.toDataURL(url);
    res.json({ url, qrDataUrl: dataUrl });
  }catch(err){
    console.error(err); res.status(500).json({ error: 'QR failed' });
  }
});

/* Serve frontend files (public/) - already configured via express.static */

/* Socket.IO connection */
io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', ()=> console.log('socket disconnected', socket.id));
});

/* Start server */
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('Server running on port', PORT));
