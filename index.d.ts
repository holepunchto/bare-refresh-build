import Bundle from 'bare-bundle'
import pack from './lib/pack'

interface StageOptions {
  /** The directory to write the package to. */
  staging: string
  /** The name of the application. Defaults to `app`. */
  name?: string
  /** The specifier of the transport function to connect with, such as `bare-refresh-transport-tcp/connect`. */
  client: string
  /** The options passed to the transport function. Defaults to `{}`. */
  options?: unknown
}

interface BuildOptions extends Omit<StageOptions, 'staging'> {
  /** The directory of the application, which its dependencies are resolved from. */
  base: string
  /** Defaults to `<base>/.refresh`. */
  staging?: string
  /** The output directory. Defaults to `<base>/out-dev`. */
  out?: string
  /** The host to build for, such as `darwin-arm64`. */
  host: string
  name: string
  identifier: string
  /** The runtime to build the app with. */
  runtime: string
}

/**
 * Stage a package whose entry boots a `bare-refresh` host for `bundle`, then build it into an app
 * with `bare-build`. Resolves with the output directory.
 */
declare function build(bundle: Bundle, opts: BuildOptions): Promise<string>

declare namespace build {
  /**
   * Write a package to `staging` whose entry boots a `bare-refresh` host for `bundle` and connects
   * it to a server. Resolves with `staging`.
   */
  export function stage(bundle: Bundle, opts: StageOptions): Promise<string>

  export { type BuildOptions, type StageOptions, pack }
}

export = build
