<template>
  <div class="monitor-page page-shell">
    <section class="hero-panel monitor-hero" v-scroll-reveal="{ delay: 30, once: true }">
      <div>
        <span class="eyebrow-label">Risk Monitoring</span>
        <h2 class="page-title">风险任务监测</h2>
        <p class="page-subtitle">统一查看任务级风险评分、判定理由、处理状态与溯源结果，便于快速筛查重点样本。</p>
      </div>
      <div class="hero-badges">
        <div class="hero-badge">
          <strong>{{ tableData.length }}</strong>
          <span>当前任务样本</span>
        </div>
        <div class="hero-badge">
          <strong>{{ highRiskCount }}</strong>
          <span>高危待关注</span>
        </div>
      </div>
    </section>

    <el-card class="filter-card section-card" shadow="never" v-scroll-reveal="{ delay: 60 }">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="任务 ID">
          <el-input v-model="filterForm.taskId" placeholder="输入 taskId 搜索" clearable />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="filterForm.riskLevel" placeholder="全部" clearable style="width: 130px">
            <el-option label="高危" value="HIGH" />
            <el-option label="中危" value="MEDIUM" />
            <el-option label="低危" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :disabled="loading" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="monitor-layout">
      <el-card class="table-card section-card" shadow="never" v-scroll-reveal="{ delay: 90 }">
        <template #header>
          <div class="table-head">
            <div>
              <strong>RAG 溯源任务列表</strong>
              <p>高危条目在滚动中保持足够辨识度。</p>
            </div>
          </div>
        </template>

        <el-table :data="filteredTableData" v-loading="loading" style="width: 100%" border stripe>
          <el-table-column prop="taskId" label="任务 ID" width="210" show-overflow-tooltip />
          <el-table-column prop="userId" label="用户 ID（脱敏）" width="190">
            <template #default="scope">
              <code>{{ scope.row.userId || '---' }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="riskScore" label="风险评分" width="110" sortable>
            <template #default="scope">
              <b :class="getScoreClass(scope.row.riskScore)">{{ scope.row.riskScore }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="判定等级" width="100">
            <template #default="scope">
              <el-tag :type="getLevelType(scope.row.riskLevel)">{{ scope.row.riskLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="判定理由" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'COMPLETED' ? 'success' : 'warning'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="scope">
              <el-button type="primary" plain size="small" @click="openDetail(scope.row)">查看溯源</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <aside class="side-brief">
        <div class="brief-card soft-panel" v-scroll-reveal="{ delay: 130 }">
          <h4>判定提示</h4>
          <p>优先关注高频话术和资金诱导类样本，必要时直接展开溯源摘要核对证据与节点树。</p>
        </div>
      </aside>
    </div>

    <el-drawer v-model="drawerVisible" title="RAG 溯源与风险路径分析" size="52%" destroy-on-close>
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions title="原始证据" :column="1" border>
          <el-descriptions-item label="提交文本" v-if="currentDetail.originText">
            {{ currentDetail.originText }}
          </el-descriptions-item>
          <el-descriptions-item label="图片证据" v-if="currentDetail.imageUrl">
            <el-image style="width: 200px" :src="currentDetail.imageUrl" :preview-src-list="[currentDetail.imageUrl]" />
          </el-descriptions-item>
        </el-descriptions>

        <div class="path-analysis soft-panel">
          <h4>Dijkstra 风险演化路径</h4>
          <div ref="pathChartRef" class="path-chart"></div>
          <el-alert
            title="该路径基于 Dijkstra 算法计算，展示风险从诱导节点到资产流失节点的演化过程。"
            type="info"
            show-icon
            :closable="false"
          />
        </div>

        <div class="node-tree soft-panel">
          <h4>BFS 抓取节点视图</h4>
          <el-tree :data="currentDetail.nodeTree" :props="{ label: 'text', children: 'children' }" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { getTaskStatus } from '../api/modules';
import { useWebsocket } from '../hooks/useWebsocket';

const loading = ref(false);
const drawerVisible = ref(false);
const pathChartRef = ref(null);
const currentDetail = ref(null);
const { latestResult } = useWebsocket();

let activeSearchController = null;
let latestSearchToken = 0;
let isPageAlive = true;

const filterForm = reactive({
  taskId: '',
  riskLevel: ''
});

const tableData = ref([
  {
    taskId: 'TASK_20260414_001',
    userId: '4201**********3456',
    riskScore: 88,
    riskLevel: 'HIGH',
    reason: '检测到高频杀猪盘话术，诱导下载非法理财 App。',
    status: 'COMPLETED',
    originText: '亲爱的，这个平台收益真的很高，我已经提现好几次了……',
    imageUrl: 'https://via.placeholder.com/200?text=Fraud+App+Icon',
    nodeTree: [{ text: 'RootView', children: [{ text: 'LinearLayout' }, { text: 'EditText: 充值金额' }] }]
  },
  {
    taskId: 'TASK_20260414_002',
    userId: '1101**********9876',
    riskScore: 45,
    riskLevel: 'MEDIUM',
    reason: '疑似仿冒银行官方客服，请求验证码。',
    status: 'PROCESSING'
  }
]);

const filteredTableData = computed(() => {
  let rows = tableData.value;
  if (filterForm.riskLevel) {
    rows = rows.filter((item) => item.riskLevel === filterForm.riskLevel);
  }
  if (filterForm.taskId.trim()) {
    rows = rows.filter((item) => item.taskId.includes(filterForm.taskId.trim()));
  }
  return rows;
});

const highRiskCount = computed(() => tableData.value.filter((item) => item.riskLevel === 'HIGH').length);
const getLevelType = (level) => ({ HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }[level] || 'info');

const getScoreClass = (score) => {
  if (score >= 80) return 'text-danger';
  if (score >= 50) return 'text-warning';
  return 'text-success';
};

const normalizeTask = (data = {}) => ({
  taskId: data.taskId,
  userId: data.userId || data.idMask || '---',
  riskScore: data.riskScore ?? 0,
  riskLevel: data.riskLevel || 'NONE',
  reason: data.reason || data.analysisText || '暂无判定说明',
  status: data.status || 'COMPLETED',
  originText: data.originText || '',
  imageUrl: data.imageUrl || '',
  nodeTree: data.nodeTree || [{ text: 'RAG 分析结果', children: [{ text: data.reason || '暂无判定说明' }] }]
});

const upsertTask = (task) => {
  const nextTask = normalizeTask(task);
  if (!nextTask.taskId) return;

  const index = tableData.value.findIndex((item) => item.taskId === nextTask.taskId);
  if (index >= 0) {
    tableData.value.splice(index, 1, { ...tableData.value[index], ...nextTask });
  } else {
    tableData.value.unshift(nextTask);
  }
};

watch(latestResult, (result) => {
  if (result?.taskId) {
    upsertTask(result);
  }
});

const handleSearch = async () => {
  const taskId = filterForm.taskId.trim();
  if (!taskId) {
    ElMessage.warning('请输入 taskId 后再查询');
    return;
  }

  activeSearchController?.abort();
  const controller = new AbortController();
  activeSearchController = controller;
  const currentSearchToken = ++latestSearchToken;
  loading.value = true;

  try {
    const res = await getTaskStatus(taskId, {
      signal: controller.signal
    });

    if (!isPageAlive || currentSearchToken !== latestSearchToken) return;

    const data = res?.data || res;
    upsertTask(data);
    ElMessage.success('查询完成');
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return;
    }

    throw error;
  } finally {
    if (activeSearchController === controller) {
      activeSearchController = null;
    }
    if (isPageAlive && currentSearchToken === latestSearchToken) {
      loading.value = false;
    }
  }
};

const resetSearch = () => {
  filterForm.taskId = '';
  filterForm.riskLevel = '';
};

const openDetail = async (row) => {
  currentDetail.value = row;
  drawerVisible.value = true;
  await nextTick();
  initPathChart();
};

const initPathChart = () => {
  if (!pathChartRef.value) return;

  const chart = echarts.init(pathChartRef.value);
  chart.setOption({
    title: { text: '风险路径演化', left: 'center', textStyle: { color: '#10233a', fontSize: 14 } },
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 50,
        roam: true,
        label: { show: true, color: '#10233a' },
        edgeSymbol: ['circle', 'arrow'],
        data: [
          { name: '诱导环节', itemStyle: { color: '#e53935' } },
          { name: '身份伪装', itemStyle: { color: '#f39c12' } },
          { name: '资产流失', itemStyle: { color: '#10233a' } }
        ],
        links: [
          { source: '诱导环节', target: '身份伪装' },
          { source: '身份伪装', target: '资产流失' }
        ],
        lineStyle: { opacity: 0.9, width: 2, curveness: 0.1 }
      }
    ]
  });
};

onBeforeUnmount(() => {
  isPageAlive = false;
  activeSearchController?.abort();
  activeSearchController = null;
});
</script>

<style scoped lang="scss">
.monitor-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.monitor-hero,
.hero-badges,
.monitor-layout,
.table-head {
  display: flex;
}

.monitor-hero {
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.hero-badges {
  gap: 14px;
}

.hero-badge {
  min-width: 150px;
  padding: 18px 20px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 121, 102, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.92));
  border: 1px solid rgba(220, 230, 241, 0.88);
  box-shadow: 0 18px 34px rgba(16, 35, 58, 0.08);
}

.hero-badge strong,
.hero-badge span {
  display: block;
}

.hero-badge strong {
  font-size: 28px;
}

.hero-badge span {
  margin-top: 8px;
  color: var(--text-secondary);
}

.filter-card,
.table-card {
  border-radius: 24px;
}

.filter-form {
  margin-bottom: -18px;
}

.monitor-layout {
  align-items: flex-start;
  gap: 16px;
}

.table-card {
  flex: 1;
}

.side-brief {
  width: 280px;
  flex: 0 0 280px;
}

.brief-card,
.path-analysis,
.node-tree {
  padding: 18px;
}

.brief-card h4,
.path-analysis h4,
.node-tree h4 {
  margin: 0 0 12px;
}

.brief-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.table-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.text-danger {
  color: #e53935;
  font-weight: 700;
}

.text-warning {
  color: #f39c12;
  font-weight: 700;
}

.text-success {
  color: #0eb57e;
  font-weight: 700;
}

.detail-content {
  padding: 2px 4px;
}

.path-analysis,
.node-tree {
  margin-top: 18px;
}

.path-chart {
  height: 300px;
  border-radius: 18px;
  border: 1px solid var(--border-color);
  background:
    radial-gradient(circle at top right, rgba(255, 192, 119, 0.16), transparent 28%),
    linear-gradient(145deg, #fbfdff, #f0f5fb);
  margin-bottom: 12px;
}

@media (max-width: 1100px) {
  .monitor-hero,
  .monitor-layout {
    flex-direction: column;
  }

  .side-brief {
    width: 100%;
    flex-basis: auto;
  }
}

@media (max-width: 992px) {
  .filter-form :deep(.el-form-item) {
    margin-right: 10px;
  }

  :deep(.el-drawer) {
    width: 100% !important;
  }
}
</style>
