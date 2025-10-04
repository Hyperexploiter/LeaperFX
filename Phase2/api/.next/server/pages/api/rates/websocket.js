"use strict";(()=>{var e={};e.id=275,e.ids=[275],e.modules={1495:e=>{e.exports=require("ioredis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},4580:e=>{e.exports=require("node-cache")},1467:e=>{e.exports=import("@vercel/kv")},6555:e=>{e.exports=import("uuid")},9814:e=>{e.exports=import("ws")},2059:(e,t,s)=>{s.a(e,async(e,a)=>{try{s.r(t),s.d(t,{config:()=>u,default:()=>d,routeModule:()=>l});var r=s(1802),o=s(7153),n=s(6249),i=s(206),c=e([i]);i=(c.then?(await c)():c)[0];let d=(0,n.l)(i,"default"),u=(0,n.l)(i,"config"),l=new r.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/rates/websocket",pathname:"/api/rates/websocket",bundlePath:"",filename:""},userland:i});a()}catch(e){a(e)}})},206:(e,t,s)=>{s.a(e,async(e,a)=>{try{s.r(t),s.d(t,{WEBSOCKET_USAGE_EXAMPLE:()=>y,broadcastAlert:()=>p,broadcastRateUpdate:()=>l,cleanupWebSocket:()=>g,config:()=>m,default:()=>d,getWebSocketStats:()=>b,handleWebSocketConnection:()=>u});var r=s(9814),o=s(704),n=s(2057),i=s(8008),c=e([r,o,n,i]);[r,o,n,i]=c.then?(await c)():c;let S=null;async function d(e,t){i.t7.setSecurityHeaders(t);let s=i.t7.getCorsHeaders(e.headers.origin);if(Object.entries(s).forEach(([e,s])=>{t.setHeader(e,s)}),"OPTIONS"===e.method){t.status(200).end();return}if("GET"===e.method){let e=o.r6.getStats(),s=n.Vy.getStatus();t.status(200).json({success:!0,data:{websocketEndpoint:"/api/rates/websocket",supportedProtocols:["rates","market_data","alerts"],connectionInfo:{activeConnections:e.activeConnections,activeSubscriptions:e.activeSubscriptions,isRunning:o.r6.isRunning()},rateEngineStatus:{isRunning:s.isRunning,lastUpdate:s.lastUpdate,rateCount:s.rateCount},usage:{messagesSent:e.messagesSent,messagesReceived:e.messagesReceived,errors:e.errors}},timestamp:Date.now()});return}if("POST"===e.method&&"websocket"===e.headers.upgrade){try{S||(S=new r.WebSocketServer({port:0,perMessageDeflate:!1}),console.log("[WebSocket] WebSocket server initialized")),o.r6.isRunning()||o.r6.start(),n.Vy.getStatus().isRunning||await n.Vy.start(),S.on("connection",(e,t)=>{let s=o.r6.handleConnection(e,t);console.log(`[WebSocket] New client connected: ${s}`)}),t.status(200).json({success:!0,message:"WebSocket server ready for connections",timestamp:Date.now()})}catch(e){console.error("[WebSocket] Upgrade error:",e),t.status(500).json({success:!1,error:"Failed to initialize WebSocket connection",timestamp:Date.now()})}return}t.status(405).json({success:!1,error:"Method not allowed",allowedMethods:["GET","POST (WebSocket upgrade)"],timestamp:Date.now()})}let m={api:{bodyParser:!1,responseLimit:!1}};function u(e,t,s){if(!S){console.error("[WebSocket] WebSocket server not initialized");return}S.handleUpgrade(e,t,s,t=>{let s=o.r6.handleConnection(t,e);console.log(`[WebSocket] Client upgraded: ${s}`)})}function l(e){o.r6.isRunning()&&o.r6.broadcastRateUpdate(e)}function p(e){o.r6.isRunning()&&o.r6.broadcastAlert(e)}function b(){return{hubStats:o.r6.getStats(),serverRunning:null!==S,connectedClients:o.r6.getClients().length}}function g(){S&&(S.close(),S=null),o.r6.isRunning()&&o.r6.stop()}let y={connect:`
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/api/rates/websocket');

ws.onopen = () => {
  console.log('Connected to LeaperFX WebSocket');

  // Subscribe to rates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: {
      symbols: ['USDCAD', 'EURUSD', 'BTCUSD'],
      subscriptionType: 'rates',
      storeId: 'store123'  // optional
    },
    timestamp: Date.now()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'data':
      if (message.data.type === 'rate_update') {
        console.log('Rate update:', message.data.rates);
      }
      break;
    case 'heartbeat':
      console.log('Server heartbeat:', message.data);
      break;
    case 'error':
      console.error('WebSocket error:', message.error);
      break;
  }
};
  `,messageTypes:{subscribe:{type:"subscribe",data:{symbols:["USDCAD","EURUSD"],subscriptionType:"rates",storeId:"optional_store_id",frequency:3e4}},unsubscribe:{type:"unsubscribe",data:{symbols:["USDCAD"],subscriptionType:"rates",all:!1}},ping:{type:"ping",timestamp:Date.now()}},serverMessages:{rateUpdate:{type:"data",data:{type:"rate_update",rates:[{baseCurrency:"USD",targetCurrency:"CAD",rate:1.35,spread:.02,buyRate:1.3635,sellRate:1.3365,timestamp:Date.now()}]}},heartbeat:{type:"heartbeat",data:{serverTime:Date.now(),activeConnections:5,activeSubscriptions:12}},error:{type:"error",error:"Invalid subscription parameters",code:"INVALID_PARAMS"}}};a()}catch(e){a(e)}})}};var t=require("../../../webpack-api-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[924,704],()=>s(2059));module.exports=a})();