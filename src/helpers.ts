const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
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
        return plural(Math.floor(ts / day), "day");
    }

    return plural(Math.floor(ts / year), "year");
}
