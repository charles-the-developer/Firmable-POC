import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';

interface SearchResult {
  abn: string;
  name: string | null;
  state: string | null;
  postcode: string | null;
}

let db: sqlite3.Database | null = null;

// Initialize database connection (cached)
function getDb() {
  if (!db) {
    db = new sqlite3.Database('D:\\FIRMABLE\\db\\abn.db', sqlite3.OPEN_READONLY, (err) => {
      if (err) console.error('Database connection error:', err);
    });
  }
  return db;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '';

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // Basic query validation: reject overly broad queries
  if (query.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  const db = getDb();

  try {
    // Step 1: Search FTS5 tables, limit early
    const abnNameResults: { abn: string; name: string }[] = await new Promise((resolve, reject) => {
      const sql = `
        SELECT abn, name
        FROM (
          SELECT abn, name, rank
          FROM main_entities_fts
          WHERE name MATCH ?
          ORDER BY rank
          LIMIT 25
        )
        UNION
        SELECT abn, name
        FROM (
          SELECT abn, name, rank
          FROM other_entities_fts
          WHERE name MATCH ?
          ORDER BY rank
          LIMIT 25
        )
        LIMIT 50
      `;
      const searchQuery = `"${query.toLowerCase()}*"`;
      db.all(sql, [searchQuery, searchQuery], (err, rows: { abn: string; name: string }[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Step 2: Fetch addresses for matching ABNs
    const abns = abnNameResults.map((r) => r.abn);
    let addressResults: { abn: string; state: string | null; postcode: string | null }[] = [];
    if (abns.length > 0) {
      addressResults = await new Promise((resolve, reject) => {
        const placeholders = abns.map(() => '?').join(',');
        const sql = `
          SELECT abn, state, postcode
          FROM addresses
          WHERE abn IN (${placeholders})
        `;
        db.all(sql, abns, (err, rows: { abn: string; state: string | null; postcode: string | null }[]) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    }

    // Step 3: Combine results
    const results: SearchResult[] = abnNameResults.map((row) => {
      const address = addressResults.find((a) => a.abn === row.abn);
      return {
        abn: row.abn,
        name: row.name,
        state: address?.state || null,
        postcode: address?.postcode || null,
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Close database on process exit
process.on('SIGINT', () => {
  if (db) {
    db.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  }
});