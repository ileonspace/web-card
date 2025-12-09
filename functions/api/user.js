export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const name = searchParams.get('name');

  // 如果没有名字，返回错误
  if (!name) return new Response("Missing name", { status: 400 });

  try {
    // 去数据库查数据
    const result = await context.env.DB.prepare(
      "SELECT data, status, ban_until FROM users WHERE name = ?"
    ).bind(name).first();

    if (!result) {
      // 没查到，返回 404
      return new Response(JSON.stringify({ error: "Not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 查到了，返回数据
    // 注意：我们将 status 和 ban_until 也合并返回，方便前端判断封禁
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

    // 写入数据库 (如果有冲突则更新)
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
