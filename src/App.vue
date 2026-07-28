<template>
  <router-view v-if="isLoginPage" />

  <div v-else class="app-shell" :class="[`accent-${currentAccent}`]">
    <div class="shell-backdrop">
      <div class="shell-orb orb-a"></div>
      <div class="shell-orb orb-b"></div>
      <div class="shell-grid"></div>
    </div>

    <div class="shell-main">
      <transition name="nav-shell" appear>
        <header class="floating-nav-shell">
          <div class="floating-nav">
            <div class="brand-cluster">
              <img src="/logo.png" alt="logo" class="logo-img" />
              <div class="brand-copy">
                <span class="brand-title">灵犀安全</span>
                <span class="brand-subtitle">反诈管控平台</span>
              </div>
            </div>

            <nav class="route-nav">
              <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="nav-link"
                :class="{ active: activePath === item.path }"
              >
                <span class="nav-link-glow"></span>
                <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
                <span class="nav-copy">{{ item.label }}</span>
              </router-link>
            </nav>
          </div>
        </header>
      </transition>

      <div class="content-shell">
        <transition name="page-shell-head" mode="out-in">
          <div :key="`page-head-${activePath}`" class="shell-head-block">
            <div class="page-topbar">
              <div class="title-group">
                <div class="eyebrow">
                  <span class="eyebrow-dot"></span>
                  <span>业务管理后台</span>
                </div>
                <h1 class="header-title">{{ currentPageName }}</h1>
                <p class="header-subtitle">{{ currentSubtitle }}</p>
              </div>

              <div class="page-actions">
                <div class="status-pill">
                  <span class="status-signal"></span>
                  <span>实时同步中</span>
                </div>

                <el-badge :value="unreadPushCount" :hidden="unreadPushCount === 0" class="notice-item">
                  <el-button circle class="ghost-btn">
                    <el-icon :size="18"><Bell /></el-icon>
                  </el-button>
                </el-badge>

                <el-dropdown>
                  <span class="user-info">
                    <el-avatar :size="36" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                    <span class="username">管理员</span>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="goAdminProfile">个人中心</el-dropdown-item>
                      <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div class="route-meta-strip">
              <div class="meta-chip">统一导航</div>
              <div class="meta-chip">实时数据</div>
              <div class="meta-chip">联动处置</div>
            </div>
          </div>
        </transition>

        <main ref="contentMainRef" class="content-main">

          <router-view v-slot="{ Component }">
            <transition :name="pageTransitionName" mode="out-in">
              <div :key="routeViewKey" class="route-stage">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElNotification } from 'element-plus';
import { DataLine, View, Setting, User, Bell } from '@element-plus/icons-vue';
import { useWebsocket } from './hooks/useWebsocket';

const route = useRoute();
const router = useRouter();
const routeViewKey = ref(route.fullPath);
const pageTransitionName = ref('page-forward');
const contentMainRef = ref(null);
const unreadPushCount = ref(0);
const lastPushSignature = ref('');
const { latestMessage } = useWebsocket();

const navItems = [
  { path: '/dashboard', label: '数据驾驶舱', icon: DataLine },
  { path: '/monitor', label: '风险监测中心', icon: View },
  { path: '/strategy', label: '策略实验室', icon: Setting },
  { path: '/user', label: '用户中心', icon: User }
];

const isLoginPage = computed(() => route.path === '/login');
const activePath = computed(() => route.path);
const currentPageName = computed(() => route.meta.title || '工作台');
const currentSubtitle = computed(() => route.meta.subtitle || '保持信息联动与系统操作的一致性体验');
const currentAccent = computed(() => route.meta.accent || 'brand');

const buildNotificationPayload = (message = {}) => {
  if (message.type === 'RAG_RESULT') {
    return {
      title: `WebSocket 推送：${message.riskLevel || 'UNKNOWN'}`,
      type: message.riskLevel === 'HIGH' ? 'error' : message.riskLevel === 'MEDIUM' ? 'warning' : 'success',
      duration: message.riskLevel === 'HIGH' ? 8000 : 5000,
      message: `任务 ${message.taskId || '--'}：${message.reason || message.analysisText || '收到新的风险分析结果'}`
    };
  }

  if (message.type === 'GUARDIAN_LIST_UPDATE') {
    return {
      title: 'WebSocket 推送：守护对象更新',
      type: 'info',
      duration: 4000,
      message: '守护对象列表已更新，请前往用户中心查看最新状态。'
    };
  }

  return {
    title: `WebSocket 推送：${message.type || 'MESSAGE'}`,
    type: 'info',
    duration: 4000,
    message: typeof message === 'object' ? JSON.stringify(message) : String(message || '')
  };
};

watch(
  latestMessage,
  (message) => {
    if (!message || route.path === '/login') return;

    const signature = JSON.stringify({
      type: message.type,
      taskId: message.taskId,
      timestamp: message.timestamp,
      data: message.data
    });
    if (signature === lastPushSignature.value) return;

    lastPushSignature.value = signature;
    unreadPushCount.value += 1;

    const payload = buildNotificationPayload(message);
    ElNotification({
      title: payload.title,
      type: payload.type,
      duration: payload.duration,
      message: h('div', { class: 'ws-notification-copy' }, payload.message)
    });
  },
  { deep: true }
);

watch(
  () => route.fullPath,
  async (to, from) => {
    const getOrder = (target) => router.resolve(target || '').meta.order ?? -1;
    const nextOrder = getOrder(to);
    const prevOrder = getOrder(from);
    pageTransitionName.value = nextOrder >= prevOrder ? 'page-forward' : 'page-back';
    routeViewKey.value = `${to}-${Date.now()}`;
    unreadPushCount.value = 0;

    await nextTick();
    contentMainRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
  }
);

const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_name');
  router.push('/login');
};

const goAdminProfile = () => {
  router.push('/admin-profile');
};
</script>

<style scoped lang="scss">
.app-shell {
  position: relative;
  min-height: 100vh;
  color: var(--text-primary);
  background: transparent;
  --shell-nav-offset: 112px;
}

.shell-backdrop {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.shell-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.8;
  animation: shellFloat 16s ease-in-out infinite alternate;
}

.orb-a {
  top: -10%;
  left: -8%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(53, 122, 255, 0.28), transparent 70%);
}

.orb-b {
  right: -10%;
  top: 18%;
  width: 360px;
  height: 360px;
  animation-duration: 20s;
  background: radial-gradient(circle, rgba(14, 181, 126, 0.2), transparent 72%);
}

.shell-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(16, 35, 58, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 35, 58, 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.48), transparent 82%);
}

.shell-main {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.floating-nav-shell {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 18px 24px 0;
}

.floating-nav {
  width: min(1320px, 100%);
  margin: 0 auto;
  min-height: 78px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(255, 202, 120, 0.18), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(243, 248, 255, 0.78));
  border: 1px solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 20px 45px rgba(7, 18, 37, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px) saturate(140%);
}

.brand-cluster,
.brand-copy,
.route-nav,
.nav-link,
.page-topbar,
.title-group,
.page-actions {
  display: flex;
}

.brand-cluster {
  align-items: center;
  gap: 14px;
}

.logo-img {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
}

.brand-copy {
  flex-direction: column;
  min-width: 0;
}

.brand-title {
  color: #12263f;
  font-size: 18px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  color: rgba(73, 97, 126, 0.82);
  font-size: 12px;
}

.route-nav {
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(180, 198, 220, 0.22);
}

.nav-link {
  position: relative;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  color: rgba(61, 84, 111, 0.78);
  text-decoration: none;
  overflow: hidden;
  transition:
    color 0.28s ease,
    background 0.28s ease,
    box-shadow 0.28s ease,
    transform 0.28s ease;
}

.nav-link:hover {
  color: #10233a;
}

.nav-link.active {
  color: #10233a;
  background: linear-gradient(135deg, rgba(255, 221, 159, 0.52), rgba(255, 255, 255, 0.94));
  box-shadow:
    0 10px 30px rgba(255, 177, 53, 0.12),
    inset 0 0 0 1px rgba(255, 222, 163, 0.36);
}

.nav-link-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 22%, rgba(255, 229, 166, 0.32) 46%, transparent 68%);
  opacity: 0;
  transform: translateX(-120%);
  transition: opacity 0.28s ease, transform 0.7s var(--motion-ease);
}

.nav-link.active .nav-link-glow {
  opacity: 1;
  transform: translateX(120%);
}

.nav-icon,
.nav-copy {
  position: relative;
}

.nav-icon {
  font-size: 17px;
}

.nav-copy {
  font-size: 14px;
  font-weight: 600;
}

.content-shell {
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0 28px;
}

.shell-head-block {
  margin-bottom: 16px;
}

.page-topbar {
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.title-group,
.page-actions {
  align-items: center;
}

.title-group {
  flex-direction: column;
  align-items: flex-start;
}

.page-actions {
  gap: 14px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.eyebrow-dot,
.status-signal {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0eb57e;
  box-shadow: 0 0 0 8px rgba(14, 181, 126, 0.14);
}

.header-title {
  margin: 7px 0 0;
  font-size: 24px;
  line-height: 1.08;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
  letter-spacing: -0.02em;
}

.header-subtitle {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.ghost-btn {
  border: 1px solid rgba(111, 136, 163, 0.22);
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-primary);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(111, 136, 163, 0.18);
  color: var(--text-secondary);
  font-size: 13px;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-weight: 700;
  color: var(--text-primary);
}

.content-main {
  min-height: 0;
}

.route-meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(111, 136, 163, 0.16);
  color: var(--text-secondary);
  font-size: 12px;
}

.route-stage {
  min-height: calc(100vh - 180px);
}

.nav-shell-enter-active,
.nav-shell-leave-active {
  transition:
    opacity 0.34s ease,
    transform 0.42s var(--motion-ease),
    filter 0.34s ease;
}

.nav-shell-enter-from,
.nav-shell-leave-to {
  opacity: 0;
  filter: blur(10px);
  transform: translateY(-18px);
}

.page-shell-head-enter-active,
.page-shell-head-leave-active {
  transition:
    opacity 0.34s ease,
    transform 0.42s var(--motion-ease),
    filter 0.34s ease;
}

.page-shell-head-enter-from,
.page-shell-head-leave-to {
  opacity: 0;
  filter: blur(10px);
  transform: translateY(-16px);
}

.page-forward-enter-active,
.page-forward-leave-active,
.page-back-enter-active,
.page-back-leave-active {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, filter 0.32s ease;
}

.page-forward-enter-from,
.page-back-leave-to {
  opacity: 0;
  filter: blur(6px);
  transform: translate3d(44px, 0, 0) scale(0.985);
}

.page-forward-leave-to,
.page-back-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translate3d(-34px, 0, 0) scale(0.985);
}

@keyframes shellFloat {
  from {
    transform: translateY(-10px);
  }

  to {
    transform: translateY(20px);
  }
}

@media (max-width: 980px) {
  .floating-nav,
  .page-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .route-nav,
  .page-actions {
    justify-content: space-between;
  }

  .content-shell {
    width: min(100% - 32px, 1320px);
  }
}

@media (max-width: 768px) {
  .app-shell {
    --shell-nav-offset: 92px;
  }

  .floating-nav-shell {
    padding: 14px 16px 0;
  }

  .floating-nav {
    border-radius: 24px;
  }

  .route-nav {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .route-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-link {
    flex: 0 0 auto;
  }

  .username,
  .status-pill {
    display: none;
  }

  .content-shell {
    width: min(100% - 24px, 1320px);
  }
}
</style>
