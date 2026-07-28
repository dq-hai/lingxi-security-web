<template>
  <div class="login-container">
    <div class="bg-layer"></div>
    <div class="grid-layer"></div>

    <section class="login-stage">
      <div class="login-copy" v-scroll-reveal="{ delay: 20, once: true }">
        <span class="eyebrow-label">Admin Sign In</span>
        <h1 class="login-display">灵犀安全反诈管控平台</h1>
        <p class="login-intro">管理员通过此页面进入管理后台，进行风险监测、策略校验和业务配置操作。</p>
      </div>

      <el-card class="login-card" shadow="never" v-scroll-reveal="{ delay: 120, distance: 34, once: true }">
        <div class="login-header">
          <img src="/logo.png" alt="logo" class="login-logo" />
          <h2 class="login-title">管理员登录</h2>
          <p class="login-subtitle">Web 管理员账号独立于安卓端业务用户账号</p>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" size="large">
          <el-form-item label="管理员账号" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入管理员账号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="登录密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入登录密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住账号</el-checkbox>
            <el-tag size="small" :type="loginModeTagType" effect="plain">{{ loginModeLabel }}</el-tag>
          </div>

          <el-button type="primary" class="login-submit" :loading="loading" @click="handleLogin">
            {{ loading ? '正在验证...' : '立即登录' }}
          </el-button>
        </el-form>

        <div class="login-footer">
          <el-divider>离线管理员</el-divider>
          <div class="status-tags">
            <el-tag size="small" type="success" effect="plain">{{ localAdminUsername }}</el-tag>
            <el-tag size="small" type="info" effect="plain">本地条件编译登录</el-tag>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup>
import axios from 'axios';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);
const rememberMe = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需在 6-32 位之间', trigger: 'blur' }
  ]
};

const adminLoginMode = import.meta.env.VITE_ADMIN_LOGIN_MODE || 'offline';
const adminLoginUrl = import.meta.env.VITE_ADMIN_LOGIN_URL || '/api/v1/admin/login';
const localAdminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const localAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const enableLocalFallback = import.meta.env.VITE_ADMIN_LOCAL_FALLBACK !== 'false';

const loginModeLabel = computed(() => {
  if (adminLoginMode === 'online') return '在线管理员登录';
  if (adminLoginMode === 'auto') return '在线优先 / 离线兜底';
  return '离线本地登录';
});

const loginModeTagType = computed(() => {
  if (adminLoginMode === 'online') return 'success';
  if (adminLoginMode === 'auto') return 'warning';
  return 'info';
});

const saveAdminSession = ({ token, username }) => {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_name', username);
  localStorage.setItem('admin_username', rememberMe.value ? username : '');
};

const localLogin = () => {
  const isValidAdmin = loginForm.username === localAdminUsername && loginForm.password === localAdminPassword;
  if (!isValidAdmin) {
    throw new Error('管理员账号或密码错误');
  }

  saveAdminSession({
    token: `offline-admin-${Date.now()}`,
    username: loginForm.username
  });
};

const onlineLogin = async () => {
  const response = await axios.post(adminLoginUrl, {
    username: loginForm.username,
    password: loginForm.password
  }, { timeout: 3000 });

  const data = response.data?.data || response.data || {};
  if (!data.token) {
    throw new Error('管理端登录接口未返回 token');
  }

  saveAdminSession({
    token: data.token,
    username: data.username || loginForm.username
  });
};

const runLoginByMode = async () => {
  if (adminLoginMode === 'offline') {
    localLogin();
    return;
  }

  if (adminLoginMode === 'online') {
    try {
      await onlineLogin();
    } catch (error) {
      if (!enableLocalFallback) throw error;
      localLogin();
      ElMessage.warning('在线登录不可用，已使用本地离线登录');
    }
    return;
  }

  try {
    await onlineLogin();
  } catch (error) {
    localLogin();
    ElMessage.warning('在线登录不可用，已使用本地离线登录');
  }
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await runLoginByMode();
      ElMessage.success('管理员登录成功');
      router.push('/dashboard');
    } catch (error) {
      ElMessage.error(error.message || '管理员登录失败');
    } finally {
      loading.value = false;
    }
  });
};

onMounted(() => {
  localStorage.removeItem('admin_token');
  const savedUsername = localStorage.getItem('admin_username');
  if (savedUsername) {
    loginForm.username = savedUsername;
    rememberMe.value = true;
  }
});
</script>

<style scoped lang="scss">
.login-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 210, 142, 0.2), transparent 22%),
    radial-gradient(circle at 84% 72%, rgba(150, 221, 255, 0.18), transparent 24%),
    linear-gradient(145deg, #0c1b31 0%, #163862 38%, #2d75d7 100%);
}

.bg-layer,
.grid-layer {
  position: absolute;
  inset: 0;
}

.bg-layer {
  background:
    radial-gradient(circle at 18% 24%, rgba(147, 197, 255, 0.24) 0%, transparent 34%),
    radial-gradient(circle at 82% 68%, rgba(167, 243, 208, 0.18) 0%, transparent 32%);
  animation: float-bg 20s ease-in-out infinite alternate;
}

.grid-layer {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.42), transparent 92%);
}

.login-stage {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 440px;
  align-items: center;
  gap: 36px;
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.login-copy {
  color: #fff;
}

.login-display {
  margin: 18px 0 0;
  font-size: clamp(34px, 4.8vw, 56px);
  line-height: 1;
  letter-spacing: -0.03em;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
}

.login-intro {
  max-width: 620px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 15px;
  line-height: 1.85;
}

.login-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(255, 204, 123, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 255, 0.9));
  box-shadow: 0 24px 72px rgba(5, 18, 36, 0.3);
  backdrop-filter: blur(18px);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-logo {
  width: 66px;
  height: 66px;
  border-radius: 20px;
  margin-bottom: 12px;
  box-shadow: 0 16px 30px rgba(16, 35, 58, 0.16);
}

.login-title {
  margin: 0;
  font-size: 28px;
  color: #10233a;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
  letter-spacing: -0.03em;
}

.login-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #5c7088;
  line-height: 1.7;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.login-submit {
  width: 100%;
  height: 50px;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.login-footer {
  margin-top: 16px;
}

.status-tags {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

@keyframes float-bg {
  from {
    transform: translate(-2%, -1%) scale(1);
  }

  to {
    transform: translate(3%, 2%) scale(1.05);
  }
}

@media (max-width: 980px) {
  .login-stage {
    grid-template-columns: 1fr;
    padding: 48px 0;
  }
}

@media (max-width: 560px) {
  .login-stage {
    width: min(100% - 24px, 1240px);
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
