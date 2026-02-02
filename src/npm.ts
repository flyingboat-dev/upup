import * as fs from "node:fs";

export type PackageJson = {
    deps: Record<string, string>,
    devDeps: Record<string, string>
}

export type Dependency = {
    type: 'dep' | 'devDep',
    localDep: boolean,
    name: string,
    version: string,
    versionAge: number | undefined,
    info: RegistryInfo | undefined,
    latestVersion: string | undefined;
    latestVersionAge: number | undefined;
}

export type RegistryInfo = {
    "dist-tags": Record<string, string>,
    versions: Record<string, any>[],
    time: Record<string, string>
}

export function getPackageJson(packageJsonPath: string): PackageJson {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return {
        deps: packageJson.dependencies || {},
        devDeps: packageJson.devDependencies || {}
    };
}

export function getPackageJsonDeps(packageJsonPath: string): Dependency[] {
    const packageJson = getPackageJson(packageJsonPath);
    const deps: Dependency[] = [];
    const fn = (entries: Record<string, string>, t: string) => {
        for (const [name, version] of Object.entries(entries)) {
            const localDep = version.startsWith('file:') || version.startsWith("workspace:");
            const v = localDep ? version : normalizeVersion(version);
            deps.push({
                type: t as Dependency["type"],
                localDep,
                name,
                version: v,
                versionAge: undefined,
                info: undefined,
                latestVersion: undefined,
                latestVersionAge: undefined
            });
        }
    }
    fn(packageJson.deps, 'dep');
    fn(packageJson.devDeps, 'devDep');
    return deps;
}


// remove first non digit character
export function normalizeVersion(version: string): string {
    return version.replace(/^[^0-9]/, '');
}

export async function getPkgRegistryInfo(pkg: string): Promise<RegistryInfo> {
    const url = `https://registry.npmjs.org/${pkg}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
    }
    return response.json();
}

export function getVersionReleaseDateOf(info: RegistryInfo, version: string): string | undefined {
    return info.time[version] || undefined;
}

export function getLatestVersion(info: RegistryInfo): string | undefined {
    return info["dist-tags"].latest ?? undefined;
}

export function getVersionAgeOf(info: RegistryInfo, version: string): number | undefined {
    const releaseDate = getVersionReleaseDateOf(info, version);
    return releaseDate ? Date.now() - new Date(releaseDate as string).getTime() : undefined;
}