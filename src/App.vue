<template>
  <div id="app">
    <h3 style="text-align: center; color: #666; margin: 20px 0;">股份回购组件演示</h3>

    <!-- 状态切换
    <div class="status-switch">
      <span>选择状态：</span>
      <select v-model="currentStatus" @change="updateMockData">
        <option value="plan_published">预案发布</option>
        <option value="plan_failed">预案未通过</option>
        <option value="meeting_failed">股东大会未通过</option>
        <option value="repurchase_ongoing">回购进行中</option>
        <option value="repurchase_completed">回购完成</option>
        <option value="repurchase_terminated">回购终止</option>
      </select>
    </div> -->

    <!-- 组件展示 -->
    <StockRepurchase :repurchase-list="repurchaseList" :total-count="999" @tab-change="onTabChange"
      @more-click="onMoreClick" @footer-click="onFooterClick" />
  </div>
</template>

<script>
import StockRepurchase from './components/StockRepurchase.vue'

export default {
  name: 'App',
  components: {
    StockRepurchase
  },
  data() {
    return {
      currentStatus: 'repurchase_ongoing',
      repurchaseList: [],
    }
  },
  created() {
    this.updateMockData()
  },
  methods: {
    updateMockData() {
      // 根据选择的状态生成 mock 数据
      const baseData = {
        announcementDate: '2025-07-15',
        latestAnnouncementDate: '2025-07-15',
        tags: ['集中竞价', '大宗交易', '其他'],
        planDate: '2025/04/01',
        meetingDate: '2025/04/09',
        startDate: '2025/07/15',
        endDate: '2025/12/28',
        planSummary: '计划不超过100.00元/股价格，回购不超过999.99万股',
        progressSummary: '截止2025-06-30已回购222.22万股',
        avgPrice: '75.00',
        maxPrice: '100.00',
        minPrice: '50.00',
        priceChangePercent: -55.87,
        hasMeeting: true,
        status: this.currentStatus,
      }

      // 根据状态调整数据
      if (this.currentStatus === 'plan_failed') {
        baseData.progressSummary = '预案未通过'
      } else if (this.currentStatus === 'meeting_failed') {
        baseData.progressSummary = '股东大会未通过'
      } else if (this.currentStatus === 'repurchase_terminated') {
        baseData.terminatedDate = '2025/08/01'
        baseData.progressSummary = '回购已终止'
      }

      this.repurchaseList = [
        { ...baseData },
        { ...baseData, announcementDate: '2024-10-29', latestAnnouncementDate: '2024-10-29' },
        { ...baseData, announcementDate: '2024-05-14', latestAnnouncementDate: '2024-05-14' },
        { ...baseData, announcementDate: '2024-01-01', latestAnnouncementDate: '2024-01-01' }, 
        { ...baseData, announcementDate: '2023-07-15', latestAnnouncementDate: '2023-07-15' },
      ]
    },
    onTabChange(index) {
      console.log('Tab changed to:', index)
    },
    onMoreClick() {
      console.log('More clicked')
    },
    onFooterClick() {
      console.log('Footer clicked')
    },
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  max-width: 375px;
  margin: 0 auto;
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.status-switch {
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-switch select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
</style>
