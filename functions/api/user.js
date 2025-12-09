export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name');

  if (!name) return new Response("Missing name", { status: 400 });

  try {
    // 1. 查询用户数据 (只做这一件事，不记日志)
    const result = await env.DB.prepare(
      "SELECT data, status, ban_until FROM users WHERE name = ?"
    ).bind(name).first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 构造返回数据
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

    // 3. 保存数据 (如果有冲突则更新)
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
