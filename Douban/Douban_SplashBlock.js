/**
 * Douban_SplashBlock.js
 * 目标：把开屏广告配置接口返回改成“无广告”/“立即跳过”
 * 命中：/v2/app_ads/splash_preload | /splash_bid | /splash_statistics
 */

function isObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function killSplashAds(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) obj[i] = killSplashAds(obj[i]);
    return obj;
  }
  if (!isObject(obj)) return obj;

  // 1) 直接命中常见“开屏容器”字段：置空（保留字段存在，避免客户端校验报错）
  const directKeys = [
    "splash", "splash_ad", "splash_ads", "splashAds",
    "startup", "startup_ad", "launch", "launch_ad",
    "ads", "ad", "ad_list", "adList", "items", "creatives", "creative"
  ];

  for (const k of directKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      if (Array.isArray(obj[k])) obj[k] = [];
      else if (isObject(obj[k])) obj[k] = {};
      else obj[k] = null;
    }
  }

  // 2) 常见“跳过/时长/展示控制”字段：强制可跳过、时长=0
  const boolKeys = ["skip", "skippable", "can_skip", "canSkip", "enable", "enabled", "show", "display"];
  for (const k of boolKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === "boolean") {
      obj[k] = false; // 这里统一关展示；若你更想“允许跳过”，可改成 true（按字段语义）
    }
  }

  const numKeys = ["duration", "show_time", "showTime", "time", "timeout", "ttl"];
  for (const k of numKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === "number") {
      obj[k] = 0;
    }
  }

  // 3) 递归清洗子节点
  for (const key of Object.keys(obj)) {
    obj[key] = killSplashAds(obj[key]);
  }

  return obj;
}

let body = $response.body;

try {
  // 有些返回是 gzip/br 解压后 Loon 已给明文；不是 JSON 就直接放行
  const data = JSON.parse(body);

  // 顶层做一次清洗
  const cleaned = killSplashAds(data);

  // 额外：对开屏接口更激进一点——塞一个“明显无广告”的空结构（如果服务器返回结构很奇怪，递归清洗仍可兜底）
  const url = ($request && $request.url) ? $request.url : "";

  if (/\/v2\/app_ads\/splash_(preload|bid)/.test(url)) {
    // 尽量不破坏已有字段，只补/改“看起来像广告列表”的字段为空
    if (isObject(cleaned)) {
      if (Array.isArray(cleaned.ads)) cleaned.ads = [];
      if (Array.isArray(cleaned.items)) cleaned.items = [];
      if (Array.isArray(cleaned.splash_ads)) cleaned.splash_ads = [];
      if (isObject(cleaned.splash)) cleaned.splash = {};
    }
  }

  body = JSON.stringify(cleaned);
} catch (e) {
  // 非 JSON：不动
}

$done({ body });
