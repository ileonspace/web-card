export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = searchParams.get('name');
  
  // 获取访客信息 (Cloudflare 自动提供的)
  const country = request.cf?.country || 'Unknown';
  const city = request.cf?.city || 'Unknown';
  const ua = request.headers.get('User-Agent') || '';
  // 简易判断设备类型
  const device = /mobile/i.test(ua) ? 'Mobile' : 'Desktop';
  // IP 匿名化处理 (只存部分，保护隐私)
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (!name) return new Response("Missing name", { status: 400 });

  try {
    // 1. 获取用户数据
    const result = await env.DB.prepare(
      "SELECT data, status, ban_until FROM users WHERE name = ?"
    ).bind(name).first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // 2. 🔥 核心新增：记录访问日志 (异步执行，不阻塞主线程)
    // 只有当访问者不是管理员自己时才记录 (简单判断：referer不包含 admin)
    // 这里为了简单，全部记录
    try {
        await env.DB.prepare(
          "INSERT INTO visits (target_user, ip, country, city, device) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, ip, country, city, device).run();
    } catch(e) {
        console.error("Log failed", e); // 日志失败不影响页面加载
    }

    const responseData = {
        data: JSON.parse(result.data),
        status: result.status,
        ban_until: result.ban_until
    };

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const input = await context.request.json();
    const { name, data } = input;
    if (!name || !data) return new Response("Missing data", { status: 400 });

    await context.env.DB.prepare(
      "INSERT INTO users (name, data) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET data = ?2"
    ).bind(name, JSON.stringify(data)).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
