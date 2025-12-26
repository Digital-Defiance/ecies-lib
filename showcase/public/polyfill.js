// Node.js constants polyfill for browser
if (typeof window !== 'undefined' && typeof window.constants === 'undefined') {
  window.constants = {
    DNS: {
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
    }
  };
  
  if (typeof globalThis !== 'undefined') {
    globalThis.constants = window.constants;
  }
  
  if (typeof global !== 'undefined') {
    global.constants = window.constants;
  }
}