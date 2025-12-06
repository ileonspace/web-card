export async function onRequestGet(context) {
  // 获取 URL 里的 name 参数，例如 ?name=admin
  const { searchParams } = new URL(context.request.url);
  const name = searchParams.get('name');

  if (!name) return new Response("Missing name", { status: 400 });

  // 去数据库查数据
  // context.env.DB 就是我们在后台绑定的那个变量
  const result = await context.env.DB.prepare(
    "SELECT data FROM users WHERE name = ?"
  ).bind(name).first();

  if (!result) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404
    });
  }

  // 返回查到的数据
  return new Response(result.data, {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  try {
    // 获取前端发来的 JSON 数据
    const input = await context.request.json();
    const { name, data } = input;

    if (!name || !data) return new Response("Missing data", { status: 400 });

    // 把数据存入数据库 (如果存在就更新，不存在就插入)
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
