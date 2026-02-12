import { renderCompact } from "./cli-compact.ts";
import { renderTable } from "./cli-table.ts";
import type { Output } from "./console.ts";
import { getBump, timeAgoFromAge } from "./helpers.ts";
import type { Dependency } from "./npm.ts";

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export type OutputContext = {
    console: Output;
    refreshInterval: number;
};

export type Row = {
    dep: Dependency;
    status: string;
    needUpdate: boolean;
};

export interface OutputRow {
    package: string;
    current: string;
    age: string;
    latest: string;
    latestAge: string;
    status: "need update" | "ok";
    change: string;
    [key: string]: string;
}

export type RenderProps = {
    deps: Row[];
};

export class Renderer<TProps = RenderProps> {
    private readonly _renderFn: (props: TProps) => void;

    constructor(renderFn: (props: TProps) => void) {
        this._renderFn = renderFn;
    }

    public render(props: TProps) {
        this._renderFn(props);
    }
}

function spinner(ctx: OutputContext) {
    const i = Math.floor(Date.now() / ctx.refreshInterval) % spinnerFrames.length;
    return spinnerFrames[i];
}

function parseRow(r: Row, ctx: OutputContext): OutputRow {
    if (r.status === "error") {
        ctx.console.error(`Failed to fetch ${r.dep.name}`);
    }

    let age = r.dep.versionValid ? "-" : "invalid version";
    if (!r.dep.localDep && r.dep.versionValid) {
        age = r.dep.versionAge ? timeAgoFromAge(r.dep.versionAge) : spinner(ctx);
    }

    let latestAge = r.dep.localDep ? "-" : spinner(ctx);
    if (!r.dep.localDep && r.dep.latestVersionAge) {
        latestAge = timeAgoFromAge(r.dep.latestVersionAge);
    }

    const status = (
        r.status === "pending" ? spinner(ctx) : r.status === "done" && r.needUpdate ? "need update" : "ok"
    ) as OutputRow["status"];

    const change = r.needUpdate ? getBump(r.dep.version, r.dep.latestVersion ?? "") : "-";

    return {
        package: r.dep.name,
        current: r.dep.version,
        age,
        latest: r.dep.latestVersion ?? spinner(ctx),
        latestAge,
        status,
        change,
    };
}

function unwrap(rows: Row[], ctx: OutputContext): { deps: OutputRow[]; devDeps: OutputRow[] } {
    return {
        deps: rows.filter((x) => x.dep.type === "dep").map((r) => parseRow(r, ctx)),
        devDeps: rows.filter((x) => x.dep.type === "devDep").map((r) => parseRow(r, ctx)),
    };
}

function pluralDependency(n: number): string {
    return `${n} Dependenc${n === 1 ? "y" : "ies"}`;
}

export function renderDepsCompact(rows: Row[], ctx: OutputContext): void {
    const { deps, devDeps } = unwrap(rows, ctx);

    if (deps.length > 0) {
        ctx.console.log(`${pluralDependency(deps.length)}\n`);
        renderCompact(deps, ctx);
    }

    if (devDeps.length > 0) {
        if (deps.length > 0) {
            ctx.console.log("");
        }
        ctx.console.log(`${pluralDependency(devDeps.length)}\n`);
        renderCompact(devDeps, ctx);
    }
}

export function renderDepsTable(rows: Row[], ctx: OutputContext) {
    const { deps, devDeps } = unwrap(rows, ctx);

    if (deps.length > 0) {
        ctx.console.log(`${pluralDependency(deps.length)}\n`);
        renderTable(deps, ctx);
    }

    if (devDeps.length > 0) {
        if (deps.length > 0) {
            ctx.console.log("");
        }
        ctx.console.log(`${pluralDependency(devDeps.length)}\n`);
        renderTable(devDeps, ctx);
    }
}
