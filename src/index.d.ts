export interface BaseOptions {
  readonly auth?: boolean
  readonly range?: string
  readonly registryUrl?: string
}
export interface WithLatestOptions extends BaseOptions {
  readonly includeLatest: true
}
export interface Options extends BaseOptions {
  readonly includeLatest?: false
}
export interface ResolvedVersions {
  latest: string
  inRange: string | undefined
}

declare function getLatestVersion(
  pkgName: string,
  optionsOrRange?: string,
): Promise<string | undefined>
declare function getLatestVersion(
  pkgName: string,
  optionsOrRange: Options,
): Promise<string | undefined>
declare function getLatestVersion(
  pkgName: string,
  optionsOrRange: WithLatestOptions,
): Promise<ResolvedVersions>

export default getLatestVersion
