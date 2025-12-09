<template>
  <div class="stock-repurchase">
    <!-- 头部 -->
    <div class="header">
      <span class="title">股份回购</span>
      <span class="more" @click="handleMoreClick">更多 &gt;</span>
    </div>

    <!-- 日期切换 - 使用 atom-tabs -->
    <atom-tabs v-model="activeIndex" :isFull="true" type="card" class="date-tabs" @change="handleTabChange">
      <atom-tab v-for="(item, index) in repurchaseList" :key="index" :title="item.announcementDate" :name="index" />
    </atom-tabs>

    <!-- 渐变背景区域 -->
    <div class="gradient-section">
      <!-- 公告信息 -->
      <div class="announcement-info">
        <span class="label">最新公告日：</span>
        <span class="date">{{ currentData.latestAnnouncementDate }}</span>
        <div class="tags">
          <atom-tag v-for="tag in currentData.tags" :key="tag" color="#00000014" textColor="#00000099"
            :type="getTagType(tag)">
            {{ tag }}
          </atom-tag>
        </div>
      </div>

      <!-- 进度时间轴 -->
      <div class="progress-timeline">
        <div class="timeline-container">
          <!-- 时间线节点 -->
          <div v-for="(step, index) in timelineSteps" :key="step.key" class="timeline-step"
            :class="{ 'is-active': step.isActive, 'is-completed': step.isCompleted, 'is-failed': step.isFailed }">
            <!-- 日期标签（上方） -->
            <div class="step-date" :class="{ 'text-failed': step.isFailed }">{{ step.date || '' }}</div>

            <!-- 节点圆点和连接线容器 -->
            <div class="step-dot-container">
              <div class="step-dot" :class="getDotClass(step)">
                <span v-if="step.isCompleted && !step.isFailed" class="dot-inner"></span>
              </div>
              <!-- 连接线 -->
              <div v-if="index < timelineSteps.length - 1" class="step-line" :class="getLineClass(step, index)"></div>
            </div>

            <!-- 节点名称（下方） -->
            <div class="step-name" :class="{ 'text-failed': step.isFailed }">{{ step.label }}</div>
          </div>
        </div>
      </div>

      <!-- 预案/进展信息 -->
      <div class="summary-item">
        <span class="summary-label">预案</span>
        <span class="summary-text">{{ currentData.planSummary }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">进展</span>
        <span class="summary-text">{{ currentData.progressSummary }}</span>
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
    </div>

    <!-- 底部链接 - 使用 atom-notice-bar -->
    <atom-notice-bar icon="horn-open" text="近一年累计回购案数达999家" linkable class="footer-notice" :isFull="false"
      @click="handleFooterClick" />
  </div>
</template>

<script>
import { Tag as AtomTag, Tabs as AtomTabs, Tab as AtomTab, NoticeBar as AtomNoticeBar } from '@atom/atom-ui'
import '@atom/atom-icons/icons/horn-open';

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
  components: {
    AtomTag,
    AtomTabs,
    AtomTab,
    AtomNoticeBar,
  },
  props: {
    // 回购列表数据
    repurchaseList: {
      type: Array,
      default: () => [],
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
        '集中竞价': 'primary',
        '大宗交易': 'success',
        '其他': 'default',
      }
      return tagTypes[tag] || 'default'
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

/* 日期切换标签 - atom-tabs 样式覆盖 */
.date-tabs {
  margin-bottom: 16px;
}

.date-tabs ::v-deep .atom-tabs__nav {
  background: transparent;
}

.date-tabs ::v-deep .atom-tab {
  padding: 4px 12px;
  font-size: 12px;
  color: #00000099;
  background: #FFFFFF;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid #00000014;
}

.date-tabs ::v-deep .atom-tab--active {
  color: #000000D6;
  background: #0000000A;
  font-weight: 700;
}

/* 渐变背景区域 */
.gradient-section {
  background: linear-gradient(179.87deg, rgba(255, 36, 54, 0.06) 0.11%, rgba(255, 36, 54, 0) 64.34%);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #FF24360A;
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
  font-size: 12px;
  color: #666;
  font-weight: 600;
  color: #000000D6;
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
  margin: 10px 0;
  padding: 0 8px;
  border-bottom: 1px dashed #00000033;
  padding-bottom: 12px;
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

/* 日期标签（上方） */
.step-date {
  font-size: 11px;
  color: #FF2436;
  margin-bottom: 4px;
  min-height: 14px;
  text-align: center;
}

/* 圆点和连接线容器 */
.step-dot-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
  border-color: #FF2436;
  color: #FFFFFF;
}

.dot-active {
  border-color: #FF2436;
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
  top: 50%;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #ddd;
  z-index: 1;
  transform: translateY(-50%);
}

.line-completed,
.line-active {
  background: #FF2436;
}

.line-failed {
  background: #ef4444;
}

.line-pending {
  background: #ddd;
}

/* 节点名称（下方） */
.step-name {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-align: center;
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
  color: #000000D6;
  flex-shrink: 0;
  margin-right: 8px;
  font-weight: 600;
}

.summary-text {
  color: #00000099;
}

/* 价格统计 */
.price-stats {
  display: flex;
  justify-content: space-between;
  text-align: center;
  /* margin-bottom: 1px; */
  background-color: #F9F9F9;
  padding: 10px;
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

.footer-notice {
  font-size: 12px;
  --atom-notice-bar-icon-size: 14px;
  --atom-notice-bar-height: 28px;
  --atom-notice-bar-line-height: 28px;
  background: #F9F9F9;
  color: #00000066;
  gap: 4px;
  border-radius: 4px;
  padding: 8px;
  text-align: center;
  justify-items: center;
  margin-top: 8px;
}
</style>
