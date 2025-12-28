'use strict';
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });

const app = express();
// enable CORS for all origins to allow frontend to fetche
app.use(cors());

app.get('/metrics', async (_req, res) => {
  try {
    const metricsLastRunRes = await pool.query('SELECT value FROM stats WHERE key=$1', ['metrics_last_run']);
    const lastClaimTsRes = await pool.query('SELECT value FROM stats WHERE key=$1', ['last_claim_ts']);
    const lastClaimLamportsRes = await pool.query('SELECT value FROM stats WHERE key=$1', ['last_claim_lamports']);

    const metricsLastRunData = metricsLastRunRes.rows[0] ? JSON.parse(metricsLastRunRes.rows[0].value) : {};
    const lastClaimTsValue = lastClaimTsRes.rows[0]?.value ?? null;
    const lastClaimLamportsValue = lastClaimLamportsRes.rows[0]?.value ?? null;

    res.json({
      // Data from 'metrics_last_run'
      runTimestamp: metricsLastRunData.ts,
      holdersProcessed: metricsLastRunData.holdersProcessed,
      batchesSent: metricsLastRunData.batchesSent,
      subRequests: metricsLastRunData.subRequests, // Assuming this was also part of metrics_last_run

      // Data from 'last_claim_ts' and 'last_claim_lamports'
      lastClaimTimestamp: lastClaimTsValue ? parseInt(lastClaimTsValue, 10) : null,
      lastClaimLamports: lastClaimLamportsValue ? parseInt(lastClaimLamportsValue, 10) : 0,
    });
  } catch (e) {
    console.error("Error fetching /metrics:", e); // Log the actual error
    res.status(500).json({ error: 'failed to fetch metrics' });
  }
});

app.get('/logs', async (_req, res) => {
  try {
    const r = await pool.query('select json from claim_logs order by ts desc limit 100');
    res.json(r.rows.map((row: any) => row.json));
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log('Health server listening on', port)); 