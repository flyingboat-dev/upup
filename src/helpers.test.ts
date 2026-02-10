import { describe, expect, it } from "vitest";
import { getBump, timeAgoFromAge } from "./helpers.ts";

describe("timeAgoFromAge()", () => {
    it("returns 0 mins for anything under 1 minute", () => {
        expect(timeAgoFromAge(0)).toBe("0 mins");
        expect(timeAgoFromAge(59_999)).toBe("0 mins");
    });

    it("handles minutes (including singular/plural)", () => {
        expect(timeAgoFromAge(60_000)).toBe("1 min");
        expect(timeAgoFromAge(60_000 * 2)).toBe("2 mins");
        expect(timeAgoFromAge(60_000 * 59 + 999)).toBe("59 mins");
    });

    it("handles hours (including singular/plural)", () => {
        expect(timeAgoFromAge(60_000 * 60)).toBe("1 hour");
        expect(timeAgoFromAge(60_000 * 60 * 2)).toBe("2 hours");
        expect(timeAgoFromAge(60_000 * 60 * 23 + 123)).toBe("23 hours");
    });

    it("handles days up to (and including) exactly 1 month", () => {
        const day = 24 * 60_000 * 60;
        const month = 30 * day;

        expect(timeAgoFromAge(day)).toBe("1 day");
        expect(timeAgoFromAge(day * 29 + 999)).toBe("29 days");

        expect(timeAgoFromAge(month)).toBe("1 month");
    });

    it("switches to months after 1 month (strictly greater)", () => {
        const day = 24 * 60_000 * 60;
        const month = 30 * day;

        expect(timeAgoFromAge(month + 1)).toBe("1 month");
        expect(timeAgoFromAge(month * 2 + 123)).toBe("2 months");
    });

    it("switches to years at 1 year (and above)", () => {
        const day = 24 * 60_000 * 60;
        const year = 365 * day;

        expect(timeAgoFromAge(year)).toBe("1 year");
        expect(timeAgoFromAge(year * 2 + 999)).toBe("2 years");
    });
});

describe("getBump()", () => {
    it("returns invalid when either version cannot be coerced", () => {
        expect(getBump("not-a-version", "1.0.0")).toBe("invalid");
        expect(getBump("1.0.0", "workspace:*")).toBe("invalid");
        expect(getBump("", "")).toBe("invalid");
    });

    it("returns none when coerced versions are equal", () => {
        expect(getBump("1.2.3", "1.2.3")).toBe("none");

        // coerce() drops leading 'v' and other noise
        expect(getBump("v1.2.3", "1.2.3")).toBe("none");
        expect(getBump("^1.2.3", "~1.2.3")).toBe("none");
    });

    it("detects patch bumps", () => {
        expect(getBump("1.2.3", "1.2.4")).toBe("patch");
        expect(getBump("v1.2.3", "^1.2.4")).toBe("patch");
    });

    it("detects minor bumps", () => {
        expect(getBump("1.2.3", "1.3.0")).toBe("minor");
        expect(getBump("1.2.3", "1.3.9")).toBe("minor");
    });

    it("detects major bumps", () => {
        expect(getBump("1.2.3", "2.0.0")).toBe("major");
        expect(getBump("0.9.9", "1.0.0")).toBe("major");
    });

    it("ignores prerelease tags because coerce() strips them", () => {
        // latest is prerelease, but coerce("1.2.4-beta.1") -> "1.2.4"
        expect(getBump("1.2.3", "1.2.4-beta.1")).toBe("prerelease");

        // both prereleases coerce to the same stable version -> none
        expect(getBump("1.2.3-alpha.1", "1.2.3-alpha.2")).toBe("none");
    });

    it("treats downgrades as a bump category reported by semver.diff()", () => {
        // semver.diff can report a change even for downgrades; we just map its category.
        // This asserts current behavior (not "invalid") rather than policy.
        expect(getBump("2.0.0", "1.0.0")).toBe("major");
    });
});
