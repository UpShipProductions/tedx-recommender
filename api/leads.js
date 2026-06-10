import { sql } from '@vercel/postgres';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      talk_title TEXT,
      themes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, talk_title, themes, update_id } = req.body;

  if (!name && !email && !update_id) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    await ensureTable();

    if (update_id) {
      await sql`
        UPDATE leads
        SET talk_title = ${talk_title || null},
            themes = ${themes || null}
        WHERE id = ${update_id}
      `;
      return res.status(200).json({ success: true, updated: true });
    }

    const result = await sql`
      INSERT INTO leads (name, email, talk_title, themes)
      VALUES (${name}, ${email}, ${talk_title || null}, ${themes || null})
      RETURNING id
    `;

    const newId = result.rows[0].id;
    return res.status(200).json({ success: true, id: newId });
  } catch (err) {
    console.error('Leads DB error:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
}