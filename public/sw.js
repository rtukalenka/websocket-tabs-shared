self.ws = null;

const broadcast = new BroadcastChannel('sw_channel');

const connectWebSocket = () => {
    self.ws = new WebSocket('ws://localhost:8080');

    self.ws.onopen = () => {
        console.log('[SW] websocket connection has been successfully created')
    };

    self.ws.onmessage = (e) => {
        try {
            const event = JSON.parse(e.data);

            if (!event) {
                return;
            }

            console.log('[SW] message from ws_sever ', event);

            broadcast.postMessage({type: 'message', sender: 'sw', payload: event.payload});
        } catch (err) {
            console.log('[SW] parse data is error', err);
        }
    };

    self.ws.onerror = (err) => {
        console.log('[SW] websocket error ', err);
    };
};

broadcast.onmessage = (event) => {
    const sender = event && event.sender;

    if (sender && sender !== 'iframe-proxy-page') {
        return;
    }

    if (!self.ws || self.ws && !~[0, 1].indexOf(self.ws.readyState)) {
        connectWebSocket();
    }

    if (sender && sender === 'iframe-proxy-page' && event.data.payload === 'ping') {
        return;
    }

    // Here we can send message to websocket
    console.log('[SW] message from IFRAME-PROXY-PAGE', event.data);
};

try {
    self.addEventListener('install', event => {
        console.log('[SW] install ', event);
    });

    self.addEventListener('activate', async event => {
        await self.skipWaiting();
        await self.clients.claim();

        connectWebSocket();
    });
} catch (err) {
    console.log(err);
}