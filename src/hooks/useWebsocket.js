import { onMounted, onUnmounted, ref } from 'vue';

const socket = ref(null);
const latestResult = ref(null);
const guardianUpdate = ref(null);
const connectionStatus = ref('DISCONNECTED');
const latestMessage = ref(null);
const retryCount = ref(0);
const maxRetries = 5;

let activeConsumers = 0;
let reconnectTimer = null;
let tokenWatchTimer = null;
let connectedToken = '';

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const closeSocket = () => {
  if (socket.value) {
    socket.value.onopen = null;
    socket.value.onmessage = null;
    socket.value.onclose = null;
    socket.value.onerror = null;
    socket.value.close();
    socket.value = null;
  }
};

const buildWsUrl = (token) => {
  const baseUrl = import.meta.env.VITE_WS_URL || 'ws://101.34.239.144:8080/ws/results';
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
};

const scheduleReconnect = () => {
  if (retryCount.value >= maxRetries || activeConsumers <= 0) {
    return;
  }

  clearReconnectTimer();
  const delay = Math.pow(2, retryCount.value) * 1000;
  retryCount.value += 1;
  reconnectTimer = setTimeout(() => {
    connect(true);
  }, delay);
};

function connect(forceReconnect = false) {
  const token = localStorage.getItem('api_token') || '';
  if (!token) {
    connectionStatus.value = 'NO_TOKEN';
    closeSocket();
    connectedToken = '';
    return Promise.resolve(false);
  }

  const isOpen = socket.value && socket.value.readyState === WebSocket.OPEN;
  const isConnecting = socket.value && socket.value.readyState === WebSocket.CONNECTING;
  const tokenChanged = connectedToken !== token;

  if (!forceReconnect && !tokenChanged && (isOpen || isConnecting)) {
    return isOpen ? Promise.resolve(true) : waitForConnection();
  }

  clearReconnectTimer();
  closeSocket();

  try {
    connectionStatus.value = 'CONNECTING';
    connectedToken = token;
    socket.value = new WebSocket(buildWsUrl(token));

    socket.value.onopen = () => {
      connectionStatus.value = 'CONNECTED';
      retryCount.value = 0;
    };

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        latestMessage.value = data;
        if (data.type === 'RAG_RESULT') {
          latestResult.value = data;

          if (data.riskLevel === 'HIGH') {
            const audio = new Audio('/alert.mp3');
            audio.play().catch(() => {});
          }
        }

        if (data.type === 'GUARDIAN_LIST_UPDATE') {
          guardianUpdate.value = data.data;
        }
      } catch (error) {
        console.warn('WebSocket 消息解析失败', error);
      }
    };

    socket.value.onclose = () => {
      socket.value = null;
      connectionStatus.value = 'DISCONNECTED';
      scheduleReconnect();
    };

    socket.value.onerror = () => {
      connectionStatus.value = 'ERROR';
    };
  } catch (error) {
    connectionStatus.value = 'ERROR';
    console.warn('WebSocket 初始化失败', error);
    scheduleReconnect();
    return Promise.resolve(false);
  }

  return waitForConnection();
}

function waitForConnection(timeoutMs = 5000) {
  if (connectionStatus.value === 'CONNECTED') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (connectionStatus.value === 'CONNECTED') {
        clearInterval(timer);
        resolve(true);
        return;
      }

      if (connectionStatus.value === 'ERROR' || connectionStatus.value === 'NO_TOKEN' || Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

const startTokenWatcher = () => {
  if (tokenWatchTimer) return;

  tokenWatchTimer = setInterval(() => {
    const latestToken = localStorage.getItem('api_token') || '';
    if (!latestToken && connectedToken) {
      closeSocket();
      connectedToken = '';
      connectionStatus.value = 'NO_TOKEN';
      return;
    }

    if (latestToken && latestToken !== connectedToken) {
      connect(true);
    }
  }, 1000);
};

const stopTokenWatcher = () => {
  if (tokenWatchTimer) {
    clearInterval(tokenWatchTimer);
    tokenWatchTimer = null;
  }
};

export function useWebsocket() {
  onMounted(() => {
    activeConsumers += 1;
    startTokenWatcher();
    connect();
  });

  onUnmounted(() => {
    activeConsumers = Math.max(0, activeConsumers - 1);
    if (activeConsumers === 0) {
      clearReconnectTimer();
      stopTokenWatcher();
      closeSocket();
      connectedToken = '';
      connectionStatus.value = 'DISCONNECTED';
    }
  });

  return {
    latestResult,
    guardianUpdate,
    latestMessage,
    connectionStatus,
    connect
  };
}
