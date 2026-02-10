import semver from "semver";

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const month = 30 * day;
const year = 365 * day;

function plural(n: number, unit: string): string {
    return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

export function timeAgoFromAge(ts: number): string {
    if (ts < minute) {
        return plural(0, "min");
    }

    if (ts < hour) {
        return plural(Math.floor(ts / minute), "min");
    }

    if (ts < day) {
        return plural(Math.floor(ts / hour), "hour");
    }

    if (ts < year) {
        if (ts > month) {
            return plural(Math.floor(ts / month), "month");
        }
        return plural(Math.floor(ts / day), "day");
    }

    return plural(Math.floor(ts / year), "year");
}

type Bump = "major" | "minor" | "patch" | "prerelease" | "none" | "invalid";

export function getBump(current: string, latest: string): Bump {
    const c = semver.coerce(current)?.version;
    const l = semver.coerce(latest)?.version;
    if (!c || !l) {
        return "invalid";
    }

    const d = semver.diff(c, l);
    if (!d) {
        return "none";
    }

    if (d === "major" || d === "premajor") return "major";
    if (d === "minor" || d === "preminor") return "minor";
    if (d === "patch" || d === "prepatch") return "patch";
    return "prerelease";
}
