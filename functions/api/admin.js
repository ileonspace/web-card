export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 权限验证中间件 (简易版)
  // 也就是：无论你想干什么，先证明你是管理员
  const adminName = request.headers.get("X-Admin-Name");
  const adminPass = request.headers.get("X-Admin-Pass");

  if (!adminName || !adminPass) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 查库验证身份
  const adminUser = await env.DB.prepare(
    "SELECT role FROM users WHERE name = ? AND data LIKE ?"
  ).bind(adminName, `%"${adminPass}"%`).first(); 
  // 注意：这里偷了个懒利用 data 里的 password 字段验证，正式项目建议分开存密码

  if (!adminUser || adminUser.role !== 'admin') {
    return new Response("Forbidden: You are not admin", { status: 403 });
  }

  // --- GET 请求：获取所有用户列表 ---
  if (request.method === "GET") {
    const users = await env.DB.prepare(
      "SELECT name, role, status, ban_until, created_at FROM users ORDER BY created_at DESC"
    ).all();
    return new Response(JSON.stringify(users.results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // --- POST 请求：执行操作 (禁用、删除、重置) ---
  if (request.method === "POST") {
    const body = await request.json();
    const { action, targetUser, duration } = body;

    if (action === "delete") {
      await env.DB.prepare("DELETE FROM users WHERE name = ?").bind(targetUser).run();
    } 
    
    else if (action === "ban") {
      // 禁用时长 (小时转毫秒)，0代表永久
      const banTime = duration ? Date.now() + duration * 3600000 : 9999999999999;
      await env.DB.prepare(
        "UPDATE users SET status = 'banned', ban_until = ? WHERE name = ?"
      ).bind(banTime, targetUser).run();
    } 
    
    else if (action === "unban") {
      await env.DB.prepare(
        "UPDATE users SET status = 'active', ban_until = 0 WHERE name = ?"
      ).bind(targetUser).run();
    }

    else if (action === "reset_pass") {
        // 重置密码逻辑比较复杂，这里演示简单重置为 "123456"
        // 实际需要解析 JSON 修改里面的密码字段，这里作为示例暂略
        // 建议直接删除用户让其重新注册
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
