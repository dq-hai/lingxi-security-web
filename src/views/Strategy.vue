<template>
  <div class="strategy-page page-shell">
    <section class="hero-panel strategy-hero" v-scroll-reveal="{ delay: 30, once: true }">
      <div>
        <span class="eyebrow-label">Strategy Center</span>
        <h2 class="page-title">策略研判与校验</h2>
        <p class="page-subtitle">按 Android 用户端最新接口文档支持 URL / 二维码核验、异步 RAG 分析、WebSocket 结果接收与任务状态补查。</p>
      </div>
      <div class="lab-summary">
        <div class="summary-item">
          <strong>{{ activeTab.toUpperCase() }}</strong>
          <span>当前工作区</span>
        </div>
        <div class="summary-item">
          <strong>{{ ragTask?.taskId || 'READY' }}</strong>
          <span>最近任务 ID</span>
        </div>
        <div class="summary-item">
          <strong>{{ connectionStatus }}</strong>
          <span>WebSocket 状态</span>
        </div>
      </div>
    </section>

    <el-tabs v-model="activeTab" class="lab-tabs" v-scroll-reveal="{ delay: 70 }">
      <el-tab-pane label="URL / 二维码校验" name="url">
        <el-card class="section-card" shadow="never">
          <el-form label-width="110px">
            <el-form-item label="待检测内容">
              <el-input
                v-model="urlForm.input"
                type="textarea"
                :rows="5"
                placeholder="输入可疑 URL、短信内容，或上传二维码截图"
              />
            </el-form-item>
            <el-form-item label="二维码图片">
              <el-upload
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                :on-change="handleQrChange"
                :on-remove="removeQrFile"
              >
                <el-button>选择图片</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="urlChecking" @click="handleUrlCheck">提交校验</el-button>
              <el-button @click="clearUrlResult">清空</el-button>
            </el-form-item>
          </el-form>

          <ResultPanel v-if="urlResult" :result="urlResult" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="RAG 多模态分析" name="rag">
        <el-card class="section-card" shadow="never">
          <el-form label-width="110px">
            <el-form-item label="分析文本">
              <el-input
                v-model="ragForm.text"
                type="textarea"
                :rows="5"
                placeholder="输入聊天记录、通话转写或可疑文本"
              />
            </el-form-item>
            <el-form-item label="图片证据">
              <el-upload
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                :on-change="handleImageChange"
                :on-remove="removeImageFile"
              >
                <el-button>选择图片</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item label="音频证据">
              <el-upload
                :auto-upload="false"
                :limit="1"
                accept="audio/*"
                :on-change="handleAudioChange"
                :on-remove="removeAudioFile"
              >
                <el-button>选择音频</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="ragSubmitting" @click="handleRagSubmit">提交异步分析</el-button>
              <el-button :loading="taskStatusLoading" :disabled="!ragTask?.taskId" @click="handleTaskStatusQuery">查询任务状态</el-button>
              <el-button @click="clearRag">清空</el-button>
            </el-form-item>
          </el-form>

          <div v-if="ragTask" class="result-display soft-panel">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="任务 ID">{{ ragTask.taskId }}</el-descriptions-item>
              <el-descriptions-item label="任务状态">{{ ragTask.status || 'PROCESSING' }}</el-descriptions-item>
              <el-descriptions-item label="提示">
                {{ ragTask.message || '任务已提交，请等待 WebSocket 推送结果，或使用 taskId 手动补查。' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="ragResult" class="result-display soft-panel">
            <el-alert
              :title="`RAG 结果：${ragResult.riskLevel || 'UNKNOWN'}`"
              :type="getAlertType(ragResult.riskLevel)"
              :description="ragResult.reason || '接口未返回分析理由。'"
              show-icon
              :closable="false"
            />
            <div class="rag-meta">
              <span>风险分数：{{ ragResult.riskScore ?? '--' }}</span>
              <span>时间戳：{{ formatTimestamp(ragResult.timestamp) }}</span>
            </div>
          </div>

          <div v-if="latestPushResult" class="result-display soft-panel push-result">
            <el-alert
              :title="`WebSocket 推送：${latestPushResult.riskLevel || 'UNKNOWN'}`"
              :type="getAlertType(latestPushResult.riskLevel)"
              :description="latestPushResult.reason || '推送消息未包含分析理由。'"
              show-icon
              :closable="false"
            />
            <div class="rag-meta">
              <span>任务 ID：{{ latestPushResult.taskId || '--' }}</span>
              <span>风险分数：{{ latestPushResult.riskScore ?? '--' }}</span>
              <span>时间戳：{{ formatTimestamp(latestPushResult.timestamp) }}</span>
            </div>
          </div>

          <div v-if="latestMessage" class="result-display soft-panel raw-message">
            <h4>最近一条 WebSocket 原始消息</h4>
            <pre>{{ JSON.stringify(latestMessage, null, 2) }}</pre>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="知识库 / 报告" name="report">
        <el-row :gutter="16">
          <el-col :xs="24" :lg="12">
            <el-card class="section-card" shadow="never" header="补充 RAG 知识库">
              <el-input
                v-model="knowledgeText"
                type="textarea"
                :rows="8"
                placeholder="每行一条反诈案例或风险知识"
              />
              <div class="actions">
                <el-button type="primary" :loading="knowledgeLoading" @click="handleAddKnowledge">提交知识</el-button>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :lg="12">
            <el-card class="section-card" shadow="never" header="安全报告生成">
              <el-input
                v-model="recordsText"
                type="textarea"
                :rows="8"
                placeholder='输入 JSON 数组，例如：[{"riskScore":85,"riskLevel":"HIGH","reason":"高收益投资诱导"}]'
              />
              <div class="actions">
                <el-button type="primary" :loading="reportLoading" @click="handleGenerateReport">生成报告</el-button>
              </div>
              <div v-if="reportText" class="report-output soft-panel">{{ reportText }}</div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { defineComponent, h, reactive, ref, watch } from 'vue';
import { ElAlert, ElMessage } from 'element-plus';
import { addKnowledgeData, analyzeUrl, generateReport, getTaskStatus, submitRagAnalyze } from '../api/modules';
import { useWebsocket } from '../hooks/useWebsocket';

const getAlertType = (level) => ({ HIGH: 'error', MEDIUM: 'warning', LOW: 'success', NONE: 'info' }[level] || 'info');
const extractResponseData = (response) => response?.data ?? response ?? {};
const formatTimestamp = (value) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '--');

const ResultPanel = defineComponent({
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () => h('div', { class: 'result-display soft-panel' }, [
      h(ElAlert, {
        title: `校验结果：${props.result.riskLevel || 'UNKNOWN'}`,
        type: getAlertType(props.result.riskLevel),
        description: props.result.analysisText || props.result.reason || '接口未返回分析说明。',
        showIcon: true,
        closable: false
      }),
      props.result.model ? h('p', { class: 'result-url' }, `分析模型：${props.result.model}`) : null
    ]);
  }
});

const activeTab = ref('url');
const urlChecking = ref(false);
const ragSubmitting = ref(false);
const taskStatusLoading = ref(false);
const knowledgeLoading = ref(false);
const reportLoading = ref(false);
const qrBase64 = ref('');
const imageFile = ref(null);
const audioFile = ref(null);
const urlResult = ref(null);
const ragTask = ref(null);
const ragResult = ref(null);
const latestPushResult = ref(null);
const knowledgeText = ref('');
const reportText = ref('');
const recordsText = ref(JSON.stringify([
  { riskScore: 85, riskLevel: 'HIGH', reason: '高收益投资诱导，要求下载非官方 App。' },
  { riskScore: 30, riskLevel: 'LOW', reason: '普通日常沟通，未发现明显风险。' }
], null, 2));

const { latestResult, latestMessage, connectionStatus, connect } = useWebsocket();

const urlForm = reactive({
  input: ''
});

const ragForm = reactive({
  text: ''
});

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const handleQrChange = async (uploadFile) => {
  qrBase64.value = await readFileAsBase64(uploadFile.raw);
};

const removeQrFile = () => {
  qrBase64.value = '';
};

const handleImageChange = (uploadFile) => {
  imageFile.value = uploadFile.raw;
};

const removeImageFile = () => {
  imageFile.value = null;
};

const handleAudioChange = (uploadFile) => {
  audioFile.value = uploadFile.raw;
};

const removeAudioFile = () => {
  audioFile.value = null;
};

const handleUrlCheck = async () => {
  const input = urlForm.input.trim();
  const qrCodeImage = qrBase64.value.replace(/^data:image\/\w+;base64,/, '');

  if (!input && !qrCodeImage) {
    ElMessage.warning('请输入待检测内容或上传二维码图片');
    return;
  }

  urlChecking.value = true;
  try {
    const res = await analyzeUrl({
      text: input || undefined,
      qrCodeImage: qrCodeImage || undefined
    });
    urlResult.value = extractResponseData(res);
  } finally {
    urlChecking.value = false;
  }
};

const clearUrlResult = () => {
  urlForm.input = '';
  qrBase64.value = '';
  urlResult.value = null;
};

const handleRagSubmit = async () => {
  if (!ragForm.text.trim() && !imageFile.value && !audioFile.value) {
    ElMessage.warning('请至少提供 text、imageUrl 或 audioUrl 中的一项');
    return;
  }

  const connected = await connect(true);
  if (!connected) {
    ElMessage.warning('WebSocket 未在 5 秒内连通，本次任务仍已提交，但可能收不到实时推送。');
  }

  const formData = new FormData();
  if (ragForm.text.trim()) formData.append('text', ragForm.text.trim());
  if (imageFile.value) formData.append('imageUrl', imageFile.value);
  if (audioFile.value) formData.append('audioUrl', audioFile.value);

  ragSubmitting.value = true;
  try {
    const res = await submitRagAnalyze(formData);
    ragTask.value = extractResponseData(res);
    ragResult.value = null;
    ElMessage.success(ragTask.value.message || '任务提交成功');
    if (connectionStatus.value !== 'CONNECTED') {
      ElMessage.warning(`WebSocket 当前状态为 ${connectionStatus.value}，已尝试重连，请等待推送或稍后手动补查。`);
    }
  } finally {
    ragSubmitting.value = false;
  }
};

const handleTaskStatusQuery = async () => {
  if (!ragTask.value?.taskId) {
    ElMessage.warning('当前没有可查询的 taskId');
    return;
  }

  taskStatusLoading.value = true;
  try {
    const res = await getTaskStatus(ragTask.value.taskId);
    const data = extractResponseData(res);
    ragTask.value = {
      ...ragTask.value,
      taskId: data.taskId || ragTask.value.taskId,
      status: data.status || ragTask.value.status,
      message: data.reason || ragTask.value.message
    };

    if (data.riskLevel || data.reason || data.riskScore !== undefined) {
      ragResult.value = {
        taskId: data.taskId || ragTask.value.taskId,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        reason: data.reason,
        timestamp: Date.now()
      };
    }

    ElMessage.success('任务状态已更新');
  } finally {
    taskStatusLoading.value = false;
  }
};

const clearRag = () => {
  ragForm.text = '';
  imageFile.value = null;
  audioFile.value = null;
  ragTask.value = null;
  ragResult.value = null;
  latestPushResult.value = null;
};

const handleAddKnowledge = async () => {
  const documents = knowledgeText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!documents.length) {
    ElMessage.warning('请至少输入一条知识内容');
    return;
  }

  knowledgeLoading.value = true;
  try {
    const res = await addKnowledgeData({ documents });
    const data = extractResponseData(res);
    ElMessage.success(res?.message || data?.message || `已提交 ${documents.length} 条知识`);
  } finally {
    knowledgeLoading.value = false;
  }
};

const handleGenerateReport = async () => {
  let records = [];
  try {
    records = JSON.parse(recordsText.value);
  } catch {
    ElMessage.warning('请输入合法的 JSON 数组');
    return;
  }

  if (!Array.isArray(records) || !records.length) {
    ElMessage.warning('报告记录不能为空');
    return;
  }

  reportLoading.value = true;
  try {
    const res = await generateReport({ records });
    const data = extractResponseData(res);
    reportText.value = data.report || res?.report || '接口未返回报告内容。';
  } finally {
    reportLoading.value = false;
  }
};

watch(latestResult, (value) => {
  if (!value?.taskId) return;
  latestPushResult.value = {
    taskId: value.taskId,
    riskScore: value.riskScore,
    riskLevel: value.riskLevel,
    reason: value.reason,
    timestamp: value.timestamp
  };
  if (!ragTask.value?.taskId || value.taskId !== ragTask.value.taskId) return;

  ragTask.value = {
    ...ragTask.value,
    status: 'COMPLETED',
    message: value.reason || ragTask.value.message
  };

  ragResult.value = {
    taskId: value.taskId,
    riskScore: value.riskScore,
    riskLevel: value.riskLevel,
    reason: value.reason,
    timestamp: value.timestamp
  };
});
</script>

<style scoped lang="scss">
.strategy-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.strategy-hero,
.lab-summary {
  display: flex;
}

.strategy-hero {
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.lab-summary {
  gap: 14px;
  flex-wrap: wrap;
}

.summary-item {
  min-width: 170px;
  padding: 18px 20px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 203, 109, 0.18), transparent 32%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(243, 248, 255, 0.92));
  border: 1px solid rgba(220, 230, 241, 0.88);
  box-shadow: 0 18px 34px rgba(16, 35, 58, 0.08);
}

.summary-item strong,
.summary-item span {
  display: block;
}

.summary-item strong {
  font-size: 24px;
  letter-spacing: -0.02em;
}

.summary-item span {
  margin-top: 8px;
  color: var(--text-secondary);
}

.lab-tabs {
  :deep(.el-tabs__content) {
    overflow: visible;
  }
}

.result-display {
  margin-top: 14px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(244, 248, 255, 0.92));
  border: 1px solid rgba(219, 229, 240, 0.78);
}

.result-url {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  word-break: break-all;
}

.rag-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.push-result {
  border: 1px solid rgba(31, 111, 235, 0.18);
  background:
    radial-gradient(circle at top right, rgba(99, 156, 255, 0.15), transparent 30%),
    linear-gradient(180deg, #f8fbff, #f1f7ff);
}

.raw-message h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.raw-message pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.actions {
  margin-top: 14px;
}

.report-output {
  margin-top: 14px;
  padding: 18px;
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--text-secondary);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(248, 251, 255, 0.96), rgba(240, 245, 252, 0.92));
}

@media (max-width: 1100px) {
  .strategy-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .lab-summary {
    width: 100%;
  }
}
</style>
