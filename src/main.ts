import * as fs from "node:fs";
import * as process from "node:process";
import { type OutputContext, Renderer, type RenderProps, renderDepsCompact, renderDepsTable } from "./cli.ts";
import { green, yellow } from "./cli-color.ts";
import { CliOutput, FileOutput } from "./console.ts";
import { getLatestVersion, getPackageJsonDeps, getPkgRegistryInfo, getVersionAgeOf } from "./npm.ts";

if (!process || !process.argv) {
    console.log("no process");
    process.exit(1);
}

async function run() {
    let args: string[] = process.argv;
    args = args.slice(2);

    let compact: boolean = false;
    let ci: boolean = false;
    let cwd = process.cwd();
    let outputType: "cli" | "file" = "cli";

    if (args.length > 0) {
        for (const arg of args) {
            if (arg.startsWith("--")) {
                if (arg === "--ci") {
                    ci = true;
                } else if (arg === "--compact") {
                    compact = true;
                } else if (arg === "--export-to-file") {
                    outputType = "file";
                }
            } else {
                cwd = args[0];
            }
        }
    }

    const ctx: OutputContext = {
        console: outputType === "cli" ? new CliOutput() : new FileOutput(),
        refreshInterval: 80,
    };

    console.log("Checking for packages updates ...\n");

    const pkgFile = `${cwd}/package.json`;

    if (!fs.existsSync(pkgFile)) {
        console.error(`package.json file not found at ${cwd}`);
        process.exit(1);
    }

    const props: RenderProps = {
        deps: getPackageJsonDeps(pkgFile).map((dep) => ({
            dep,
            needUpdate: false,
            status: "pending",
        })),
    };

    const renderer = new Renderer<RenderProps>((props) => {
        if (!ci) {
            console.clear();
        }
        if (compact) {
            renderDepsCompact(props.deps, ctx);
            return;
        }
        renderDepsTable(props.deps, ctx);
    });

    const ticker = ci ? null : setInterval(() => renderer.render(props), ctx.refreshInterval);

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
            if (!row.dep.versionAge) {
                row.dep.versionValid = false;
            }
            row.needUpdate = row.dep.version !== row.dep.latestVersion;
            row.status = "done";
        } catch {
            row.status = "error";
        } finally {
            // update as each finishes
            if (!ci) {
                renderer.render(props);
            }
        }
    });

    await Promise.all(tasks);

    if (ticker) {
        clearInterval(ticker);
    }
    renderer.render(props); // final render

    const nOutdated = props.deps.filter((x) => x.needUpdate).length;
    const nUpToDate = props.deps.length - nOutdated;
    ctx.console.log(`\n${yellow(`${nOutdated}`)} outdated, ${green(`${nUpToDate}`)} up to date`);

    if ("saveTo" in ctx.console) {
        (ctx.console as FileOutput).saveTo(".upup_report");
        console.log("Result saved to .upup_report");
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
