export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  if (!name) return new Response("Missing name", { status: 400 });

  try {
    // 1. 先办正事：查询用户数据
    const result = await env.DB.prepare(
      "SELECT data, status, ban_until FROM users WHERE name = ?"
    ).bind(name).first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // 2. 🔥 顺手记一笔日志 (放在 try-catch 里，绝对不影响主流程)
    try {
        const country = request.cf?.country || 'Unknown';
        const city = request.cf?.city || 'Unknown';
        const ua = request.headers.get('User-Agent') || '';
        const device = /mobile/i.test(ua) ? 'Mobile' : 'Desktop';
        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'; // 隐私保护，只用于粗略统计

        // 异步写入，不 await，让它自己慢慢跑，提高响应速度
        env.DB.prepare(
          "INSERT INTO visits (target_user, ip, country, city, device) VALUES (?, ?, ?, ?, ?)"
        ).bind(name, ip, country, city, device).run();
    } catch (logError) {
        console.error("Stats logging failed:", logError); // 仅后台记录错误，不崩前台
    }

    // 3. 返回正事数据
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

    await env.DB.prepare(
      "INSERT INTO users (name, data) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET data = ?2"
    ).bind(name, JSON.stringify(data)).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
