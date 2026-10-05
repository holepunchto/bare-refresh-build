const fs = require('fs/promises')
const path = require('path')
const build = require('bare-build')

module.exports = exports = async function (bundle, opts = {}) {
  const {
    base,
    staging = path.join(base, '.refresh'),
    out = path.join(base, 'out'),
    host,
    name,
    identifier,
    runtime,
    client,
    options = {}
  } = opts

  await stage(bundle, { staging, name, client, options })

  // Built from the base of the application, as the staged entry has no
  // `node_modules` of its own.
  for await (const _ of build(path.join(staging, 'index.js'), {
    base,
    hosts: [host],
    out,
    name,
    identifier,
    runtime
  })) {
    //
  }

  return out
}

exports.stage = stage

exports.pack = require('./lib/pack')

async function stage(bundle, opts = {}) {
  const { staging, name = 'app', client, options = {} } = opts

  await fs.mkdir(staging, { recursive: true })

  await fs.writeFile(
    path.join(staging, 'package.json'),
    JSON.stringify(
      {
        name: slug(name) + '-dev',
        version: '1.0.0',
        private: true,
        type: 'commonjs',
        main: 'index.js'
      },
      null,
      2
    )
  )

  // The bundle is not called `app.bundle`, as a packer types a file by its
  // extension and the `binary` type would then conflict.
  await fs.writeFile(path.join(staging, 'index.js'), entry(client))
  await fs.writeFile(path.join(staging, 'app.bin'), bundle.toBuffer())
  await fs.writeFile(path.join(staging, 'options.json'), JSON.stringify(options))

  return staging
}

function entry(client) {
  return `\
const boot = require('bare-refresh/boot')
const connect = require('${client}')

module.exports = boot(require('./app.bin', { with: { type: 'binary' } }), {
  connect,
  options: require('./options.json'),
  protocol: module.protocol
})
`
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
