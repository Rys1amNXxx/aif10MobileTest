<template>
  <div class="stock-repurchase">
    <!-- 头部 -->
    <div class="header">
      <span class="title">股份回购</span>
      <span class="more" @click="handleMoreClick">更多 &gt;</span>
    </div>

    <!-- 日期切换 -->
    <div class="date-tabs">
      <div
        v-for="(item, index) in repurchaseList"
        :key="index"
        :class="['date-tab', { active: activeIndex === index }]"
        @click="handleTabChange(index)"
      >
        {{ item.announcementDate }}
      </div>
    </div>

    <!-- 公告信息 -->
    <div class="announcement-info">
      <span class="label">最新公告日：</span>
      <span class="date">{{ currentData.latestAnnouncementDate }}</span>
      <div class="tags">
        <el-tag
          v-for="tag in currentData.tags"
          :key="tag"
          size="mini"
          :type="getTagType(tag)"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 进度时间轴 -->
    <div class="progress-timeline">
      <div class="timeline-container">
        <!-- 时间线节点 -->
        <div
          v-for="(step, index) in timelineSteps"
          :key="step.key"
          class="timeline-step"
          :class="{ 'is-active': step.isActive, 'is-completed': step.isCompleted, 'is-failed': step.isFailed }"
        >
          <!-- 节点圆点 -->
          <div class="step-dot" :class="getDotClass(step)">
            <span v-if="step.isCompleted && !step.isFailed" class="dot-inner"></span>
          </div>

          <!-- 连接线 -->
          <div
            v-if="index < timelineSteps.length - 1"
            class="step-line"
            :class="getLineClass(step, index)"
          ></div>

          <!-- 节点标签 -->
          <div class="step-label">
            <div class="step-date">{{ step.date || '' }}</div>
            <div class="step-name" :class="{ 'text-failed': step.isFailed }">{{ step.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预案/进展信息 -->
    <div class="summary-info">
      <div class="summary-item">
        <span class="summary-label">预案</span>
        <span class="summary-text">{{ currentData.planSummary }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">进展</span>
        <span class="summary-text">{{ currentData.progressSummary }}</span>
      </div>
    </div>

    <!-- 价格统计 -->
    <div class="price-stats">
      <div class="stat-item">
        <div class="stat-value">{{ currentData.avgPrice }}元</div>
        <div class="stat-label">回购均价</div>
        <div class="stat-extra" :class="{ negative: currentData.priceChangePercent < 0 }">
          {{ formatPercent(currentData.priceChangePercent) }}
        </div>
        <div class="stat-sub-label">较最新收盘价</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ currentData.maxPrice }}元</div>
        <div class="stat-label">最高成交价</div>
        <div class="stat-extra date">{{ currentData.startDate }}</div>
        <div class="stat-sub-label">回购起始日期</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ currentData.minPrice }}元</div>
        <div class="stat-label">最低成交价</div>
        <div class="stat-extra date">{{ currentData.endDate }}</div>
        <div class="stat-sub-label">回购截止日期</div>
      </div>
    </div>

    <!-- 底部链接 -->
    <div class="footer-link" @click="handleFooterClick">
      <span>近一年累计回购案数达{{ totalCount }}家</span>
      <span class="arrow">&gt;</span>
    </div>
  </div>
</template>

<script>
// 状态枚举
const STATUS = {
  PLAN_PUBLISHED: 'plan_published',       // 预案发布
  PLAN_FAILED: 'plan_failed',             // 预案未通过
  MEETING_PENDING: 'meeting_pending',     // 股东大会待召开
  MEETING_FAILED: 'meeting_failed',       // 股东大会未通过
  REPURCHASE_STARTED: 'repurchase_started', // 回购开始
  REPURCHASE_ONGOING: 'repurchase_ongoing', // 回购进行中
  REPURCHASE_COMPLETED: 'repurchase_completed', // 回购完成
  REPURCHASE_TERMINATED: 'repurchase_terminated', // 回购终止
}

export default {
  name: 'StockRepurchase',
  props: {
    // 回购列表数据
    repurchaseList: {
      type: Array,
      default: () => [],
    },
    // 累计回购家数
    totalCount: {
      type: Number,
      default: 999,
    },
  },
  data() {
    return {
      activeIndex: 0,
    }
  },
  computed: {
    currentData() {
      return this.repurchaseList[this.activeIndex] || {}
    },
    // 根据状态计算时间轴节点
    timelineSteps() {
      const data = this.currentData
      const status = data.status
      const steps = []

      // 基础节点：预案发布
      steps.push({
        key: 'plan',
        label: '预案发布',
        date: data.planDate,
        isActive: true,
        isCompleted: true,
        isFailed: status === STATUS.PLAN_FAILED,
      })

      // 预案未通过 - 显示终止节点
      if (status === STATUS.PLAN_FAILED) {
        steps.push({
          key: 'plan_failed',
          label: '预案未通过',
          date: '',
          isActive: false,
          isCompleted: false,
          isFailed: true,
        })
        return steps
      }

      // 股东大会节点
      const hasMeeting = data.hasMeeting !== false
      if (hasMeeting) {
        steps.push({
          key: 'meeting',
          label: '股东大会',
          date: data.meetingDate,
          isActive: status !== STATUS.PLAN_PUBLISHED,
          isCompleted: [
            STATUS.REPURCHASE_STARTED,
            STATUS.REPURCHASE_ONGOING,
            STATUS.REPURCHASE_COMPLETED,
            STATUS.REPURCHASE_TERMINATED,
          ].includes(status),
          isFailed: status === STATUS.MEETING_FAILED,
        })
      }

      // 股东大会未通过 - 显示终止节点
      if (status === STATUS.MEETING_FAILED) {
        steps.push({
          key: 'meeting_failed',
          label: '股东大会未通过',
          date: '',
          isActive: false,
          isCompleted: false,
          isFailed: true,
        })
        return steps
      }

      // 回购起始节点
      steps.push({
        key: 'start',
        label: '回购起始',
        date: data.startDate,
        isActive: [
          STATUS.REPURCHASE_STARTED,
          STATUS.REPURCHASE_ONGOING,
          STATUS.REPURCHASE_COMPLETED,
          STATUS.REPURCHASE_TERMINATED,
        ].includes(status),
        isCompleted: [
          STATUS.REPURCHASE_ONGOING,
          STATUS.REPURCHASE_COMPLETED,
          STATUS.REPURCHASE_TERMINATED,
        ].includes(status),
        isFailed: false,
      })

      // 回购截止节点
      steps.push({
        key: 'end',
        label: '回购截止',
        date: data.endDate,
        isActive: [STATUS.REPURCHASE_COMPLETED, STATUS.REPURCHASE_TERMINATED].includes(status),
        isCompleted: status === STATUS.REPURCHASE_COMPLETED,
        isFailed: false,
      })

      // 回购终止 - 添加终止节点
      if (status === STATUS.REPURCHASE_TERMINATED) {
        steps.push({
          key: 'terminated',
          label: '回购终止',
          date: data.terminatedDate,
          isActive: true,
          isCompleted: false,
          isFailed: true,
        })
      }

      return steps
    },
  },
  methods: {
    handleTabChange(index) {
      this.activeIndex = index
      this.$emit('tab-change', index)
    },
    handleMoreClick() {
      this.$emit('more-click')
    },
    handleFooterClick() {
      this.$emit('footer-click')
    },
    getTagType(tag) {
      const tagTypes = {
        '集中竞价': '',
        '大宗交易': 'success',
        '其他': 'info',
      }
      return tagTypes[tag] || 'info'
    },
    getDotClass(step) {
      if (step.isFailed) return 'dot-failed'
      if (step.isCompleted) return 'dot-completed'
      if (step.isActive) return 'dot-active'
      return 'dot-pending'
    },
    getLineClass(step, index) {
      const nextStep = this.timelineSteps[index + 1]
      if (!nextStep) return ''
      if (step.isFailed || nextStep.isFailed) return 'line-failed'
      if (step.isCompleted && nextStep.isActive) return 'line-active'
      if (step.isCompleted && nextStep.isCompleted) return 'line-completed'
      return 'line-pending'
    },
    formatPercent(value) {
      if (value == null) return '-'
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(2)}%`
    },
  },
}
</script>

<style scoped>
.stock-repurchase {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.more {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

/* 日期切换标签 */
.date-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.date-tab {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.date-tab.active {
  color: #8b5cf6;
  background: #f3e8ff;
}

/* 公告信息 */
.announcement-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.announcement-info .label {
  color: #666;
}

.announcement-info .date {
  color: #333;
}

.tags {
  display: flex;
  gap: 4px;
}

/* 进度时间轴 */
.progress-timeline {
  margin: 20px 0;
  padding: 0 8px;
}

.timeline-container {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: #fff;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dot-completed {
  border-color: #10b981;
  color: #10b981;
}

.dot-active {
  border-color: #10b981;
}

.dot-pending {
  border-color: #ddd;
}

.dot-failed {
  border-color: #ef4444;
  background: #ef4444;
}

.step-line {
  position: absolute;
  top: 5px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #ddd;
  z-index: 1;
}

.line-completed,
.line-active {
  background: #10b981;
}

.line-failed {
  background: #ef4444;
}

.line-pending {
  background: #ddd;
}

.step-label {
  margin-top: 8px;
  text-align: center;
}

.step-date {
  font-size: 11px;
  color: #8b5cf6;
  margin-bottom: 2px;
  min-height: 14px;
}

.step-name {
  font-size: 12px;
  color: #666;
}

.text-failed {
  color: #ef4444;
}

/* 摘要信息 */
.summary-info {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-label {
  color: #999;
  flex-shrink: 0;
  margin-right: 8px;
}

.summary-text {
  color: #333;
}

/* 价格统计 */
.price-stats {
  display: flex;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.stat-extra {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.stat-extra.negative {
  color: #10b981;
}

.stat-extra.date {
  color: #333;
}

.stat-sub-label {
  font-size: 11px;
  color: #999;
}

/* 底部链接 */
.footer-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.footer-link .arrow {
  color: #999;
}
</style>
