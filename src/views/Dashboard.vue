<template>
  <div class="dashboard-page page-shell">
    <section class="hero-panel dashboard-hero" v-scroll-reveal="{ delay: 40, distance: 34, once: true }">
      <div class="hero-copy">
        <span class="eyebrow-label dashboard-eyebrow">Risk Overview</span>
        <h2 class="page-title dashboard-title">全国反诈态势总览</h2>
        <p class="page-subtitle">
          统一查看全国风险热力、实时预警、处置链路和跨区域协同状态，帮助值班人员快速判断当前风险分布与处置优先级。
        </p>

        <div class="hero-actions">
          <el-button type="primary" size="large" @click="scrollToSection('heatmap')">查看实时热力</el-button>
          <el-button size="large" class="glass-button" @click="scrollToSection('response')">查看联动处置链路</el-button>
        </div>

        <div class="hero-kpis">
          <div v-for="metric in heroMetrics" :key="metric.label" class="hero-kpi">
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.label }}</span>
          </div>
        </div>
      </div>

      <div class="hero-stage">
        <div class="signal-board">
          <div class="signal-top">
            <span>实时风险脉冲</span>
            <el-tag type="danger" effect="dark">LIVE</el-tag>
          </div>
          <div class="signal-wave">
            <span v-for="item in 18" :key="item" :style="{ animationDelay: `${item * 0.08}s` }"></span>
          </div>
          <div class="signal-grid">
            <div v-for="item in pulseCards" :key="item.label" class="pulse-card">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section-nav soft-panel" v-scroll-reveal="{ delay: 80, once: true }">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="section-link"
        :class="{ active: activeSection === section.id }"
        @click="scrollToSection(section.id)"
      >
        <span>{{ section.label }}</span>
      </button>
      <el-tag type="info" effect="plain">更新时间：{{ updateTime }}</el-tag>
    </div>

    <section id="overview" ref="overviewRef" class="page-section">
      <div class="section-heading" v-scroll-reveal="{ delay: 0, once: true }">
        <span class="eyebrow-label dashboard-eyebrow">Overview Metrics</span>
        <h3>核心指标总览</h3>
      </div>

      <div class="stats-grid">
        <article
          v-for="(item, index) in statistics"
          :key="item.title"
          class="stat-card section-card"
          v-scroll-reveal="{ delay: index * 90, distance: 26 }"
        >
          <div class="stat-top">
            <div>
              <p>{{ item.title }}</p>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="icon-wrap" :style="{ background: item.bgColor }">
              <el-icon :size="28" :color="item.color">
                <component :is="item.icon" />
              </el-icon>
            </div>
          </div>
          <div class="stat-bottom">
            <span :style="{ color: item.trendColor }">{{ item.trend }}</span>
            <small>{{ item.note }}</small>
          </div>
        </article>
      </div>
    </section>

    <section id="heatmap" ref="heatmapRef" class="page-section section-grid">
      <el-card class="chart-card section-card" shadow="never" v-scroll-reveal="{ delay: 40, distance: 34 }">
        <template #header>
          <div class="card-heading">
            <div>
              <strong>全国诈骗风险热力分布</strong>
              <p>地图支持拖动平移，用于查看各地区风险差异与聚集趋势。</p>
            </div>
            <div class="map-tools">
              <el-tag type="warning" effect="plain">跨区域联动</el-tag>
              <div class="map-zoom-controls">
                <el-button circle size="small" class="glass-button" @click="zoomOutMap">-</el-button>
                <el-button circle size="small" class="glass-button" @click="resetMapZoom">1:1</el-button>
                <el-button circle size="small" class="glass-button" @click="zoomInMap">+</el-button>
              </div>
            </div>
          </div>
        </template>
        <div ref="mapRef" class="china-map" v-loading="mapLoading"></div>
      </el-card>

      <div class="alert-column">
        <el-card class="section-card" shadow="never" v-scroll-reveal="{ delay: 120, distance: 34 }">
          <template #header>
            <div class="card-heading compact">
              <strong>实时风险预警流</strong>
              <p>高危事件优先显示，便于值班人员快速关注。</p>
            </div>
          </template>

          <div class="risk-stream">
            <div v-for="risk in displayRisks" :key="risk.id" class="risk-item" :class="risk.riskLevel.toLowerCase()">
              <div class="risk-header">
                <el-tag :type="getLevelTag(risk.riskLevel)" size="small">{{ risk.riskLevel }}</el-tag>
                <span class="risk-time">{{ risk.time }}</span>
              </div>
              <div class="risk-reason">{{ risk.reason }}</div>
              <div class="risk-footer">
                <span>风险评分</span>
                <b :style="{ color: getLevelColor(risk.riskLevel) }">{{ risk.riskScore }}</b>
              </div>
            </div>
          </div>
        </el-card>

        <div class="mini-brief soft-panel" v-scroll-reveal="{ delay: 170, distance: 34 }">
          <h4>当前判断</h4>
          <p>东南沿海仍是高频诈骗扩散带，预警密度和处置节奏需要持续重点关注。</p>
        </div>
      </div>
    </section>

    <section id="response" ref="responseRef" class="page-section response-section">
      <div class="section-heading" v-scroll-reveal="{ delay: 0 }">
        <span class="eyebrow-label dashboard-eyebrow">Response Flow</span>
        <h3>识别到处置的联动流程</h3>
      </div>

      <div class="response-grid">
        <article
          v-for="(step, index) in responseSteps"
          :key="step.title"
          class="response-card soft-panel"
          v-scroll-reveal="{ delay: index * 100, origin: index % 2 === 0 ? 'bottom' : 'right', distance: 28 }"
        >
          <span class="step-index">0{{ index + 1 }}</span>
          <h4>{{ step.title }}</h4>
          <p>{{ step.desc }}</p>
          <small>{{ step.meta }}</small>
        </article>
      </div>
    </section>

    <section id="command" ref="commandRef" class="page-section command-section">
      <div class="section-heading" v-scroll-reveal="{ delay: 0 }">
        <span class="eyebrow-label dashboard-eyebrow">Command Snapshot</span>
        <h3>当前协同处置摘要</h3>
      </div>

      <div class="command-layout">
        <div class="command-card soft-panel" v-scroll-reveal="{ delay: 20, distance: 30 }">
          <h4>跨部门协同状态</h4>
          <div class="command-list">
            <div v-for="item in commandFeeds" :key="item.title" class="command-item">
              <strong>{{ item.title }}</strong>
              <span>{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="command-card contrast" v-scroll-reveal="{ delay: 120, distance: 30 }">
          <h4>今日处置建议</h4>
          <p>优先压制广东、浙江、江苏异常链路；对退款冒充和投资诱导两类模板开启更严格的自动拦截阈值。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, markRaw, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { User, Memo, Warning, CircleCheck } from '@element-plus/icons-vue';
import chinaMapData from '../assets/map/china.json';

const route = useRoute();
const router = useRouter();
const mapRef = ref(null);
const mapLoading = ref(false);
const updateTime = ref(new Date().toLocaleString('zh-CN', { hour12: false }));
const mapZoom = ref(1.12);
const activeSection = ref('overview');
const overviewRef = ref(null);
const heatmapRef = ref(null);
const responseRef = ref(null);
const commandRef = ref(null);
const sections = [
  { id: 'overview', label: '总览指标' },
  { id: 'heatmap', label: '热力预警' },
  { id: 'response', label: '联动处置' },
  { id: 'command', label: '指挥摘要' }
];

let mapChart = null;
let resizeHandler = null;
let sectionObserver = null;

const heroMetrics = [
  { value: '92%', label: '自动处置覆盖率' },
  { value: '31 省', label: '风险态势联动' },
  { value: '3.2s', label: '平均识别延迟' }
];

const pulseCards = [
  { value: '128', label: '待核验链路' },
  { value: '42', label: '高危预警' },
  { value: '856', label: '已处置事件' },
  { value: '17', label: '重点跟进' }
];

const statistics = ref([
  { title: '注册用户', value: '12,840', trend: '较昨日 +4.8%', note: '新增关注用户继续增长', icon: markRaw(User), color: '#1f6feb', bgColor: '#e2ecff', trendColor: '#1f6feb' },
  { title: '今日任务', value: '1,204', trend: '系统处理稳定', note: '峰值窗口维持在 11:20-13:10', icon: markRaw(Memo), color: '#0eb57e', bgColor: '#dff5e8', trendColor: '#0eb57e' },
  { title: '高危预警', value: '42', trend: '需重点跟进', note: '投资诱导类风险抬升明显', icon: markRaw(Warning), color: '#e53935', bgColor: '#ffe4e2', trendColor: '#d9322f' },
  { title: '已处置', value: '856', trend: '处置率 92%', note: '自动与人工协同效率提升', icon: markRaw(CircleCheck), color: '#f39c12', bgColor: '#fff2dc', trendColor: '#c47b07' }
]);

const responseSteps = [
  { title: '入口信号捕获', desc: '短信、链接、二维码和多模态证据统一进入识别入口。', meta: '支持实时接入与离线补录' },
  { title: '风险链路判定', desc: '结合规则、RAG 与图谱路径快速给出风险等级和证据摘要。', meta: '优先放大高危样本' },
  { title: '任务编排处置', desc: '基于策略中心自动分发核验、拦截、回访和升级动作。', meta: '保留人工接管能力' },
  { title: '协同闭环复盘', desc: '把处置结果回流到知识库和策略实验室，完成下一轮更新。', meta: '形成可追踪闭环' }
];

const commandFeeds = [
  { title: '公安联动队列', value: '08 条待回执' },
  { title: '银行止付请求', value: '14 条处理中' },
  { title: '运营商封堵链路', value: '27 条已下发' },
  { title: '知识库回流样本', value: '63 条待入库' }
];

const provinceFeatures = chinaMapData.features.filter(
  (item) => item.properties && item.properties.adcode !== 100000
);

const regionLabelOffsets = {
  北京市: [18, -10],
  天津市: [20, 0],
  上海市: [18, 10],
  重庆市: [0, 10],
  河北省: [12, 0],
  江苏省: [14, 4],
  安徽省: [8, 8],
  山东省: [10, 0],
  内蒙古自治区: [0, -10],
  甘肃省: [0, 10],
  宁夏回族自治区: [14, 0],
  青海省: [0, -6],
  西藏自治区: [0, 4],
  香港特别行政区: [24, 4],
  澳门特别行政区: [24, 14],
  台湾省: [18, 12]
};

const provinceCenterMap = provinceFeatures.reduce((acc, item) => {
  const { name, cp } = item.properties || {};
  if (name && Array.isArray(cp) && cp.length >= 2) {
    acc[name] = cp;
  }
  return acc;
}, {});

const mapData = ref([
  { name: '北京市', value: 88 }, { name: '天津市', value: 61 }, { name: '上海市', value: 76 }, { name: '重庆市', value: 58 },
  { name: '河北省', value: 52 }, { name: '山西省', value: 47 }, { name: '辽宁省', value: 64 }, { name: '吉林省', value: 43 }, { name: '黑龙江省', value: 38 },
  { name: '江苏省', value: 82 }, { name: '浙江省', value: 95 }, { name: '安徽省', value: 59 }, { name: '福建省', value: 73 }, { name: '江西省', value: 62 }, { name: '山东省', value: 74 },
  { name: '河南省', value: 67 }, { name: '湖北省', value: 71 }, { name: '湖南省', value: 69 }, { name: '广东省', value: 98 },
  { name: '广西壮族自治区', value: 56 }, { name: '海南省', value: 42 }, { name: '四川省', value: 66 }, { name: '贵州省', value: 52 },
  { name: '云南省', value: 59 }, { name: '陕西省', value: 48 }, { name: '甘肃省', value: 36 }, { name: '青海省', value: 25 },
  { name: '内蒙古自治区', value: 35 }, { name: '宁夏回族自治区', value: 29 }, { name: '新疆维吾尔自治区', value: 47 }, { name: '西藏自治区', value: 12 },
  { name: '香港特别行政区', value: 30 }, { name: '澳门特别行政区', value: 22 }, { name: '台湾省', value: 46 }
]);

const labelAlias = {
  北京市: '北京', 天津市: '天津', 河北省: '河北', 山西省: '山西', 内蒙古自治区: '内蒙古',
  辽宁省: '辽宁', 吉林省: '吉林', 黑龙江省: '黑龙江', 上海市: '上海', 江苏省: '江苏',
  浙江省: '浙江', 安徽省: '安徽', 福建省: '福建', 江西省: '江西', 山东省: '山东',
  河南省: '河南', 湖北省: '湖北', 湖南省: '湖南', 广东省: '广东', 广西壮族自治区: '广西',
  海南省: '海南', 重庆市: '重庆', 四川省: '四川', 贵州省: '贵州', 云南省: '云南',
  西藏自治区: '西藏', 陕西省: '陕西', 甘肃省: '甘肃', 青海省: '青海', 宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆', 香港特别行政区: '香港', 澳门特别行政区: '澳门', 台湾省: '台湾'
};

const tinyRegionSet = new Set(['北京市', '天津市', '上海市', '香港特别行政区', '澳门特别行政区']);

const mapSeriesData = computed(() =>
  mapData.value.map((item) => ({
    ...item,
    label: {
      fontSize: tinyRegionSet.has(item.name) ? 8 : 10
    }
  }))
);

const mapLabelPoints = computed(() =>
  mapData.value
    .map((item) => {
      const cp = provinceCenterMap[item.name];
      if (!cp) return null;

      return {
        name: item.name,
        value: cp,
        label: {
          formatter: labelAlias[item.name] || item.name,
          fontSize: tinyRegionSet.has(item.name) ? 8 : 10,
          color: '#2e435a',
          fontWeight: 500,
          textBorderColor: 'rgba(255, 255, 255, 0.72)',
          textBorderWidth: 2
        },
        symbolOffset: regionLabelOffsets[item.name] || [0, 0]
      };
    })
    .filter(Boolean)
);

const displayRisks = computed(() => [
  { id: 1, riskLevel: 'HIGH', riskScore: 98, reason: '广东地区检测到批量短信钓鱼诈骗，存在多链路跳转特征。', time: '12:01:03' },
  { id: 2, riskLevel: 'MEDIUM', riskScore: 73, reason: '福建地区出现仿冒退款通知，疑似伪造客服流程。', time: '12:03:18' },
  { id: 3, riskLevel: 'HIGH', riskScore: 89, reason: '浙江投资返利话术短时激增，疑似扩散到社交引流链路。', time: '12:05:42' },
  { id: 4, riskLevel: 'LOW', riskScore: 25, reason: '青海地区当前风险较低，仅检测到零散可疑样本。', time: '12:08:09' }
]);

const initMap = async () => {
  if (!mapRef.value) return;
  mapLoading.value = true;
  await nextTick();

  try {
    echarts.registerMap('china', {
      type: 'FeatureCollection',
      features: provinceFeatures
    });
    mapChart = echarts.init(mapRef.value);
    renderMap();
  } finally {
    mapLoading.value = false;
  }
};

const renderMap = () => {
  if (!mapChart) return;

  mapChart.setOption({
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      transitionDuration: 0,
      extraCssText: 'pointer-events:none; will-change: transform;',
      formatter(params) {
        return `<div style="font-weight:600;">${params.name}</div><div>诈骗风险指数：${params.value || 0}</div>`;
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      left: 12,
      bottom: 12,
      text: ['高风险', '低风险'],
      calculable: true,
      itemHeight: 160,
      textStyle: { color: '#5c7088' },
      inRange: { color: ['#e8f2ff', '#9fc9ff', '#5ea2ff', '#f7c25f', '#ff8d89', '#df3b36'] }
    },
    geo: {
      map: 'china',
      roam: 'move',
      zoom: mapZoom.value,
      layoutCenter: ['50%', '52%'],
      layoutSize: '122%',
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        label: { show: false },
        itemStyle: { areaColor: '#ffd67d' }
      }
    },
    series: [
      {
        name: '诈骗风险',
        type: 'map',
        geoIndex: 0,
        label: {
          show: false
        },
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: '#ffd67d' }
        },
        data: mapSeriesData.value
      },
      {
        name: '鍖哄煙鏍囨敞',
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        silent: true,
        symbol: 'circle',
        symbolSize: 1,
        zlevel: 3,
        tooltip: { show: false },
        label: {
          show: true,
          position: 'inside'
        },
        itemStyle: {
          color: 'transparent'
        },
        emphasis: {
          disabled: true
        },
        data: mapLabelPoints.value
      }
    ]
  }, true);
};

const updateMapZoom = (nextZoom) => {
  const normalizedZoom = Math.min(2.4, Math.max(0.9, Number(nextZoom.toFixed(2))));
  mapZoom.value = normalizedZoom;
  renderMap();
};

const zoomInMap = () => {
  updateMapZoom(mapZoom.value + 0.18);
};

const zoomOutMap = () => {
  updateMapZoom(mapZoom.value - 0.18);
};

const resetMapZoom = () => {
  updateMapZoom(1.12);
};

const scrollToSection = (id) => {
  const target = document.getElementById(id);
  if (!target) return;
  activeSection.value = id;
  router.replace({ path: route.path, hash: `#${id}` });
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const syncHashSection = () => {
  const hash = route.hash.replace('#', '');
  if (hash && sections.some((item) => item.id === hash)) {
    setTimeout(() => {
      scrollToSection(hash);
    }, 120);
  }
};

const createSectionObserver = () => {
  sectionObserver?.disconnect();
  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) {
        activeSection.value = visible.target.id;
      }
    },
    { threshold: [0.25, 0.55, 0.8] }
  );

  [overviewRef.value, heatmapRef.value, responseRef.value, commandRef.value]
    .filter(Boolean)
    .forEach((item) => sectionObserver.observe(item));
};

watch(() => route.hash, syncHashSection);

onMounted(async () => {
  await initMap();
  await nextTick();
  createSectionObserver();
  syncHashSection();

  resizeHandler = () => {
    mapChart?.resize();
  };

  window.addEventListener('resize', resizeHandler);

  mapRef.value?.addEventListener('wheel', handleMapWheel, { passive: false });
});

onUnmounted(() => {
  mapChart?.dispose();
  sectionObserver?.disconnect();
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  mapRef.value?.removeEventListener('wheel', handleMapWheel);
});

const getLevelTag = (level) => ({ HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }[level] || 'info');
const getLevelColor = (level) => ({ HIGH: '#e53935', MEDIUM: '#f39c12', LOW: '#0eb57e' }[level] || '#5c7088');
const handleMapWheel = (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  updateMapZoom(mapZoom.value + (event.deltaY < 0 ? 0.12 : -0.12));
};
</script>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 24px;
  align-items: center;
}

.hero-actions,
.hero-kpis,
.signal-top,
.signal-grid,
.section-nav,
.section-heading,
.card-heading,
.risk-header,
.risk-footer,
.command-layout {
  display: flex;
}

.hero-actions,
.hero-kpis,
.signal-grid,
.command-layout {
  gap: 14px;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.dashboard-eyebrow {
  font-size: 10px;
  letter-spacing: 0.12em;
}

.dashboard-title {
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1.14;
}

.hero-actions {
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-kpis {
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-kpi {
  min-width: 148px;
  padding: 16px 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 205, 120, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(245, 249, 255, 0.82));
  border: 1px solid rgba(220, 230, 241, 0.88);
  box-shadow: 0 18px 34px rgba(16, 35, 58, 0.08);
}

.hero-kpi strong,
.hero-kpi span {
  display: block;
}

.hero-kpi strong {
  font-size: 22px;
}

.hero-kpi span {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.hero-stage {
  position: relative;
  z-index: 1;
}

.signal-board {
  padding: 24px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(9, 31, 58, 0.96), rgba(13, 46, 84, 0.92));
  color: #fff;
  box-shadow: 0 26px 60px rgba(10, 27, 51, 0.22);
}

.signal-top {
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.signal-wave {
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  align-items: end;
  gap: 8px;
  height: 120px;
  margin-bottom: 24px;
}

.signal-wave span {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, #78b3ff, #d8f1ff);
  transform-origin: center bottom;
  will-change: transform, opacity;
  animation: pulseRise 1.8s ease-in-out infinite alternate;
}

.signal-wave span:nth-child(3n) {
  animation-duration: 2.2s;
}

.signal-wave span:nth-child(4n) {
  animation-duration: 1.4s;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pulse-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.pulse-card strong,
.pulse-card span {
  display: block;
}

.pulse-card strong {
  font-size: 24px;
}

.pulse-card span {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.section-nav {
  position: sticky;
  top: calc(var(--shell-nav-offset, 112px) + 6px);
  z-index: 2;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
}

.section-link {
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(180, 198, 220, 0.18);
  transition: background 0.26s ease, color 0.26s ease, box-shadow 0.26s ease;
}

.section-link.active {
  background: linear-gradient(135deg, rgba(255, 221, 159, 0.52), rgba(255, 255, 255, 0.94));
  color: var(--text-primary);
}

.section-link:hover {
  box-shadow: inset 0 0 0 1px rgba(16, 35, 58, 0.08);
}

.section-heading {
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.section-heading h3 {
  margin: 0;
  font-size: clamp(18px, 1.5vw, 24px);
  line-height: 1.18;
  font-family: 'Times New Roman', 'Songti SC', 'STSong', serif;
  letter-spacing: -0.01em;
}

.stat-card {
  padding: 22px;
}

.stat-top,
.stat-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-top p,
.stat-top strong,
.stat-bottom small {
  display: block;
}

.stat-top p {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-top strong {
  font-size: 32px;
}

.icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-bottom {
  margin-top: 18px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.stat-bottom span {
  font-size: 13px;
  font-weight: 700;
}

.stat-bottom small {
  color: var(--text-muted);
  line-height: 1.6;
}

.section-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 16px;
}

.chart-card,
.alert-column {
  min-width: 0;
  contain: layout paint;
}

.card-heading {
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.map-tools,
.map-zoom-controls {
  display: flex;
  align-items: center;
}

.map-tools {
  gap: 10px;
}

.map-zoom-controls {
  gap: 8px;
}

.card-heading.compact {
  flex-direction: column;
  align-items: flex-start;
}

.card-heading strong,
.card-heading p {
  display: block;
}

.card-heading p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.china-map {
  width: 100%;
  height: 620px;
  transform: translateZ(0);
}

.chart-card :deep(.el-card__body) {
  overflow: hidden;
}

.alert-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.risk-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--border-color);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(180deg, #fff, #f9fbff);
}

.risk-item.high {
  border-left: 4px solid #e53935;
}

.risk-item.medium {
  border-left: 4px solid #f39c12;
}

.risk-item.low {
  border-left: 4px solid #0eb57e;
}

.risk-header,
.risk-footer {
  align-items: center;
  justify-content: space-between;
}

.risk-time {
  font-size: 12px;
  color: var(--text-muted);
}

.risk-reason {
  margin: 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.75;
}

.risk-footer {
  color: var(--text-secondary);
  font-size: 13px;
}

.mini-brief {
  padding: 20px;
}

.mini-brief h4,
.command-card h4,
.response-card h4 {
  margin: 0 0 10px;
}

.mini-brief p,
.response-card p,
.command-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.response-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.response-card {
  padding: 22px;
  border-radius: 22px;
}

.step-index {
  display: inline-flex;
  min-width: 44px;
  height: 30px;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border-radius: 999px;
  background: rgba(16, 35, 58, 0.08);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.response-card small {
  display: block;
  margin-top: 14px;
  color: var(--text-muted);
}

.command-layout {
  align-items: stretch;
}

.command-card {
  flex: 1;
  padding: 24px;
  border-radius: 24px;
}

.command-card.contrast {
  color: #fff;
  background: linear-gradient(135deg, #0c2543, #124174 56%, #1f6feb);
  border: none;
  box-shadow: 0 28px 60px rgba(12, 37, 67, 0.22);
}

.command-card.contrast p {
  color: rgba(255, 255, 255, 0.84);
}

.command-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.command-item {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);
}

.command-item strong,
.command-item span {
  display: block;
}

.command-item span {
  margin-top: 8px;
  color: var(--text-secondary);
}

@keyframes pulseRise {
  from {
    transform: scaleY(0.22);
    opacity: 0.6;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .dashboard-hero,
  .section-grid,
  .response-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-nav {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .section-nav::-webkit-scrollbar {
    display: none;
  }

  .section-link {
    flex: 0 0 auto;
  }

  .signal-grid,
  .command-list,
  .command-layout {
    grid-template-columns: 1fr;
  }

  .command-layout {
    flex-direction: column;
  }

  .china-map {
    height: 480px;
  }
}
</style>
