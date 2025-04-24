import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';

interface SearchResult {
  abn: string;
  main_name: string | null;
  other_name: string | null;
  state: string | null;
  postcode: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '';

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const dbPath = 'D:\\FIRMABLE\\db\\abn.db';
  const db = new sqlite3.Database(dbPath);

  try {
    const results: SearchResult[] = await new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT a.abn, m.name AS main_name, o.name AS other_name, addr.state, addr.postcode
        FROM abrs a
        LEFT JOIN main_entities m ON a.abn = m.abn
        LEFT JOIN other_entities o ON a.abn = o.abn
        LEFT JOIN addresses addr ON a.abn = addr.abn
        WHERE m.name LIKE ? OR o.name LIKE ?
        LIMIT 50
      `;
      const likeQuery = `%${query.toLowerCase()}%`;
      db.all(sql, [likeQuery, likeQuery], (err, rows: SearchResult[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    db.close();
    return NextResponse.json({ results });
  } catch (error: any) {
    db.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}