export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const name = searchParams.get('name');
  if (!name) return new Response("Missing name", { status: 400 });

  try {
    const result = await context.env.DB.prepare(
      "SELECT data FROM users WHERE name = ?"
    ).bind(name).first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    return new Response(result.data, { headers: { "Content-Type": "application/json" } });
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

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
