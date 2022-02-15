declare namespace getLatestVersion {
  interface BaseOptions {
    readonly auth?: boolean
    readonly range?: string
  }
  interface WithLatestOptions extends BaseOptions {
    readonly includeLatest: true
  }
  interface Options extends BaseOptions {
    readonly includeLatest?: false
  }
  interface ResolvedVersions {
    latest: string
    inRange: string
  }
}
declare function getLatestVersion(
  pkgName: string,
  optionsOrRange?: string
): Promise<string>
declare function getLatestVersion(
  pkgName: string,
  optionsOrRange: getLatestVersion.Options
): Promise<string>
declare function getLatestVersion(
  pkgName: string,
  optionsOrRange: getLatestVersion.WithLatestOptions
): Promise<getLatestVersion.ResolvedVersions>

export = getLatestVersion