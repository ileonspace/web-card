export async function onRequest(context) {
  const { request, env } = context;
  const user = request.headers.get("X-Admin-Name");
  const pass = request.headers.get("X-Admin-Pass");

  // 只有管理员能看统计
  if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. 总访问量
    const total = await env.DB.prepare("SELECT COUNT(*) as count FROM visits").first();
    
    // 2. 今日访问
    const today = await env.DB.prepare("SELECT COUNT(*) as count FROM visits WHERE created_at >= date('now')").first();

    // 3. 最近 7 天趋势 (SQLite 语法)
    const trend = await env.DB.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM visits 
      WHERE created_at >= date('now', '-6 days') 
      GROUP BY date(created_at) 
      ORDER BY date(created_at)
    `).all();

    // 4. 设备分布
    const devices = await env.DB.prepare("SELECT device, COUNT(*) as count FROM visits GROUP BY device").all();

    // 5. 热门用户
    const topUsers = await env.DB.prepare("SELECT target_user, COUNT(*) as count FROM visits GROUP BY target_user ORDER BY count DESC LIMIT 5").all();

    return new Response(JSON.stringify({
      total: total.count,
      today: today.count,
      trend: trend.results,
      devices: devices.results,
      topUsers: topUsers.results
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
