export async function onRequest(context) {
  const { request, env } = context;
  const user = request.headers.get("X-Admin-Name");
  const pass = request.headers.get("X-Admin-Pass");

  if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.method === "GET") {
    const users = await env.DB.prepare("SELECT name, status, ban_until, created_at FROM users ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(users.results), { headers: { "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const { action, targetUser, duration } = body;
    
    if (targetUser === env.ADMIN_USER && action === 'delete') return new Response("Cannot delete admin", { status: 400 });

    if (action === "delete") await env.DB.prepare("DELETE FROM users WHERE name = ?").bind(targetUser).run();
    if (action === "ban") await env.DB.prepare("UPDATE users SET status = 'banned', ban_until = ? WHERE name = ?").bind(Date.now() + duration * 3600000, targetUser).run();
    if (action === "unban") await env.DB.prepare("UPDATE users SET status = 'active', ban_until = 0 WHERE name = ?").bind(targetUser).run();

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response("Method not allowed", { status: 405 });
}
