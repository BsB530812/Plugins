// lrts_splash_filter.js
// 目标：只对懒人听书的 ClientAdvertList(type=3) 响应做“温和过滤”——清空开屏广告列表，避免硬 reject 导致重试/闪屏。

(function () {
  try {
    if (!$response || !$response.body) return $done({});
    const obj = JSON.parse($response.body);

    // 兼容常见结构：{ apiStatus, status, msg, data: { list: [...] } }
    if (obj && obj.data && Array.isArray(obj.data.list)) {
      // 只移除疑似开屏/启动广告：advertType=3 或 features.fullScreen=1 这类
      obj.data.list = obj.data.list.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const advertType = item.advertType;
        const fullScreen = item.features && item.features.fullScreen;

        // 过滤条件：命中其一就剔除
        if (advertType === 3) return false;
        if (fullScreen === 1 && (advertType === 3 || advertType === 0 || advertType == null)) return false;

        return true;
      });

      // 如果你希望“type=3 全部清空”更彻底，就打开下一行（把上面 filter 改为清空）
      // obj.data.list = [];
    }

    return $done({ body: JSON.stringify(obj) });
  } catch (e) {
    // 解析失败就不动，避免影响正常功能
    return $done({});
  }
})();
