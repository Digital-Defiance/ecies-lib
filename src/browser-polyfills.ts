// Browser polyfills for Node.js modules
declare global {
  interface Window {
    global: typeof globalThis;
    process: any;
    Buffer: any;
  }
  
  var process: any;
}

// Polyfill global
if (typeof window !== 'undefined') {
  window.global = window.global || window;
}

// Polyfill process - make it available everywhere
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  const processPolyfill = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    version: '16.0.0',
    platform: 'browser'
  };
  
  window.process = processPolyfill;
  (globalThis as any).process = processPolyfill;
  (global as any).process = processPolyfill;
  
  // Also set it as a global variable
  try {
    (window as any).process = processPolyfill;
    Object.defineProperty(window, 'process', {
      value: processPolyfill,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Ignore if already defined
  }
}

// Polyfill constants
(globalThis as any).constants = {
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

export {};