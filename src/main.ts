import * as process from "node:process";
import { getLatestVersion, getPackageJsonDeps, getPkgRegistryInfo, getVersionAgeOf } from "./npm.ts";
import { renderDepsTable, Renderer, type RenderProps } from "./cli.ts";

if (!process || !process.argv) {
    console.log("no process");
    process.exit(1);
}

let args: string[] = process.argv
args = args.slice(2);

let cwd = process.cwd();
if (args.length > 0) {
    cwd = args[0];
}

const refreshInterval = 80;

async function run() {
    const renderer = new Renderer<RenderProps>((props) => {
        console.clear();
        console.log("Checking for updates...\n");
        renderDepsTable(props.deps);
    });

    const props: RenderProps = {
        deps: getPackageJsonDeps(`${cwd}/package.json`).map((dep) => ({
            dep,
            needUpdate: false,
            status: "pending"
        }))
    };

    const ticker = setInterval(() => renderer.render(props), refreshInterval);

    const tasks = props.deps.map(async (row) => {
        try {
            if (row.dep.localDep) {
                row.dep.latestVersion = "local";
                row.status = "done";
                return;
            }
            const info = await getPkgRegistryInfo(row.dep.name);
            row.dep.latestVersion = getLatestVersion(info);
            if (row.dep.latestVersion) {
                row.dep.latestVersionAge = getVersionAgeOf(info, row.dep.latestVersion);
            }
            row.dep.versionAge = getVersionAgeOf(info, row.dep.version);
            row.needUpdate = row.dep.version !== row.dep.latestVersion;
            row.status = "done";
        } catch {
            row.status = "error";
        } finally {
            // update as each finishes
            renderer.render(props);
        }
    });

    await Promise.all(tasks);

    clearInterval(ticker);
    renderer.render(props); // final render

    const nOutdated = props.deps.filter(x => x.needUpdate).length;
    const nUpToDate = props.deps.filter(x => !x.needUpdate).length;
    console.log(`\n${nOutdated} outdated, ${nUpToDate} up to date`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});