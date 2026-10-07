const test = require('brittle')
const fs = require('fs')
const path = require('path')
const os = require('os')

const build = require('.')
const { pack } = build

const host = `${os.platform()}-${os.arch()}`

async function app(t, files) {
  const base = await t.tmp(t)

  for (const name in files) {
    const file = path.join(base, name)

    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, files[name])
  }

  return base
}

async function bundle(base) {
  const { bundle } = await pack({ entry: path.join(base, 'index.js'), host })

  return bundle
}

test('the bundle is rooted at what its keys share', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': "module.exports = require('./lib/thing')\n",
    'lib/thing.js': 'module.exports = 1\n'
  })

  const app1 = await bundle(base)

  t.alike([...app1.keys()].sort(), ['/index.js', '/lib/thing.js', '/package.json'])
  t.is(app1.main, '/index.js', 'and so is its entry')
})

test('the host is left to inject its hooks', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': "module.exports = require('bare-refresh/hot')\n"
  })

  const app1 = await bundle(base)

  t.absent(
    [...app1.keys()].some((key) => key.includes('bare-refresh')),
    'a packed copy would shadow the injected one and answer with nothing'
  )
})

test('the files that went in come back', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': "module.exports = require('./lib/thing')\n",
    'lib/thing.js': 'module.exports = 1\n'
  })

  const { files } = await pack({ entry: path.join(base, 'index.js'), host })

  t.alike(
    files.map((file) => path.relative(base, file)).sort(),
    [path.join('lib', 'thing.js'), 'index.js', 'package.json'].sort(),
    'which is what a loop watches, and is where they actually are'
  )
})

test('the bundle carries an id', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': 'module.exports = 1\n'
  })

  const app1 = await bundle(base)

  t.ok(/^[0-9a-f]{64}$/.test(app1.id))

  fs.writeFileSync(path.join(base, 'index.js'), 'module.exports = 2\n')

  const app2 = await bundle(base)

  t.not(app1.id, app2.id, 'which is how a server tells one from another')
})

test('staging attaches the modules it is given to the host', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': 'module.exports = 1\n'
  })

  const staging = path.join(base, '.refresh')

  await build.stage(await bundle(base), {
    staging,
    client: 'bare-refresh-transport-tcp/connect',
    attach: ['bare-native/overlay', './local']
  })

  const entry = fs.readFileSync(path.join(staging, 'index.js'), 'utf8')

  t.ok(entry.includes("attach: [require('bare-native/overlay'), require('./local')]"))
})

test('staging writes a package that boots a host', async (t) => {
  const base = await app(t, {
    'package.json': '{ "name": "app", "version": "1.0.0", "main": "index.js" }',
    'index.js': 'module.exports = 1\n'
  })

  const staging = path.join(base, '.refresh')

  await build.stage(await bundle(base), {
    staging,
    name: 'My Demo',
    client: 'bare-refresh-transport-tcp/connect',
    options: { port: 9000 }
  })

  t.alike(fs.readdirSync(staging).sort(), ['app.bin', 'index.js', 'options.json', 'package.json'])

  const entry = fs.readFileSync(path.join(staging, 'index.js'), 'utf8')

  t.ok(entry.includes("require('bare-refresh/boot')"))
  t.ok(
    entry.includes("require('bare-refresh-transport-tcp/connect')"),
    'the transport it was given'
  )
  t.ok(entry.includes("'./app.bin'"), 'and not a bundle, whose extension would conflict')
  t.ok(entry.includes('attach: []'), 'with nothing attached unless asked')

  t.alike(JSON.parse(fs.readFileSync(path.join(staging, 'options.json'), 'utf8')), { port: 9000 })

  t.is(JSON.parse(fs.readFileSync(path.join(staging, 'package.json'), 'utf8')).name, 'my-demo-dev')
})
