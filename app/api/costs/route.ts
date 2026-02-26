import { NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Rough pricing per 1M tokens (GitHub Copilot / Anthropic rates)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4.6':    { input: 15.0, output: 75.0 },
  'claude-opus-4.5':    { input: 15.0, output: 75.0 },
  'claude-sonnet-4.5':  { input: 3.0,  output: 15.0 },
  'claude-haiku-4.5':   { input: 0.80, output: 4.0 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'gemini-3-pro-preview':  { input: 1.25, output: 5.0 },
  'gpt-5.2':            { input: 2.0,  output: 8.0 },
  'gpt-5-mini':         { input: 0.40, output: 1.60 },
  'gpt-5.2-codex':      { input: 2.0,  output: 8.0 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = PRICING[model] || { input: 1.0, output: 4.0 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export async function GET() {
  const runsDir = join(process.env.OPENCLAW_STATE || '/openclaw-state', 'cron', 'runs');

  try {
    const files = readdirSync(runsDir).filter(f => f.endsWith('.jsonl'));

    const byModel: Record<string, { input: number; output: number; runs: number; cost: number }> = {};
    const byDay: Record<string, { input: number; output: number; cost: number; runs: number }> = {};
    let totalInput = 0, totalOutput = 0, totalCost = 0, totalRuns = 0;

    for (const file of files) {
      try {
        const content = readFileSync(join(runsDir, file), 'utf-8');
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          try {
            const d = JSON.parse(line);
            if (d.action !== 'finished') continue;
            const u = d.usage || {};
            const inp = u.input_tokens || 0;
            const out = u.output_tokens || 0;
            if (inp === 0 && out === 0) continue;

            const model = d.model || 'unknown';
            const cost = estimateCost(model, inp, out);
            const day = new Date(d.ts).toISOString().slice(0, 10);

            if (!byModel[model]) byModel[model] = { input: 0, output: 0, runs: 0, cost: 0 };
            byModel[model].input += inp;
            byModel[model].output += out;
            byModel[model].runs += 1;
            byModel[model].cost += cost;

            if (!byDay[day]) byDay[day] = { input: 0, output: 0, cost: 0, runs: 0 };
            byDay[day].input += inp;
            byDay[day].output += out;
            byDay[day].cost += cost;
            byDay[day].runs += 1;

            totalInput += inp;
            totalOutput += out;
            totalCost += cost;
            totalRuns += 1;
          } catch {}
        }
      } catch {}
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayData = byDay[today] || { input: 0, output: 0, cost: 0, runs: 0 };

    // Last 7 days
    const last7 = Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .reduce((acc, [, v]) => ({ cost: acc.cost + v.cost, runs: acc.runs + v.runs }), { cost: 0, runs: 0 });

    return NextResponse.json({
      available: true,
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens: totalInput + totalOutput,
      totalInput,
      totalOutput,
      totalRuns,
      today: { cost: Math.round(todayData.cost * 100) / 100, runs: todayData.runs, tokens: todayData.input + todayData.output },
      last7Days: { cost: Math.round(last7.cost * 100) / 100, runs: last7.runs },
      breakdown: Object.entries(byModel)
        .sort((a, b) => b[1].cost - a[1].cost)
        .map(([model, v]) => ({
          model,
          tokens: v.input + v.output,
          inputTokens: v.input,
          outputTokens: v.output,
          runs: v.runs,
          cost: Math.round(v.cost * 100) / 100,
        })),
      daily: Object.entries(byDay)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, cost: Math.round(v.cost * 100) / 100, runs: v.runs, tokens: v.input + v.output })),
      timestamp: new Date().toISOString(),
      note: 'Costs are estimates based on published per-token rates. Cron jobs only — main session usage not tracked here.',
    });
  } catch {
    return NextResponse.json({
      available: false,
      message: 'Could not read cron run logs.',
      totalCost: 0, totalTokens: 0, breakdown: [], daily: [],
      timestamp: new Date().toISOString(),
    });
  }
}
