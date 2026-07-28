<template>
  <div class="risk-card" :class="data.riskLevel">
    <div class="card-header">
      <span class="task-id">任务ID: {{ data.taskId }}</span>
      <span class="status-tag">{{ data.riskLevel }}</span>
    </div>
    <div class="card-body">
      <p class="reason">{{ data.reason }}</p>
      <div class="score-bar">
        <span>风险评分: {{ data.riskScore }}</span>
        <div class="progress" :style="{ width: data.riskScore + '%', backgroundColor: getScoreColor(data.riskScore) }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
});

const getScoreColor = (score) => {
  if (score >= 80) return '#f56c6c';
  if (score >= 50) return '#e6a23c';
  return '#67c23a';
};
</script>

<style scoped lang="scss">
.risk-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  &.HIGH { border-top: 4px solid #f56c6c; }
  &.MEDIUM { border-top: 4px solid #e6a23c; }
  &.LOW { border-top: 4px solid #67c23a; }
}
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  .task-id { font-size: 12px; color: #909399; }
  .status-tag { font-weight: bold; }
}
.score-bar {
  margin-top: 10px;
  font-size: 12px;
  .progress { height: 4px; border-radius: 2px; transition: width 0.3s; }
}
</style>