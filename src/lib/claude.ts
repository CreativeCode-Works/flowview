import Anthropic from "@anthropic-ai/sdk";
import type { AuditFinding } from "@/types/unified";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export async function generateAuditSummary(
  findings: AuditFinding[]
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateFallbackSummary(findings);
  }

  if (findings.length === 0) {
    return "No issues found. Your automation stack looks healthy.";
  }

  const findingsSummary = findings
    .map(
      (f) =>
        `[${f.severity.toUpperCase()}] ${f.category}: ${f.title}\n  ${f.explanation}`
    )
    .join("\n\n");

  try {
    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are an automation stack auditor. Summarize these audit findings in 2-3 plain-English paragraphs for a non-technical business owner. Focus on what's broken, what's at risk, and what to fix first. Be specific but concise. Don't use jargon.

Findings:
${findingsSummary}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    return textBlock?.text ?? generateFallbackSummary(findings);
  } catch {
    return generateFallbackSummary(findings);
  }
}

function generateFallbackSummary(findings: AuditFinding[]): string {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");

  const parts: string[] = [];

  if (errors.length > 0) {
    parts.push(
      `Found ${errors.length} critical issue${errors.length !== 1 ? "s" : ""} that need immediate attention.`
    );
  }
  if (warnings.length > 0) {
    parts.push(
      `${warnings.length} warning${warnings.length !== 1 ? "s" : ""} that could impact your business if not addressed.`
    );
  }
  if (infos.length > 0) {
    parts.push(
      `${infos.length} informational finding${infos.length !== 1 ? "s" : ""} for your awareness.`
    );
  }

  return parts.join(" ") || "Audit complete.";
}
