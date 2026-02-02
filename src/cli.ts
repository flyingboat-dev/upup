import type { Dependency } from "./npm.ts";
import { timeAgoFromAge } from "./helpers.ts";

const defaultRefreshInterval = 80;
export const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export type RenderProps = {
    deps: Row[]
}

export type Row = {
    dep: Dependency,
    status: string,
    needUpdate: boolean
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

export function renderDepsTable(rows: Row[], refreshInterval: number = defaultRefreshInterval) {
    const nDeps = rows.filter(x => x.dep.type === 'dep').length;
    const nDevDeps = rows.filter(x => x.dep.type === 'devDep').length;
    const fn = (r: Row) => {
        return {
            package: r.dep.name,
            current: r.dep.version,
            age: r.dep.localDep ? "" : r.dep.versionAge ? timeAgoFromAge(r.dep.versionAge) : spinner(refreshInterval),
            latest: r.dep.latestVersion ?? spinner(refreshInterval),
            latestAge: r.dep.localDep ? "" : r.dep.latestVersionAge ? timeAgoFromAge(r.dep.latestVersionAge) : spinner(refreshInterval),
            status: r.status === "pending" ? spinner(refreshInterval) : r.status === "done" && r.needUpdate ? "need update" : "ok",
        }
    }
    if (nDeps > 0) {
        console.log(`${nDeps} Dependencies`);
        console.table(
            rows.filter(x => x.dep.type === 'dep')
                .map((r) => fn(r))
        );
    }

    if (nDevDeps > 0) {
        console.log(`${nDevDeps} Dev Dependencies`);
        console.table(
            rows.filter(x => x.dep.type === 'devDep')
                .map((r) => fn(r))
        );
    }
}


