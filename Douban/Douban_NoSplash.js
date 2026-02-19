/**
 * Douban_NoSplash.js
 * 目标：对 /v2/app_ads/splash_* 返回“无广告”响应
 * 用法：配合 Loon http-response 脚本重写
 */

(function () {
  const empty = {
    code: 0,
    msg: "ok",
    message: "ok",
    count: 0,
    total: 0,
    ads: [],
    data: [],
    items: [],
    result: []
  };

  const headers = ($response && $response.headers) ? $response.headers : {};
  headers["Content-Type"] = "application/json; charset=utf-8";

  $done({
    status: 200,
    headers,
    body: JSON.stringify(empty)
  });
})();
