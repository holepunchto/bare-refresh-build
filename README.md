# bare-refresh-build

Build an application that boots a <https://github.com/holepunchto/bare-refresh> host instead of running itself. The application is packed into a bundle and staged next to a generated entry, which starts a host for the bundle and connects it to a server. The staged package is then built into an app with <https://github.com/holepunchto/bare-build>.

```
npm i bare-refresh-build
```

## Usage

```js
const build = require('bare-refresh-build')

const { bundle } = await build.pack({ entry: 'app.js', host: 'darwin-arm64' })

await build(bundle, {
  base: __dirname,
  host: 'darwin-arm64',
  name: 'Demo',
  identifier: 'to.holepunch.demo',
  runtime: 'bare-native/runtime',
  client: 'bare-refresh-transport-tcp/connect',
  options: { port: 9000 }
})
```

## License

Apache-2.0
