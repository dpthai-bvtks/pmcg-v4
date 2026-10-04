const TURSO_URL = 'https://pmcg-v4-dpthai-bvtks.aws-ap-northeast-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjIzNDQsImlkIjoiMDFhMDVmOTAtY2QwMS03OTYyLTg0YjgtYzk1YWVhMTJhNWZmIiwia2lkIjoiUTh6blZSZmxiaEMyLXRIYjI0ZFhNMUVXcWtWOFRBTlJtTEE5Z01QV2pJcyIsInJpZCI6ImNhNWJhMGQwLTE0MzctNDFlOS1iNWQ0LTE3YmFiMzdjMTQ5ZCJ9.u-sW0PnXJ-a0q7EJBlIBE-FIIO85D9kpALTsiQPZhSQPBAee5RTlLUMxrIukSuSDbUMvtbb4cqDg9KWl6v5mAw';

async function check() {
  try {
    const res = await fetch(TURSO_URL, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: "SELECT month_year, data_json, updated_at FROM cham_cong WHERE month_year LIKE '%2026-10%'" } },
          { type: 'close' }
        ]
      })
    });
    console.log('Turso HTTP Status:', res.status);
    const json = await res.json();
    console.log('Turso Response:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
check();
