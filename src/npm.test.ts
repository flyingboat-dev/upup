import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import * as npm from "../src/npm"; // adjust if your path is different

function loadFixture<T = unknown>(fileName: string): T {
    // @ts-expect-error
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const fixturePath = path.resolve(__dirname, "../test/fixtures/registry", fileName);
    const raw = fs.readFileSync(fixturePath, "utf-8");
    return JSON.parse(raw) as T;
}

describe("npm helpers (registry fixture: eslint)", () => {
    it("getLatestVersion() returns dist-tags.latest from the registry info", () => {
        const eslintInfo = loadFixture<npm.RegistryInfo>("eslint.json");
        expect(npm.getLatestVersion(eslintInfo)).toBeTypeOf("string");
        expect(npm.getLatestVersion(eslintInfo)).toBe(eslintInfo["dist-tags"].latest);
    });

    it("getVersionReleaseDateOf() returns an ISO date string for a known version (when present)", () => {
        const eslintInfo = loadFixture<npm.RegistryInfo>("eslint.json");

        const latest = npm.getLatestVersion(eslintInfo);
        expect(latest).toBeTruthy();

        // biome-ignore lint/style/noNonNullAssertion: should not be undefined
        const releaseDate = npm.getVersionReleaseDateOf(eslintInfo, latest!);

        // Some packages might not have a time entry for every version; if present, validate shape.
        if (releaseDate) {
            expect(releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        } else {
            expect(releaseDate).toBeUndefined();
        }
    });

    it("getVersionAgeOf() returns a non-negative number when a release date exists", () => {
        const eslintInfo = loadFixture<npm.RegistryInfo>("eslint.json");
        const latest = npm.getLatestVersion(eslintInfo);
        expect(latest).toBeTruthy();

        // biome-ignore lint/style/noNonNullAssertion: should not be undefined
        const age = npm.getVersionAgeOf(eslintInfo, latest!);

        if (age !== undefined) {
            expect(age).toBeTypeOf("number");
            expect(age).toBeGreaterThanOrEqual(0);
        } else {
            expect(age).toBeUndefined();
        }
    });

    it("mocks getPkgRegistryInfo() and uses the eslint fixture as returned data", async () => {
        const eslintInfo = loadFixture<npm.RegistryInfo>("eslint.json");

        const spy = vi.spyOn(npm, "getPkgRegistryInfo").mockResolvedValue(eslintInfo);

        // Example “consumer” logic inside the test: call getPkgRegistryInfo then derive latest version.
        const getLatestFromRegistry = async (pkg: string) => {
            const info = await npm.getPkgRegistryInfo(pkg);
            return npm.getLatestVersion(info);
        };

        await expect(getLatestFromRegistry("eslint")).resolves.toBe(eslintInfo["dist-tags"].latest);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("eslint");

        spy.mockRestore();
    });
});
