import { describe, expect, it, vi } from "vitest";

// Ignore styling in unit tests: we only validate content + counts
vi.mock("./cli-color.ts", () => {
    const x = (v: string): string => v;
    return { bold: x, gray: x, green: x, yellow: x };
});

import type { OutputContext } from "./cli";
import { renderTable, table, vertical } from "./cli-table.ts";

type Row = Record<string, string>;

function parseCells(line: string): string[] {
    // Expected shape: "│ cell │ cell │"
    const left = `${vertical} `;
    const right = ` ${vertical}`;

    if (!line.startsWith(left) || !line.endsWith(right)) {
        throw new Error(`Not a row line: ${line}`);
    }

    const inner = line.slice(left.length, line.length - right.length);
    return inner.split(` ${vertical} `).map((c) => c.trim());
}

describe("cli-table: table()", () => {
    it("throws on empty input", () => {
        expect(() => table([] as any)).toThrow();
    });

    it("renders correct header/body content and correct row+cell counts", () => {
        const rows: Row[] = [
            { package: "a", current: "1.0.0", latest: "1.0.1", status: "need update" },
            { package: "bbbb", current: "1.0.0", latest: "1.0.0", status: "ok" },
        ];

        const lines = table(rows as any);

        // Layout: top, header, middle, ...bodyRows, bottom
        expect(lines.length).toBe(rows.length + 4);

        const headerCells = parseCells(lines[1]);
        expect(headerCells).toEqual(["package", "current", "latest", "status"]);
        expect(headerCells.length).toBe(Object.keys(rows[0]).length);

        const bodyLines = lines.slice(3, 3 + rows.length);
        expect(bodyLines.length).toBe(rows.length);

        for (let i = 0; i < rows.length; i++) {
            const cells = parseCells(bodyLines[i]);

            // same number of cells as headers
            expect(cells.length).toBe(headerCells.length);

            // values appear in header order
            expect(cells).toEqual([rows[i].package, rows[i].current, rows[i].latest, rows[i].status]);
        }
    });

    it("keeps placeholder values like '-' as literal content (no styling assertions)", () => {
        const rows: Row[] = [{ package: "-", current: "-", latest: "-", status: "ok" }];

        const lines = table(rows as any);
        expect(lines.length).toBe(5); // top + header + middle + 1 row + bottom

        const bodyCells = parseCells(lines[3]);
        expect(bodyCells).toEqual(["-", "-", "-", "ok"]);
        expect(bodyCells.length).toBe(4);
    });
});

describe("cli-table: renderTable()", () => {
    it("prints exactly the table lines joined with newlines", () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const rows: Row[] = [{ package: "pkg", current: "1", latest: "2", status: "ok" }];
        const ctx: OutputContext = {
            console: console,
            refreshInterval: 80,
        };

        renderTable(rows as any, ctx);

        expect(logSpy).toHaveBeenCalledTimes(1);
        const printed = String(logSpy.mock.calls[0]?.[0] ?? "");
        expect(printed).toBe(table(rows as any).join("\n"));

        logSpy.mockRestore();
    });
});
