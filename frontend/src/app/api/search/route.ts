import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';

interface SearchResult {
  abn: string;
  name: string | null;
  state: string | null;
  postcode: string | null;
}

let db: sqlite3.Database | null = null;

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
  const state = searchParams.get('state') || '';
  const entityType = searchParams.get('entityType') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  if (query.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  const offset = (page - 1) * pageSize;
  const searchQuery = `"${query.toLowerCase()}*"`;
  const db = getDb();

  try {
    const startTime = Date.now(); // Log start time for performance tracking

    // Map dropdown entityType to database entity_type_text values
    let mappedEntityType = '';
    if (entityType) {
      switch (entityType) {
        case 'Company':
          mappedEntityType = 'Australian Private Company';
          break;
        case 'Sole Trader':
          mappedEntityType = 'Individual/Sole Trader';
          break;
        case 'Partnership':
          mappedEntityType = 'Partnership';
          break;
        default:
          mappedEntityType = '';
      }
    }

    // Step 1: Determine if query is an ABN (numeric) or name
    const isNumericQuery = /^\d+$/.test(query);
    const normalizedQuery = query.replace(/\s/g, ''); // Remove spaces for ABN comparison

    let abnNameResults: { abn: string; name: string }[] = [];
    if (isNumericQuery) {
      // Search by ABN in main_entities only
      abnNameResults = await new Promise((resolve, reject) => {
        let sql = `
          SELECT m.abn as abn, m.name
          FROM main_entities m
          LEFT JOIN addresses a ON m.abn = a.abn
          LEFT JOIN entity_types et ON m.abn = et.abn
          WHERE m.abn = ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
          LIMIT ? OFFSET ?
        `;
        const params = state && mappedEntityType
          ? [normalizedQuery, state, mappedEntityType, pageSize, offset]
          : state
          ? [normalizedQuery, state, pageSize, offset]
          : mappedEntityType
          ? [normalizedQuery, mappedEntityType, pageSize, offset]
          : [normalizedQuery, pageSize, offset];

        db.all(sql, params, (err, rows: { abn: string; name: string }[]) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    } else {
      // Search by name using FTS in both tables
      abnNameResults = await new Promise((resolve, reject) => {
        let sql = `
          SELECT abn, name
          FROM (
            SELECT m.abn as abn, m.name, rank
            FROM main_entities_fts m
            LEFT JOIN addresses a ON m.abn = a.abn
            LEFT JOIN entity_types et ON m.abn = et.abn
            WHERE m.name MATCH ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
            UNION
            SELECT o.abn as abn, o.name, rank
            FROM other_entities_fts o
            LEFT JOIN addresses a ON o.abn = a.abn
            LEFT JOIN entity_types et ON o.abn = et.abn
            WHERE o.name MATCH ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
          )
          ORDER BY rank
          LIMIT ? OFFSET ?
        `;
        const params = state && mappedEntityType
          ? [searchQuery, state, mappedEntityType, searchQuery, state, mappedEntityType, pageSize, offset]
          : state
          ? [searchQuery, state, searchQuery, state, pageSize, offset]
          : mappedEntityType
          ? [searchQuery, mappedEntityType, searchQuery, mappedEntityType, pageSize, offset]
          : [searchQuery, searchQuery, pageSize, offset];

        db.all(sql, params, (err, rows: { abn: string; name: string }[]) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    }

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

    // Step 4: Get total count for pagination (approximate)
    const totalCount: number = await new Promise((resolve, reject) => {
      let countSql = '';
      let countParams: (string | number)[] = [];
      if (isNumericQuery) {
        countSql = `
          SELECT COUNT(*) as count
          FROM main_entities m
          LEFT JOIN addresses a ON m.abn = a.abn
          LEFT JOIN entity_types et ON m.abn = et.abn
          WHERE m.abn = ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
        `;
        countParams = state && mappedEntityType
          ? [normalizedQuery, state, mappedEntityType]
          : state
          ? [normalizedQuery, state]
          : mappedEntityType
          ? [normalizedQuery, mappedEntityType]
          : [normalizedQuery];
      } else {
        countSql = `
          SELECT COUNT(*) as count
          FROM (
            SELECT m.abn FROM main_entities_fts m
            LEFT JOIN addresses a ON m.abn = a.abn
            LEFT JOIN entity_types et ON m.abn = et.abn
            WHERE m.name MATCH ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
            UNION
            SELECT o.abn FROM other_entities_fts o
            LEFT JOIN addresses a ON o.abn = a.abn
            LEFT JOIN entity_types et ON o.abn = et.abn
            WHERE o.name MATCH ?${state ? ' AND a.state = ?' : ''}${mappedEntityType ? ' AND et.entity_type_text = ?' : ''}
          )
        `;
        countParams = state && mappedEntityType
          ? [searchQuery, state, mappedEntityType, searchQuery, state, mappedEntityType]
          : state
          ? [searchQuery, state, searchQuery, state]
          : mappedEntityType
          ? [searchQuery, mappedEntityType, searchQuery, mappedEntityType]
          : [searchQuery, searchQuery];
      }

      db.get(countSql, countParams, (err, row: { count: number }) => {
        if (err) reject(err);
        resolve(row.count);
      });
    });

    const endTime = Date.now(); // Log end time
    console.log(`Query "${query}" took ${endTime - startTime}ms`);

    return NextResponse.json({
      results,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

process.on('SIGINT', () => {
  if (db) {
    db.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  }
});