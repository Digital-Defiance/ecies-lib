const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { default: commonjs } = require('@rollup/plugin-commonjs');
const { default: typescript } = require('@rollup/plugin-typescript');
const { default: replace } = require('@rollup/plugin-replace');

module.exports = (config) => {
  return {
    ...config,
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ['', ''],
        values: {
          // Replace the specific pattern that's failing
          'constants.DNS': JSON.stringify({
            NODATA: 'ENODATA',
            FORMERR: 'EFORMERR',
            SERVFAIL: 'ESERVFAIL',
            NOTFOUND: 'ENOTFOUND',
            NOTIMP: 'ENOTIMP',
            REFUSED: 'EREFUSED',
            BADQUERY: 'EBADQUERY',
            BADNAME: 'EBADNAME',
            BADFAMILY: 'EBADFAMILY',
            BADRESP: 'EBADRESP',
            CONNREFUSED: 'ECONNREFUSED',
            TIMEOUT: 'ETIMEOUT',
            EOF: 'EOF',
            FILE: 'EFILE',
            NOMEM: 'ENOMEM',
            DESTRUCTION: 'EDESTRUCTION',
            BADSTR: 'EBADSTR',
            BADFLAGS: 'EBADFLAGS',
            NONAME: 'ENONAME',
            BADHINTS: 'EBADHINTS',
            NOTINITIALIZED: 'ENOTINITIALIZED',
            LOADIPHLPAPI: 'ELOADIPHLPAPI',
            ADDRGETNETWORKPARAMS: 'EADDRGETNETWORKPARAMS',
            CANCELLED: 'ECANCELLED'
          }),
          // Also handle the typeof check
          'typeof constants !== "undefined" && constants.DNS': JSON.stringify({
            NODATA: 'ENODATA',
            FORMERR: 'EFORMERR',
            SERVFAIL: 'ESERVFAIL',
            NOTFOUND: 'ENOTFOUND',
            NOTIMP: 'ENOTIMP',
            REFUSED: 'EREFUSED',
            BADQUERY: 'EBADQUERY',
            BADNAME: 'EBADNAME',
            BADFAMILY: 'EBADFAMILY',
            BADRESP: 'EBADRESP',
            CONNREFUSED: 'ECONNREFUSED',
            TIMEOUT: 'ETIMEOUT',
            EOF: 'EOF',
            FILE: 'EFILE',
            NOMEM: 'ENOMEM',
            DESTRUCTION: 'EDESTRUCTION',
            BADSTR: 'EBADSTR',
            BADFLAGS: 'EBADFLAGS',
            NONAME: 'ENONAME',
            BADHINTS: 'EBADHINTS',
            NOTINITIALIZED: 'ENOTINITIALIZED',
            LOADIPHLPAPI: 'ELOADIPHLPAPI',
            ADDRGETNETWORKPARAMS: 'EADDRGETNETWORKPARAMS',
            CANCELLED: 'ECANCELLED'
          })
        }
      }),
      ...config.plugins,
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        transformMixedEsModules: true
      })
    ]
  };
};