import { z } from "zod";
import { organizations, signals, SIGNAL_RETENTION_DAYS } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

const category = z.enum([
  "rfp_procurement",
  "capital_project",
  "regulatory",
  "leadership_change",
  "technology",
  "financial",
  "merger_acquisition",
  "competitor",
  "other",
]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const signalItem = z.object({
  organization_id: z.string().optional().describe("Organization ID (preferred when known)"),
  organization_name: z.string().optional().describe("Exact organization name, used when organization_id isn't given"),
  signal_date: isoDate.describe("When the event happened or was published (YYYY-MM-DD)"),
  category: category.describe("Signal category"),
  score: z.number().int().min(1).max(5).describe("1 = background/FYI, 3 = notable, 5 = act now (e.g. open RFP, exec change)"),
  summary: z.string().describe("One to three sentence summary of the signal"),
  source_url: z.string().optional().describe("Link to the source article/filing; re-posting the same URL for the same org is a no-op"),
  briefing_date: isoDate.optional().describe("Date of the briefing that surfaced this (defaults to today)"),
});

export const createSignals = {
  description:
    "Post one or more market signals to the running per-organization signal history. Each item is processed independently and reports created, duplicate (same org + source_url already stored), or error. Organizations are matched by ID or exact name and are never auto-created - create missing orgs first.",
  inputSchema: {
    signals: z.array(signalItem).min(1).max(100).describe("Signals to post (max 100 per call)"),
  },
  async handler(input: any) {
    const results: any[] = [];
    let created = 0;
    let duplicates = 0;
    let errors = 0;

    for (let index = 0; index < input.signals.length; index++) {
      const item = input.signals[index];
      try {
        let organizationId: string | undefined = item.organization_id;
        if (!organizationId) {
          if (!item.organization_name) {
            throw new Error("Provide organization_id or organization_name");
          }
          const matches = await organizations.findByName(item.organization_name);
          if (matches.length === 0) {
            throw new Error(`No organization named "${item.organization_name}" - create it first or pass organization_id`);
          }
          if (matches.length > 1) {
            throw new Error(`Multiple organizations named "${item.organization_name}" - pass organization_id`);
          }
          organizationId = matches[0].id as string;
        }
        const { signal, created: wasCreated } = await signals.create({
          organization_id: organizationId,
          signal_date: item.signal_date,
          category: item.category,
          score: item.score,
          summary: item.summary,
          source_url: item.source_url,
          briefing_date: item.briefing_date,
        });
        if (wasCreated) created++;
        else duplicates++;
        results.push({ index, status: wasCreated ? "created" : "duplicate", signal_id: signal.id });
      } catch (err) {
        errors++;
        results.push({ index, status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    }

    return result({ success: errors === 0, created, duplicates, errors, results });
  },
};

export const searchSignals = {
  description:
    "Search the signal history, newest first. Use `query` for an organization name (or a word in the summary) to answer questions like \"what's going on with Avista\".",
  inputSchema: {
    query: z.string().optional().describe("Organization name or summary text to match (partial, case-insensitive)"),
    organization_id: z.string().optional().describe("Filter to one organization"),
    category: category.optional().describe("Filter by category"),
    min_score: z.number().int().min(1).max(5).optional().describe("Only signals scoring at least this"),
    since: isoDate.optional().describe("Only signals dated on or after this day (YYYY-MM-DD)"),
    briefing_date: isoDate.optional().describe("Only signals from this briefing date"),
    limit: z.number().int().optional().describe("Max rows (default 100, max 500)"),
  },
  async handler(input: any) {
    const results = await signals.search(input);
    return result({ success: true, signals: results });
  },
};

export const updateSignal = {
  description: "Update a signal - e.g. pin it so it's exempt from automatic expiry, or correct its score/category/summary.",
  inputSchema: {
    id: z.string().describe("Signal ID"),
    pinned: z.boolean().optional().describe("Pinned signals never auto-expire"),
    score: z.number().int().min(1).max(5).optional(),
    category: category.optional(),
    summary: z.string().optional(),
    source_url: z.string().optional(),
    signal_date: isoDate.optional(),
  },
  async handler(input: any) {
    const { id, ...updates } = input;
    const signal = await signals.update(id, updates);
    if (!signal) return result({ success: false, error: "Signal not found" });
    return result({ success: true, signal });
  },
};

export const deleteSignal = {
  description: `Delete a signal. (Signals also expire automatically unless pinned: score 1-2 after ${SIGNAL_RETENTION_DAYS.lowScore} days, score 3 after ${SIGNAL_RETENTION_DAYS.midScore} days, score 4-5 after ${SIGNAL_RETENTION_DAYS.highScore} days.)`,
  inputSchema: {
    id: z.string().describe("Signal ID"),
  },
  async handler(input: any) {
    const signal = await signals.remove(input.id);
    if (!signal) return result({ success: false, error: "Signal not found" });
    return result({ success: true, signal });
  },
};
