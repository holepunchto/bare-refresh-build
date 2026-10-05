import Bundle from 'bare-bundle'

/**
 * Pack the application at `entry` for `host`. `bare-refresh` is always packed as a builtin, along
 * with any `builtins`, as the host provides it. The bundle is rooted at the directory its files
 * share and has an id.
 */
declare function pack(opts: { entry: string; host: string; builtins?: string[] }): Promise<{
  /** The application. */
  bundle: Bundle
  /** The paths of the files that were packed, which is what to watch for changes. */
  files: string[]
  /** The URL of the directory the bundle is rooted at. */
  root: string
}>

export = pack
