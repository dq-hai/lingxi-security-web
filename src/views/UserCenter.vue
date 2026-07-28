<template>
  <div class="user-center-page page-shell">
    <section class="hero-panel user-hero" v-scroll-reveal="{ delay: 30, once: true }">
      <div>
        <span class="eyebrow-label">User Settings</span>
        <h2 class="page-title">用户与接口配置</h2>
        <p class="page-subtitle">根据 Android 用户端接口统一管理业务用户登录态、资料同步、守护对象绑定和受保护接口调试。</p>
      </div>
      <el-tag type="success" effect="plain">管理员：{{ adminName }}</el-tag>
    </section>

    <el-row :gutter="16">
      <el-col :xs="24" :xl="8">
        <el-card class="section-card" shadow="never" header="安卓业务接口凭证" v-scroll-reveal="{ delay: 60 }">
          <el-alert
            title="使用业务用户身份证号与密码注册或登录，系统会自动保存 Bearer Token"
            type="info"
            show-icon
            :closable="false"
          />

          <el-form class="token-form" label-width="96px">
            <el-form-item label="身份证号">
              <el-input
                v-model="authForm.idCard"
                maxlength="18"
                placeholder="请输入 18 位身份证号"
                clearable
              />
            </el-form-item>
            <el-form-item label="登录密码">
              <el-input
                v-model="authForm.password"
                type="password"
                minlength="6"
                maxlength="16"
                show-password
                placeholder="请输入 6-16 位登录密码"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="authLoading" @click="handleAuth('login')">登录获取 Token</el-button>
              <el-button :loading="authLoading" @click="handleAuth('register')">注册并获取 Token</el-button>
              <el-button @click="clearApiToken">退出业务登录</el-button>
            </el-form-item>
            <el-form-item label="当前 Token">
              <el-input
                :model-value="apiToken"
                type="textarea"
                :rows="4"
                readonly
                placeholder="登录或注册成功后自动展示"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="section-card guardian-card" shadow="never" v-scroll-reveal="{ delay: 120, origin: 'left' }">
          <template #header>
            <div class="card-header">
              <span>守护对象列表</span>
              <el-button type="primary" plain size="small" :loading="guardianLoading" @click="fetchGuardianList">刷新</el-button>
            </div>
          </template>

          <el-table :data="guardianList" empty-text="暂无数据或缺少业务 Token" size="small">
            <el-table-column prop="idMask" label="对象账号" min-width="150" />
            <el-table-column prop="targetCode" label="绑定码" width="96" />
            <el-table-column prop="lastRiskLevel" label="风险" width="90">
              <template #default="{ row }">
                <el-tag :type="getLevelType(row.lastRiskLevel)" size="small">{{ row.lastRiskLevel || 'NONE' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="16">
        <el-card
          class="section-card"
          shadow="never"
          header="业务接口调试与资料同步"
          v-scroll-reveal="{ delay: 90, origin: 'right' }"
        >
          <el-row :gutter="16">
            <el-col :xs="24" :lg="10">
              <div class="tool-panel soft-panel">
                <h3>用户 Profile 查询</h3>
                <p>页面初始化会自动拉取 `/api/v1/user/profile`，也可以手动重新查询当前业务用户资料。</p>
                <el-button type="primary" :loading="profileLoading" @click="fetchUserProfile">查询 Profile</el-button>
                <el-descriptions v-if="profile" class="result-box" :column="1" border>
                  <el-descriptions-item label="脱敏账号">{{ profile.id_mask || profile.idMask || '暂无' }}</el-descriptions-item>
                  <el-descriptions-item label="绑定码">{{ profile.my_code || profile.myCode || '暂无' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>

            <el-col :xs="24" :lg="14">
              <div class="tool-panel soft-panel">
                <h3>用户资料同步</h3>
                <p>对照 Android 用户端 `/api/v1/user/profile/update` 文档，支持提交姓名、手机号、年龄、职业和地区等资料。</p>
                <el-form label-width="86px" class="sync-form">
                  <el-row :gutter="12">
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="姓名">
                        <el-input v-model="syncForm.name" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="手机号">
                        <el-input v-model="syncForm.phone" maxlength="11" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="身份证号">
                        <el-input v-model="syncForm.idCard" maxlength="18" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="年龄">
                        <el-input v-model="syncForm.age" maxlength="3" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="性别">
                        <div class="gender-picker">
                          <button
                            v-for="option in genderOptions"
                            :key="option.value"
                            type="button"
                            class="gender-card"
                            :class="{ active: syncForm.gender === option.value }"
                            @click="syncForm.gender = option.value"
                          >
                            <span class="gender-symbol">{{ option.symbol }}</span>
                            <span class="gender-label">{{ option.label }}</span>
                            <span class="gender-copy">{{ option.copy }}</span>
                          </button>
                        </div>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="职业">
                        <el-input v-model="syncForm.occupation" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="地区">
                        <button type="button" class="region-trigger" @click="regionDialogVisible = true">
                          <span class="region-trigger-copy">
                            <span class="region-trigger-label">地区选择</span>
                            <strong>{{ selectedRegionDisplay || '请选择省 / 市 / 区' }}</strong>
                          </span>
                          <span class="region-trigger-action">{{ selectedRegionDisplay ? '重新选择' : '立即选择' }}</span>
                        </button>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                      <el-form-item label="公司">
                        <el-input v-model="syncForm.company" clearable />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24">
                      <el-form-item label="详细地址">
                        <el-input v-model="syncForm.address" type="textarea" :rows="2" clearable />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-button type="primary" :loading="syncLoading" @click="handleSyncProfile">同步资料</el-button>
                </el-form>
              </div>
            </el-col>
          </el-row>

          <el-dialog v-model="regionDialogVisible" title="选择地区" width="880px" class="region-dialog" append-to-body>
            <div class="region-picker-board">
              <div class="region-picker-header">
                <div class="region-pill">
                  <span>当前选择</span>
                  <strong>{{ selectedRegionDisplay || '未选择' }}</strong>
                </div>
                <el-button text @click="clearRegionSelection">清空</el-button>
              </div>

              <div class="region-columns">
                <section class="region-column">
                  <header>
                    <span>01</span>
                    <strong>省级</strong>
                  </header>
                  <div class="region-option-list">
                    <button
                      v-for="province in provinceOptions"
                      :key="province.code"
                      type="button"
                      class="region-option"
                      :class="{ active: selectedProvinceCode === province.code }"
                      @click="selectProvince(province.code)"
                    >
                      {{ province.name }}
                    </button>
                  </div>
                </section>

                <section class="region-column">
                  <header>
                    <span>02</span>
                    <strong>市级</strong>
                  </header>
                  <div class="region-option-list">
                    <button
                      v-for="city in cityOptions"
                      :key="city.code"
                      type="button"
                      class="region-option"
                      :class="{ active: selectedCityCode === city.code }"
                      @click="selectCity(city.code)"
                    >
                      {{ city.name }}
                    </button>
                    <div v-if="!cityOptions.length" class="region-empty">先选择省级地区</div>
                  </div>
                </section>

                <section class="region-column">
                  <header>
                    <span>03</span>
                    <strong>区县</strong>
                  </header>
                  <div class="region-option-list">
                    <button
                      v-for="district in districtOptions"
                      :key="district.code"
                      type="button"
                      class="region-option"
                      :class="{ active: regionSelection[2] === district.code }"
                      @click="selectDistrict(district.code)"
                    >
                      {{ district.name }}
                    </button>
                    <div v-if="!districtOptions.length" class="region-empty">先选择市级地区</div>
                  </div>
                </section>
              </div>
            </div>

            <template #footer>
              <div class="region-dialog-footer">
                <el-button @click="regionDialogVisible = false">关闭</el-button>
                <el-button type="primary" :disabled="regionSelection.length < 3" @click="regionDialogVisible = false">确认地区</el-button>
              </div>
            </template>
          </el-dialog>

          <div class="bind-panel soft-panel">
            <h3>绑定守护对象</h3>
            <p>输入对方 6 位绑定码，调用 `/api/v1/guardians/bind` 建立守护关系。列表会在接口成功后和 WebSocket 推送后自动刷新。</p>
            <div class="bind-row">
              <el-input v-model="bindForm.targetCode" maxlength="6" placeholder="6 位绑定码" clearable />
              <el-button type="primary" :loading="bindLoading" @click="handleBindGuardian">提交绑定</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { bindGuardian, getGuardianList, getUserProfile, login, register, syncProfile } from '../api/modules';
import { useWebsocket } from '../hooks/useWebsocket';
import regionOptions from '../assets/addr/addr';

const adminName = computed(() => localStorage.getItem('admin_name') || 'admin');
const apiToken = ref(localStorage.getItem('api_token') || '');
const authLoading = ref(false);
const profileLoading = ref(false);
const guardianLoading = ref(false);
const bindLoading = ref(false);
const syncLoading = ref(false);
const profile = ref(null);
const guardianList = ref([]);
const regionSelection = ref([]);
const regionDialogVisible = ref(false);
const selectedProvinceCode = ref('');
const selectedCityCode = ref('');
const { guardianUpdate } = useWebsocket();
const genderOptions = [
  { value: '男', label: '男', symbol: 'M', copy: '常规档案' },
  { value: '女', label: '女', symbol: 'F', copy: '常规档案' }
];

const authForm = reactive({
  idCard: '',
  password: ''
});

const bindForm = reactive({
  targetCode: ''
});

const syncForm = reactive({
  name: '',
  phone: '',
  idCard: '',
  age: '',
  gender: '',
  occupation: '',
  region: '',
  address: '',
  company: ''
});

const pickProfileField = (data = {}, keys = []) => {
  const matchedKey = keys.find((key) => data[key] !== undefined && data[key] !== null && data[key] !== '');
  return matchedKey ? data[matchedKey] : '';
};

const getLevelType = (level) => ({ HIGH: 'danger', MEDIUM: 'warning', LOW: 'success', NONE: 'info' }[level] || 'info');
const isValidIdCard = (value) => /^\d{17}[\dXx]$/.test(value);
const isValidPassword = (value) => /^.{6,16}$/.test(value);
const isValidPhone = (value) => /^1\d{10}$/.test(value);
const formatRegionNames = (names = []) => names.filter(Boolean).join(' ');
const provinceOptions = computed(() => regionOptions);
const cityOptions = computed(() => provinceOptions.value.find((item) => item.code === selectedProvinceCode.value)?.children || []);
const districtOptions = computed(() => cityOptions.value.find((item) => item.code === selectedCityCode.value)?.children || []);
const selectedRegionDisplay = computed(() => syncForm.region.trim());

const findRegionNamesByCodes = (codes = [], options = regionOptions) => {
  const names = [];
  let currentOptions = Array.isArray(options) ? options : [];

  for (const code of codes) {
    const match = currentOptions.find((item) => item.code === code);
    if (!match) return [];
    names.push(match.name);
    currentOptions = Array.isArray(match.children) ? match.children : [];
  }

  return names;
};

const findRegionPathByText = (text, options = regionOptions, trail = []) => {
  const normalizedTarget = String(text || '').replace(/\s+/g, '');
  if (!normalizedTarget) return [];

  for (const item of Array.isArray(options) ? options : []) {
    const nextTrail = [...trail, item];
    const names = nextTrail.map((node) => node.name);
    const fullText = names.join('').replace(/\s+/g, '');
    const compactText = formatRegionNames(names).replace(/\s+/g, '');

    if (normalizedTarget === fullText || normalizedTarget === compactText) {
      return nextTrail.map((node) => node.code);
    }

    if (Array.isArray(item.children) && item.children.length) {
      const matched = findRegionPathByText(normalizedTarget, item.children, nextTrail);
      if (matched.length) return matched;
    }
  }

  return [];
};

const syncRegionTextFromSelection = () => {
  syncForm.region = formatRegionNames(findRegionNamesByCodes(regionSelection.value));
};

const handleRegionChange = (value) => {
  regionSelection.value = Array.isArray(value) ? value : [];
  selectedProvinceCode.value = regionSelection.value[0] || '';
  selectedCityCode.value = regionSelection.value[1] || '';
  syncRegionTextFromSelection();
};

const selectProvince = (code) => {
  selectedProvinceCode.value = code;
  selectedCityCode.value = '';
  handleRegionChange([code]);
};

const selectCity = (code) => {
  if (!selectedProvinceCode.value) return;
  selectedCityCode.value = code;
  handleRegionChange([selectedProvinceCode.value, code]);
};

const selectDistrict = (code) => {
  if (!selectedProvinceCode.value || !selectedCityCode.value) return;
  handleRegionChange([selectedProvinceCode.value, selectedCityCode.value, code]);
};

const clearRegionSelection = () => {
  selectedProvinceCode.value = '';
  selectedCityCode.value = '';
  handleRegionChange([]);
};

const normalizeAuthPayload = (payload = {}) => ({
  token: payload.token || '',
  myCode: payload.my_code || payload.myCode || '',
  idMask: payload.id_mask || payload.idMask || ''
});

const persistAuthSession = (payload = {}) => {
  const { token, myCode, idMask } = normalizeAuthPayload(payload);
  if (!token) {
    throw new Error('业务接口未返回 token');
  }

  apiToken.value = token;
  localStorage.setItem('api_token', token);
  profile.value = {
    ...(profile.value || {}),
    ...(idMask ? { id_mask: idMask } : {}),
    ...(myCode ? { my_code: myCode } : {})
  };
};

const normalizeGuardian = (item = {}) => ({
  idMask: item.idMask || item.id_mask || '鏆傛棤',
  targetCode: item.targetCode || item.target_code || '---',
  lastRiskLevel: item.lastRiskLevel || item.riskLevel || 'NONE',
  riskReason: item.riskReason || item.reason || ''
});

const patchSyncFormFromProfile = (data = {}) => {
  syncForm.name = pickProfileField(data, ['name']) || syncForm.name || '';
  syncForm.phone = pickProfileField(data, ['phone']) || syncForm.phone || '';
  syncForm.idCard = pickProfileField(data, ['idCard', 'id_card']) || syncForm.idCard || '';
  syncForm.age = String(pickProfileField(data, ['age']) || syncForm.age || '');
  syncForm.gender = pickProfileField(data, ['gender']) || syncForm.gender || '';
  syncForm.occupation = pickProfileField(data, ['occupation']) || syncForm.occupation || '';
  syncForm.company = pickProfileField(data, ['company']) || syncForm.company || '';
  syncForm.address = pickProfileField(data, ['address']) || syncForm.address || '';

  const regionText = pickProfileField(data, ['region']);
  if (!regionText) return;

  syncForm.region = String(regionText).trim();
  const matchedPath = findRegionPathByText(syncForm.region);
  handleRegionChange(matchedPath);
};

const clearApiToken = () => {
  apiToken.value = '';
  authForm.idCard = '';
  authForm.password = '';
  localStorage.removeItem('api_token');
  profile.value = null;
  guardianList.value = [];
  ElMessage.success('业务 Token 已清除');
};

const fetchUserProfile = async () => {
  profileLoading.value = true;
  try {
    const res = await getUserProfile();
    const data = res?.data || res || {};
    profile.value = data;
    patchSyncFormFromProfile(data);
  } finally {
    profileLoading.value = false;
  }
};

const fetchGuardianList = async () => {
  guardianLoading.value = true;
  try {
    const res = await getGuardianList();
    const data = res?.data || res || [];
    const list = Array.isArray(data) ? data : data.list || [];
    guardianList.value = list.map(normalizeGuardian);
  } finally {
    guardianLoading.value = false;
  }
};

const handleAuth = async (mode) => {
  const idCard = authForm.idCard.trim();
  const password = authForm.password.trim();

  if (!isValidIdCard(idCard)) {
    ElMessage.warning('请输入正确的 18 位身份证号');
    return;
  }

  if (!isValidPassword(password)) {
    ElMessage.warning('请输入 6-16 位登录密码');
    return;
  }

  authLoading.value = true;
  try {
    const requestFn = mode === 'register' ? register : login;
    const res = await requestFn({ idCard, password });
    const data = res?.data || res || {};
    persistAuthSession(data);
    syncForm.idCard = idCard;
    ElMessage.success(mode === 'register' ? '娉ㄥ唽鎴愬姛锛屽凡鑾峰彇 Token' : '鐧诲綍鎴愬姛锛屽凡鑾峰彇 Token');
    await Promise.all([fetchUserProfile(), fetchGuardianList()]);
  } finally {
    authLoading.value = false;
  }
};

const handleBindGuardian = async () => {
  if (!/^\d{6}$/.test(bindForm.targetCode)) {
    ElMessage.warning('请输入 6 位绑定码');
    return;
  }

  bindLoading.value = true;
  try {
    const res = await bindGuardian({ targetCode: bindForm.targetCode });
    ElMessage.success(res?.message || '绑定成功');
    bindForm.targetCode = '';
    await fetchGuardianList();
  } finally {
    bindLoading.value = false;
  }
};

const handleSyncProfile = async () => {
  const payload = {
    name: syncForm.name.trim(),
    phone: syncForm.phone.trim(),
    idCard: syncForm.idCard.trim(),
    age: syncForm.age.trim(),
    gender: syncForm.gender.trim(),
    occupation: syncForm.occupation.trim(),
    region: syncForm.region.trim(),
    address: syncForm.address.trim(),
    company: syncForm.company.trim()
  };

  if (!payload.name || !payload.phone || !payload.age || !payload.gender || !payload.occupation || !payload.region) {
    ElMessage.warning('请先填写资料同步接口要求的必填字段');
    return;
  }

  if (!isValidPhone(payload.phone)) {
    ElMessage.warning('请输入正确的 11 位手机号');
    return;
  }

  if (payload.idCard && !isValidIdCard(payload.idCard)) {
    ElMessage.warning('身份证号格式不正确');
    return;
  }

  syncLoading.value = true;
  try {
    const res = await syncProfile(payload);
    ElMessage.success(res?.message || '资料同步成功');
    await fetchUserProfile();
  } finally {
    syncLoading.value = false;
  }
};

watch(guardianUpdate, (value) => {
  if (!value) return;
  const nextItem = normalizeGuardian(value);
  const index = guardianList.value.findIndex((item) => item.targetCode === nextItem.targetCode || item.idMask === nextItem.idMask);
  if (index >= 0) {
    guardianList.value.splice(index, 1, { ...guardianList.value[index], ...nextItem });
  } else {
    guardianList.value.unshift(nextItem);
  }
});

onMounted(async () => {
  if (!apiToken.value) return;
  await Promise.all([fetchUserProfile(), fetchGuardianList()]);
});
</script>

<style scoped lang="scss">
.user-center-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.user-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.token-form,
.sync-form {
  margin-top: 16px;
}

.guardian-card {
  margin-top: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: var(--text-primary);
}

.tool-panel,
.bind-panel {
  padding: 18px;
}

.tool-panel {
  min-height: 280px;
}

.tool-panel h3,
.bind-panel h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
}

.tool-panel p,
.bind-panel p {
  margin: 0 0 16px;
  line-height: 1.75;
  color: var(--text-secondary);
  font-size: 13px;
}

.gender-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.gender-card,
.region-trigger,
.region-option {
  border: 0;
  outline: none;
  font: inherit;
  cursor: pointer;
}

.gender-card {
  display: grid;
  gap: 4px;
  min-height: 94px;
  padding: 14px 16px;
  text-align: left;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(64, 125, 255, 0.18), transparent 42%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 246, 255, 0.92));
  box-shadow:
    inset 0 0 0 1px rgba(133, 157, 191, 0.18),
    0 12px 28px rgba(12, 31, 57, 0.08);
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
}

.gender-card:hover,
.region-option:hover,
.region-trigger:hover {
  transform: translateY(-2px);
}

.gender-card.active {
  background:
    radial-gradient(circle at top right, rgba(255, 195, 90, 0.26), transparent 44%),
    linear-gradient(145deg, #152338, #233858);
  box-shadow:
    inset 0 0 0 1px rgba(255, 221, 154, 0.28),
    0 16px 36px rgba(21, 35, 56, 0.22);
  color: #f7fbff;
}

.gender-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(18, 39, 67, 0.08);
  font-size: 14px;
  font-weight: 700;
}

.gender-card.active .gender-symbol {
  background: rgba(255, 255, 255, 0.12);
}

.gender-label {
  font-weight: 700;
}

.gender-copy {
  color: var(--text-secondary);
  font-size: 12px;
}

.gender-card.active .gender-copy {
  color: rgba(237, 243, 252, 0.76);
}

.region-trigger {
  width: 100%;
  min-height: 94px;
  padding: 16px 18px;
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(17, 38, 66, 0.96), rgba(44, 71, 116, 0.92)),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 246, 255, 0.92));
  color: #f8fbff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 20px 36px rgba(18, 33, 54, 0.18);
}

.region-trigger-copy {
  display: grid;
  gap: 6px;
  text-align: left;
}

.region-trigger-label,
.region-trigger-action {
  font-size: 12px;
  color: rgba(232, 239, 248, 0.72);
}

.region-trigger strong {
  font-size: 16px;
  line-height: 1.35;
}

.region-trigger-action {
  white-space: nowrap;
}

.region-picker-board {
  display: grid;
  gap: 18px;
}

.region-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.region-pill {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.9));
  border: 1px solid rgba(155, 176, 204, 0.2);
}

.region-pill span,
.region-empty {
  color: var(--text-secondary);
  font-size: 12px;
}

.region-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.region-column {
  min-height: 360px;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(240, 245, 252, 0.92));
  border: 1px solid rgba(155, 176, 204, 0.18);
}

.region-column header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.region-column header span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: rgba(28, 59, 104, 0.08);
  font-size: 12px;
  font-weight: 700;
  color: #1f4f91;
}

.region-option-list {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
  max-height: 300px;
  overflow: auto;
  padding-right: 4px;
}

.region-option {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 0 0 1px rgba(151, 171, 198, 0.18);
  color: var(--text-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.region-option.active {
  background: linear-gradient(135deg, #1a4f93, #2c73d5);
  color: #f7fbff;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    0 12px 22px rgba(35, 93, 170, 0.24);
}

.region-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.result-box {
  margin-top: 16px;
}

.bind-panel {
  margin-top: 16px;
}

.bind-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1200px) {
  .user-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .gender-picker,
  .region-columns {
    grid-template-columns: 1fr;
  }

  .region-trigger {
    align-items: flex-start;
    flex-direction: column;
  }

  .bind-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
