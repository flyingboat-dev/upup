import type { OutputRow } from "./cli.ts";
import { bold, green, yellow } from "./cli-color.ts";

export function renderCompact(rows: OutputRow[]): void {
    console.log(compact(rows).join("\n"));
}

export function compact(rows: OutputRow[]): string[] {
    const content: string[] = [];

    for (const row of rows) {
        content.push(...block(row));
        content.push("");
    }

    return content;
}

function block(row: OutputRow): string[] {
    const content: string[] = [];
    let status = row.status as string;
    if (status === "need update") {
        status = yellow(status);
    } else if (status === "ok") {
        status = green(status);
    }
    content.push(`[${bold(row.package)}]`);
    content.push(`  status:  ${status}`);
    content.push(`  current: ${row.current} (${row.age} ago)`);
    if (row.status === "need update") {
        content.push(`  latest:  ${row.latest} (${row.latestAge} ago) change: ${row.change}`);
    }
    return content;
}
