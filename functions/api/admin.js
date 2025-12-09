export async function onRequest(context) {
  const { request, env } = context;
  
  // 1. 验证环境变量 (你设置的 ADMIN_USER 和 ADMIN_PASS)
  const user = request.headers.get("X-Admin-Name");
  const pass = request.headers.get("X-Admin-Pass");

  if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. GET: 获取列表
  if (request.method === "GET") {
    const users = await env.DB.prepare(
      "SELECT name, status, ban_until, created_at FROM users ORDER BY created_at DESC"
    ).all();
    return new Response(JSON.stringify(users.results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 3. POST: 操作用户
  if (request.method === "POST") {
    const body = await request.json();
    const { action, targetUser, duration } = body;

    // 保护管理员不被删除
    if (targetUser === env.ADMIN_USER && action === 'delete') {
        return new Response("Cannot delete admin", { status: 400 });
    }

    if (action === "delete") {
        await env.DB.prepare("DELETE FROM users WHERE name = ?").bind(targetUser).run();
    }
    if (action === "ban") {
        const banTime = Date.now() + (duration || 24) * 3600000;
        await env.DB.prepare("UPDATE users SET status = 'banned', ban_until = ? WHERE name = ?").bind(banTime, targetUser).run();
    }
    if (action === "unban") {
        await env.DB.prepare("UPDATE users SET status = 'active', ban_until = 0 WHERE name = ?").bind(targetUser).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
