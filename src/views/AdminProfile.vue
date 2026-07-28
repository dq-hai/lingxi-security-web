<template>
  <div class="admin-profile page-shell">
    <section class="hero-panel profile-hero" v-scroll-reveal="{ delay: 30, once: true }">
      <div class="hero-left">
        <div class="admin-avatar">
          <el-avatar :size="76" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <span class="status-dot"></span>
        </div>

        <div class="admin-summary">
          <span class="eyebrow-label">Admin Profile</span>
          <h2 class="page-title">{{ adminName }}</h2>
          <p class="page-subtitle">查看管理员会话状态、账号边界和本地安全操作，不与业务用户身份混用。</p>
          <div class="summary-tags">
            <el-tag type="success" effect="plain">已登录</el-tag>
            <el-tag type="info" effect="plain">{{ loginModeLabel }}</el-tag>
          </div>
        </div>
      </div>

      <div class="hero-actions">
        <el-button type="primary" plain @click="goConfig">接口凭证配置</el-button>
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </div>
    </section>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card class="section-card" shadow="never" header="账号信息" v-scroll-reveal="{ delay: 70 }">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="管理员账号">{{ adminName }}</el-descriptions-item>
            <el-descriptions-item label="账号类型">Web 管理员</el-descriptions-item>
            <el-descriptions-item label="登录模式">{{ loginModeLabel }}</el-descriptions-item>
            <el-descriptions-item label="会话状态">本地会话有效</el-descriptions-item>
            <el-descriptions-item label="业务 Token">
              <el-tag :type="hasApiToken ? 'success' : 'warning'" size="small">
                {{ hasApiToken ? '已配置' : '未配置' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最近登录">{{ loginTimeText }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card audit-card" shadow="never" header="本地安全操作" v-scroll-reveal="{ delay: 120, origin: 'bottom' }">
          <div class="action-grid">
            <button class="action-item" type="button" @click="clearApiToken">
              <el-icon><Key /></el-icon>
              <span>清除业务 Token</span>
            </button>
            <button class="action-item" type="button" @click="refreshSession">
              <el-icon><RefreshRight /></el-icon>
              <span>刷新本地会话</span>
            </button>
            <button class="action-item danger" type="button" @click="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出管理员账号</span>
            </button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card class="section-card" shadow="never" header="权限边界" v-scroll-reveal="{ delay: 160, origin: 'right' }">
          <div class="boundary-list">
            <div v-for="item in boundaries" :key="item.title" class="boundary-item">
              <el-icon :class="item.type"><component :is="item.icon" /></el-icon>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Connection, Key, Lock, RefreshRight, SwitchButton, UserFilled } from '@element-plus/icons-vue';

const router = useRouter();
const adminName = computed(() => localStorage.getItem('admin_name') || 'admin');
const hasApiToken = computed(() => Boolean(localStorage.getItem('api_token')));
const adminToken = computed(() => localStorage.getItem('admin_token') || '');
const loginTimestamp = computed(() => {
  const matched = adminToken.value.match(/(\d{13})$/);
  return matched ? Number(matched[1]) : Date.now();
});

const loginModeLabel = computed(() => {
  const mode = import.meta.env.VITE_ADMIN_LOGIN_MODE || 'offline';
  if (mode === 'online') return '在线管理员登录';
  if (mode === 'auto') return '在线优先 / 离线兜底';
  return '离线本地登录';
});

const loginTimeText = computed(() => new Date(loginTimestamp.value).toLocaleString('zh-CN', { hour12: false }));

const boundaries = [
  {
    title: '管理员会话',
    desc: '仅用于进入 Web 后台，不代表任何安卓端用户身份。',
    icon: UserFilled,
    type: 'primary'
  },
  {
    title: '业务接口 Token',
    desc: '仅在调用安卓端受保护接口时使用，保存于管理端配置页。',
    icon: Key,
    type: 'warning'
  },
  {
    title: '接口连接',
    desc: '检测、报告、守护对象等业务能力仍由后端接口提供。',
    icon: Connection,
    type: 'success'
  },
  {
    title: '离线登录',
    desc: '离线模式只验证本地管理员账号，适合演示和断网环境。',
    icon: Lock,
    type: 'info'
  }
];

const goConfig = () => {
  router.push('/user');
};

const clearApiToken = () => {
  localStorage.removeItem('api_token');
  ElMessage.success('业务 Token 已清除');
};

const refreshSession = () => {
  localStorage.setItem('admin_token', `offline-admin-${Date.now()}`);
  ElMessage.success('本地会话已刷新');
};

const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_name');
  router.push('/login');
};
</script>

<style scoped lang="scss">
.admin-profile {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-hero,
.hero-left,
.summary-tags,
.hero-actions {
  display: flex;
}

.profile-hero,
.hero-left {
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.hero-left {
  justify-content: flex-start;
}

.admin-avatar {
  position: relative;
  flex: 0 0 auto;
}

.status-dot {
  position: absolute;
  right: 3px;
  bottom: 4px;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: var(--success);
}

.admin-summary {
  flex: 1;
  min-width: 0;
}

.summary-tags,
.hero-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.summary-tags {
  margin-top: 12px;
}

.audit-card {
  margin-top: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.action-item {
  min-height: 92px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 203, 109, 0.16), transparent 34%),
    linear-gradient(180deg, #fbfdff, #f3f8ff);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font: inherit;
  transition: all 0.24s var(--motion-ease);
}

.action-item:hover {
  border-color: var(--brand-500);
  color: var(--brand-500);
  transform: none;
  box-shadow: 0 14px 28px rgba(16, 35, 58, 0.08);
}

.action-item.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.action-item .el-icon {
  font-size: 24px;
}

.boundary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.boundary-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(95, 155, 255, 0.1), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 249, 255, 0.92));
}

.boundary-item .el-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 20px;
}

.boundary-item .primary {
  color: var(--brand-500);
}

.boundary-item .warning {
  color: var(--warning);
}

.boundary-item .success {
  color: var(--success);
}

.boundary-item .info {
  color: var(--text-secondary);
}

.boundary-item strong {
  display: block;
  margin-bottom: 5px;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
}

.boundary-item p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
  font-size: 13px;
}

@media (max-width: 992px) {
  .profile-hero,
  .hero-left {
    align-items: flex-start;
    flex-direction: column;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
