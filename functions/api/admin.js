export async function onRequest(context) {
  const { request, env } = context;

  // 1. 获取前端发来的身份信息
  const requestUser = request.headers.get("X-Admin-Name");
  const requestPass = request.headers.get("X-Admin-Pass");

  // 2. 【核心修改】直接对比环境变量
  // 如果前端发来的名字或密码，跟我们在后台设置的不一样，直接踢飞
  if (requestUser !== env.ADMIN_USER || requestPass !== env.ADMIN_PASS) {
    return new Response(JSON.stringify({ error: "Unauthorized: 账号或密码错误" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
    });
  }

  // --- 如果代码跑到这里，说明你是尊贵的管理员 ---

  // GET 请求：获取所有用户列表
  if (request.method === "GET") {
    // 查库是为了拿用户列表，不是为了验权
    const users = await env.DB.prepare(
      "SELECT name, status, ban_until, created_at FROM users ORDER BY created_at DESC"
    ).all();
    
    // 给数据加一个标记，告诉前端谁是管理员(虽然主要靠前端判断，这里做个辅助)
    const results = users.results.map(u => ({
        ...u,
        role: (u.name === env.ADMIN_USER) ? 'admin' : 'user'
    }));

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // POST 请求：执行操作 (禁用、删除、解禁)
  if (request.method === "POST") {
    const body = await request.json();
    const { action, targetUser, duration } = body;

    // 防止误操作删掉管理员自己
    if (targetUser === env.ADMIN_USER && action === 'delete') {
         return new Response(JSON.stringify({ error: "不能删除管理员自己" }), { status: 400 });
    }

    try {
        if (action === "delete") {
          await env.DB.prepare("DELETE FROM users WHERE name = ?").bind(targetUser).run();
        } 
        else if (action === "ban") {
          const banTime = duration ? Date.now() + duration * 3600000 : 9999999999999;
          await env.DB.prepare("UPDATE users SET status = 'banned', ban_until = ? WHERE name = ?").bind(banTime, targetUser).run();
        } 
        else if (action === "unban") {
          await env.DB.prepare("UPDATE users SET status = 'active', ban_until = 0 WHERE name = ?").bind(targetUser).run();
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
