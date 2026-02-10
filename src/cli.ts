import { renderTable } from "./cli-table.ts";
import { getBump, timeAgoFromAge } from "./helpers.ts";
import type { Dependency } from "./npm.ts";

const defaultRefreshInterval = 80;
export const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export type RenderProps = {
    deps: Row[];
};

export type Row = {
    dep: Dependency;
    status: string;
    needUpdate: boolean;
};

export interface TableRow {
    package: string;
    current: string;
    age: string;
    latest: string;
    latestAge: string;
    status: string;
    change: string;
    [key: string]: string;
}

export class Renderer<TProps = RenderProps> {
    private readonly _renderFn: (props: TProps) => void;

    constructor(renderFn: (props: TProps) => void) {
        this._renderFn = renderFn;
    }

    public render(props: TProps) {
        this._renderFn(props);
    }
}

export function spinner(refreshInterval: number = defaultRefreshInterval) {
    const i = Math.floor(Date.now() / refreshInterval) % spinnerFrames.length;
    return spinnerFrames[i];
}

function renderDepsTable(rows: Row[], refreshInterval: number = defaultRefreshInterval) {
    const nDeps = rows.filter((x) => x.dep.type === "dep").length;
    const nDevDeps = rows.filter((x) => x.dep.type === "devDep").length;
    const fn = (r: Row) => {
        if (r.status === "error") {
            console.error(`Failed to fetch ${r.dep.name}`);
        }

        let age = r.dep.versionValid ? "-" : "invalid version";
        if (!r.dep.localDep && r.dep.versionValid) {
            age = r.dep.versionAge ? timeAgoFromAge(r.dep.versionAge) : spinner(refreshInterval);
        }

        let latestAge = r.dep.localDep ? "-" : spinner(refreshInterval);
        if (!r.dep.localDep && r.dep.latestVersionAge) {
            latestAge = timeAgoFromAge(r.dep.latestVersionAge);
        }

        const status =
            r.status === "pending"
                ? spinner(refreshInterval)
                : r.status === "done" && r.needUpdate
                  ? "need update"
                  : "ok";

        const change = r.needUpdate ? getBump(r.dep.version, r.dep.latestVersion ?? "") : "-";

        return {
            package: r.dep.name,
            current: r.dep.version,
            age,
            latest: r.dep.latestVersion ?? spinner(refreshInterval),
            latestAge,
            status,
            change,
        };
    };
    if (nDeps > 0) {
        console.log(`${nDeps} Dependencies`);
        renderTable(rows.filter((x) => x.dep.type === "dep").map((r) => fn(r)));
    }

    if (nDevDeps > 0) {
        if (nDeps > 0) {
            console.log("");
        }
        console.log(`${nDevDeps} Dev Dependencies`);
        renderTable(rows.filter((x) => x.dep.type === "devDep").map((r) => fn(r)));
    }
}

export default renderDepsTable;
