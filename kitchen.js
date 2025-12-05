<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kitchen Orders (KOT)</title>
<style>
  body{font-family:Arial;padding:12px;background:#111;color:#fff}
  h1{margin:0 0 12px}
  .order{background:#1f2937;padding:12px;border-radius:8px;margin-bottom:8px}
  .meta{font-size:13px;color:#9ca3af}
  .items{margin-top:8px}
  button{background:#ef4444;border:none;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer}
</style>
</head>
<body>
<h1>Kitchen Orders</h1>
<div id="orders">Connecting...</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
const container = document.getElementById('orders');

function renderOrder(o){
  const div = document.createElement('div'); div.className='order';
  div.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>Order #${o.id}</strong> — Table ${o.table}</div><div class="meta">${new Date(o.createdAt).toLocaleString()}</div></div>`;
  const items = document.createElement('div'); items.className='items';
  items.innerHTML = o.items.map(it=>`<div>${it.qty}× ${it.name}</div>`).join('');
  div.appendChild(items);
  const doneBtn = document.createElement('button'); doneBtn.textContent='Mark Done';
  doneBtn.onclick = async ()=>{
    await fetch('/api/orders/' + o.id + '/complete', { method: 'POST' });
    div.remove();
  };
  div.appendChild(doneBtn);
  return div;
}

// initial load
async function loadInitial(){
  const res = await fetch('/api/orders'); const data = await res.json();
  container.innerHTML = '';
  data.forEach(o => container.appendChild(renderOrder(o)));
}
loadInitial();

socket.on('connect', ()=> console.log('socket connected'));
socket.on('new-order', order => {
  // prepend new order
  container.prepend(renderOrder(order));
});
</script>
</body>
</html>
