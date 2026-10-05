const pack = require('bare-pack')
const traverse = require('bare-module-traverse')
const { readModule, listPrefix } = require('bare-pack/fs')
const { fileURLToPath, pathToFileURL } = require('url')
const id = require('bare-bundle-id')

module.exports = async function packApplication(opts = {}) {
  const { entry, host, builtins = [] } = opts

  const bundle = await pack(
    pathToFileURL(entry),
    {
      hosts: [host],
      linked: true,
      resolve: traverse.resolve.bare,
      // The host injects its hooks as `bare-refresh/hot`, and a packed copy
      // would shadow them.
      builtins: ['bare-refresh/hot', ...builtins]
    },
    readModule,
    listPrefix
  )

  const files = []

  for (const key of bundle.keys()) {
    const url = new URL(key)

    if (url.protocol === 'file:') files.push(fileURLToPath(url))
  }

  const root = common(bundle)

  const rooted = bundle.unmount(root)

  rooted.id = id(rooted).toString('hex')

  return { bundle: rooted, files, root: root.href }
}

// The host mounts the bundle on its own, so no key may climb out of its root.
function common(bundle) {
  let prefix = null

  for (const key of bundle.keys()) {
    const dir = key.slice(0, key.lastIndexOf('/') + 1)

    if (prefix === null) {
      prefix = dir

      continue
    }

    while (!dir.startsWith(prefix)) {
      prefix = prefix.slice(0, prefix.lastIndexOf('/', prefix.length - 2) + 1)
    }
  }

  return new URL(prefix)
}
