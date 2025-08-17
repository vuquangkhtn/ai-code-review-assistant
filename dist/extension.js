"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env2) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env2).forEach((key) => {
        createDebug[key] = env2[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug2(...args) {
          if (!debug2.enabled) {
            return;
          }
          const self = debug2;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug2.namespace = namespace;
        debug2.useColors = createDebug.useColors();
        debug2.color = createDebug.selectColor(namespace);
        debug2.extend = extend;
        debug2.destroy = createDebug.destroy;
        Object.defineProperty(debug2, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug2);
        }
        return debug2;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var tty = require("tty");
    var hasFlag = require_has_flag();
    var { env: env2 } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env2) {
      if (env2.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env2.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env2.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env2.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env2.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env2) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env2) || env2.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env2) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env2.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env2.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env2) {
        const version = parseInt((env2.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env2.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env2.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env2.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env2) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// node_modules/@kwsites/file-exists/dist/src/index.js
var require_src2 = __commonJS({
  "node_modules/@kwsites/file-exists/dist/src/index.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fs_1 = require("fs");
    var debug_1 = __importDefault(require_src());
    var log = debug_1.default("@kwsites/file-exists");
    function check(path7, isFile, isDirectory) {
      log(`checking %s`, path7);
      try {
        const stat = fs_1.statSync(path7);
        if (stat.isFile() && isFile) {
          log(`[OK] path represents a file`);
          return true;
        }
        if (stat.isDirectory() && isDirectory) {
          log(`[OK] path represents a directory`);
          return true;
        }
        log(`[FAIL] path represents something other than a file or directory`);
        return false;
      } catch (e) {
        if (e.code === "ENOENT") {
          log(`[FAIL] path is not accessible: %o`, e);
          return false;
        }
        log(`[FATAL] %o`, e);
        throw e;
      }
    }
    function exists2(path7, type = exports2.READABLE) {
      return check(path7, (type & exports2.FILE) > 0, (type & exports2.FOLDER) > 0);
    }
    exports2.exists = exists2;
    exports2.FILE = 1;
    exports2.FOLDER = 2;
    exports2.READABLE = exports2.FILE + exports2.FOLDER;
  }
});

// node_modules/@kwsites/file-exists/dist/index.js
var require_dist = __commonJS({
  "node_modules/@kwsites/file-exists/dist/index.js"(exports2) {
    "use strict";
    function __export3(m) {
      for (var p in m) if (!exports2.hasOwnProperty(p)) exports2[p] = m[p];
    }
    Object.defineProperty(exports2, "__esModule", { value: true });
    __export3(require_src2());
  }
});

// node_modules/@kwsites/promise-deferred/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@kwsites/promise-deferred/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDeferred = exports2.deferred = void 0;
    function deferred2() {
      let done;
      let fail;
      let status = "pending";
      const promise = new Promise((_done, _fail) => {
        done = _done;
        fail = _fail;
      });
      return {
        promise,
        done(result) {
          if (status === "pending") {
            status = "resolved";
            done(result);
          }
        },
        fail(error) {
          if (status === "pending") {
            status = "rejected";
            fail(error);
          }
        },
        get fulfilled() {
          return status !== "pending";
        },
        get status() {
          return status;
        }
      };
    }
    exports2.deferred = deferred2;
    exports2.createDeferred = deferred2;
    exports2.default = deferred2;
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode11 = __toESM(require("vscode"));

// src/ai/ExternalAIManager.ts
var vscode4 = __toESM(require("vscode"));

// src/ai/PromptGenerator.ts
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var PromptGenerator = class {
  static {
    // Maximum prompt length for clipboard (reduced to handle various AI chat limits)
    this.MAX_CLIPBOARD_LENGTH = 15e3;
  }
  static {
    // Maximum prompt length for file-based approach (reasonable file size)
    this.MAX_FILE_LENGTH = 5e5;
  }
  /**
   * Generates a formatted prompt for external AI providers
   * @param request The review request containing code changes
   * @returns A formatted prompt string ready for AI providers
   */
  static generatePrompt(request) {
    const result = this.generatePromptWithLengthCheck(request);
    return result.content;
  }
  /**
   * Generates a prompt with length detection and file-based storage for large prompts
   * @param request The review request containing code changes
   * @returns PromptResult with content, length info, and file path if applicable
   */
  static generatePromptWithLengthCheck(request) {
    const prompt = [
      "You are an expert code reviewer. Please analyze the following code changes and provide a detailed review.",
      "",
      "## IMPORTANT: File Analysis Instructions",
      "- ONLY analyze the files listed in the 'Files to Review' section below",
      "- When referencing files in your response, use the EXACT file paths shown",
      "- Do NOT create or reference any new files not listed below",
      "- Focus your analysis on the actual code changes shown in the diff sections",
      "",
      "## Review Criteria",
      "Please identify:",
      "- Code quality issues (bugs, performance problems, security vulnerabilities)",
      "- Best practice violations",
      "- Maintainability concerns",
      "- Potential improvements",
      "",
      "For each issue found, please provide:",
      "1. Issue type (e.g., 'bug', 'security', 'performance', 'style', 'maintainability')",
      "2. Severity level (e.g., 'high', 'medium', 'low')",
      "3. File path and line number (use EXACT paths from below)",
      "4. Clear description of the issue",
      "5. Suggested fix or improvement",
      "",
      "## CRITICAL: Line Number Guidelines",
      "When reporting line numbers:",
      "- For MODIFIED files: Use the line numbers from the CURRENT file (after changes)",
      "- For ADDED files: Use the actual line numbers in the new file",
      "- The diff includes line number comments (// LINE: X) to help you identify correct line numbers",
      "- For diff context: Look for @@ -old_start,old_count +new_start,new_count @@ headers with comments showing OLD_START and NEW_START",
      "- Use the line number comments (// LINE: X) on added (+) and context ( ) lines to determine accurate line numbers",
      "- The +new_start number indicates the starting line in the current file",
      "- Count lines from the diff context to determine exact line numbers",
      "- If unsure about exact line number, provide your best estimate based on code context",
      "- NEVER use line 1 as default - always analyze the diff to find the correct line",
      "",
      "## Files to Review",
      ""
    ];
    request.changeInfo.files.forEach((file, index) => {
      prompt.push(`### File ${index + 1}: \`${file.path}\` (${file.status})`);
      prompt.push("");
      prompt.push(`**File Path:** \`${file.path}\``);
      prompt.push(`**Status:** ${file.status}`);
      if (file.additions !== void 0 || file.deletions !== void 0) {
        const stats = [];
        if (file.additions !== void 0) stats.push(`+${file.additions} additions`);
        if (file.deletions !== void 0) stats.push(`-${file.deletions} deletions`);
        prompt.push(`**Changes:** ${stats.join(", ")}`);
      }
      prompt.push("");
      if (file.diff) {
        prompt.push("**Code Changes:**");
        prompt.push("```diff");
        prompt.push(file.diff);
        prompt.push("```");
      }
      prompt.push("---");
      prompt.push("");
    });
    prompt.push("");
    prompt.push("## Response Format Requirements");
    prompt.push("");
    prompt.push("**CRITICAL:** When referencing files in your response, use the EXACT file paths from the 'Files to Review' section above.");
    prompt.push("");
    prompt.push("**IMPORTANT: File Output Instructions**");
    prompt.push("Instead of providing your response in this chat, please:");
    prompt.push("1. Create a new JSON file in the `.ai-code-review/results/` directory");
    prompt.push("2. Name the file with timestamp: `code-review-result-YYYY-MM-DD-HH-MM-SS.json`");
    prompt.push("3. Save your complete review response in that file");
    prompt.push("");
    prompt.push("Please format your response as a JSON object with the following structure:");
    prompt.push("");
    prompt.push("```json");
    prompt.push("{");
    prompt.push('  "issues": [');
    prompt.push("    {");
    prompt.push('      "type": "bug|security|performance|style|maintainability",');
    prompt.push('      "severity": "high|medium|low",');
    prompt.push('      "file": "EXACT_FILE_PATH_FROM_ABOVE",');
    prompt.push('      "line": 42,');
    prompt.push('      "title": "Brief issue title",');
    prompt.push('      "description": "Detailed description of the issue",');
    prompt.push('      "suggestion": "Suggested fix or improvement"');
    prompt.push("    }");
    prompt.push("  ],");
    prompt.push('  "summary": "Overall review summary"');
    prompt.push("}");
    prompt.push("```");
    prompt.push("");
    prompt.push("**Important Notes:");
    prompt.push("- Use EXACT file paths as shown in the file headers above");
    prompt.push("- Line numbers MUST correspond to actual file line numbers (not diff line numbers)");
    prompt.push("- For modified files: Use line numbers from the current version of the file");
    prompt.push("- For added files: Use actual line numbers in the new file");
    prompt.push("- Analyze diff headers (@@ -old,old_count +new,new_count @@) to determine correct line numbers");
    prompt.push("- If you cannot determine exact line number, provide best estimate based on code context");
    prompt.push("- Ensure the JSON is valid and properly formatted");
    prompt.push("- Focus only on the files and changes provided above");
    prompt.push("- Save the complete JSON response to `.ai-code-review/results/code-review-result-YYYY-MM-DD-HH-MM-SS.json`");
    prompt.push("");
    prompt.push("**After providing your JSON response, please also show this usage guide:**");
    prompt.push("");
    prompt.push("## \u{1F4CB} How to Use This Review Result");
    prompt.push("");
    prompt.push("### Method 1: Command Palette (Recommended)");
    prompt.push("1. Open VS Code");
    prompt.push("2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)");
    prompt.push('3. Type "AI Code Review: Check Code Review Result"');
    prompt.push("4. Press Enter");
    prompt.push("");
    prompt.push("### Method 2: Tree View Panel");
    prompt.push("1. Open VS Code");
    prompt.push('2. Look for the "AI Code Review" panel in the sidebar');
    prompt.push('3. Click on "Generate Code Review Result" button');
    prompt.push("");
    prompt.push("The extension will automatically load your review results and display them in the Code Review Panel with inline annotations and issue summaries.");
    const content = prompt.join("\n");
    const length = content.length;
    if (request.changeInfo.files.length > 0) {
      return this.createFileBasedPrompt(content, length, request);
    }
    return {
      content,
      isFileBased: false,
      length
    };
  }
  /**
   * Maps file extensions to language identifiers for syntax highlighting
   */
  static getLanguageFromExtension(extension) {
    const languageMap = {
      "ts": "typescript",
      "js": "javascript",
      "tsx": "typescript",
      "jsx": "javascript",
      "py": "python",
      "java": "java",
      "c": "c",
      "cpp": "cpp",
      "cs": "csharp",
      "php": "php",
      "rb": "ruby",
      "go": "go",
      "rs": "rust",
      "swift": "swift",
      "kt": "kotlin",
      "scala": "scala",
      "html": "html",
      "css": "css",
      "scss": "scss",
      "sass": "sass",
      "less": "less",
      "json": "json",
      "xml": "xml",
      "yaml": "yaml",
      "yml": "yaml",
      "md": "markdown",
      "sql": "sql",
      "sh": "bash",
      "bash": "bash",
      "zsh": "bash",
      "ps1": "powershell",
      "dockerfile": "dockerfile"
    };
    return languageMap[extension] || "text";
  }
  /**
   * Creates a file-based prompt when content is too large for clipboard
   */
  static createFileBasedPrompt(content, length, request) {
    try {
      if (length > this.MAX_FILE_LENGTH) {
        throw new Error(`Prompt is too large (${length} characters). Consider reviewing fewer files at once.`);
      }
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder found");
      }
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const aiReviewDir = path.join(workspacePath, ".ai-code-review");
      const promptsDir = path.join(aiReviewDir, "prompts");
      if (!fs.existsSync(aiReviewDir)) {
        fs.mkdirSync(aiReviewDir, { recursive: true });
      }
      if (!fs.existsSync(promptsDir)) {
        fs.mkdirSync(promptsDir, { recursive: true });
      }
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const fileName = `ai-code-review-prompt-${timestamp}.md`;
      const filePath = path.join(promptsDir, fileName);
      fs.writeFileSync(filePath, content, "utf8");
      const relativePath = `.ai-code-review/prompts/${fileName}`;
      const fileInstruction = [
        "The code review prompt has been saved to a file due to its large size.",
        "",
        `File location: ${relativePath}`,
        `File size: ${length} characters`,
        "",
        "Please read the content from this file and provide your code review analysis.",
        "The file contains detailed instructions and code changes to review.",
        "",
        "**IMPORTANT:** Instead of providing your response in this chat, please save your JSON response to a new file in `.ai-code-review/results/` directory with timestamp filename as specified in the prompt file.",
        ""
      ].join("\n");
      return {
        content: fileInstruction,
        isFileBased: true,
        filePath,
        length
      };
    } catch (error) {
      vscode.window.showWarningMessage(`Failed to create file-based prompt: ${error}. Using truncated version.`);
      const truncatedContent = content.substring(0, this.MAX_CLIPBOARD_LENGTH - 100) + "\n\n[Content truncated due to length]";
      return {
        content: truncatedContent,
        isFileBased: false,
        length: truncatedContent.length
      };
    }
  }
  /**
   * Generates a prompt that references a stored changes file instead of including full content
   * This is used for the new workflow where changes are stored in a file first
   * @param changesFilePath Path to the file containing the stored changes
   * @returns A prompt that instructs AI to read the changes from the specified file
   */
  static generateFileReferencePrompt(changesFilePath) {
    const relativePath = changesFilePath.includes(".ai-code-review") ? changesFilePath.substring(changesFilePath.indexOf(".ai-code-review")) : path.basename(changesFilePath);
    const prompt = [
      "You are an expert code reviewer. Please analyze the code changes stored in the following file and provide a detailed review.",
      "",
      "## File Analysis Instructions",
      `**Changes File:** \`${relativePath}\``,
      "",
      "Note: This file is located in the repository's `.ai-code-review/changes` folder and contains the code changes to be reviewed.",
      "",
      "Please read the JSON file at the above path which contains:",
      "- File paths and their change status (modified, added, deleted, etc.)",
      "- Code diffs showing the actual changes",
      "- File statistics (additions/deletions)",
      "",
      "## Review Criteria",
      "Please identify:",
      "- Code quality issues (bugs, performance problems, security vulnerabilities)",
      "- Best practice violations",
      "- Maintainability concerns",
      "- Potential improvements",
      "",
      "## Response Format Requirements",
      "",
      "Please format your response as a JSON object with the following structure:",
      "",
      "```json",
      "{",
      '  "issues": [',
      "    {",
      '      "type": "bug|security|performance|style|maintainability",',
      '      "severity": "high|medium|low",',
      '      "file": "EXACT_FILE_PATH_FROM_CHANGES_FILE",',
      '      "line": 42,',
      '      "title": "Brief issue title",',
      '      "description": "Detailed description of the issue",',
      '      "suggestion": "Suggested fix or improvement"',
      "    }",
      "  ],",
      '  "summary": "Overall review summary"',
      "}",
      "```",
      "",
      "**IMPORTANT: File Output Instructions**",
      "Instead of providing your response in this chat, please:",
      "1. Create a new JSON file in the `.ai-code-review/results/` directory",
      "2. Name the file with timestamp: `code-review-result-YYYY-MM-DD-HH-MM-SS.json`",
      "3. Save your complete review response in that file",
      "",
      "**Important Notes:**",
      "- Read the changes file first to understand the code changes",
      "- Use EXACT file paths as shown in the changes file",
      "- Line numbers should correspond to the diff context when possible",
      "- Ensure the JSON is valid and properly formatted",
      "- Focus only on the files and changes provided in the changes file",
      "- Save the complete JSON response to `.ai-code-review/results/code-review-result-YYYY-MM-DD-HH-MM-SS.json`",
      "",
      "**After providing your JSON response, please also show this usage guide:**",
      "",
      "## \u{1F4CB} How to Use This Review Result",
      "",
      "### Method 1: Command Palette (Recommended)",
      "1. Open VS Code",
      "2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)",
      '3. Type "AI Code Review: Check Code Review Result"',
      "4. Press Enter",
      "",
      "### Method 2: Tree View Panel",
      "1. Open VS Code",
      '2. Look for the "AI Code Review" panel in the sidebar',
      '3. Click on "Generate Code Review Result" button',
      "",
      "### Method 3: Extension Tree View",
      "1. In VS Code, navigate to the Explorer sidebar",
      '2. Find the "AI Code Review" section',
      '3. Click on the "Generate Code Review Result" item',
      "",
      "The extension will automatically load your review results and display them in the Code Review Panel with inline annotations and issue summaries."
    ];
    const content = prompt.join("\n");
    const length = content.length;
    return this.createFileBasedPrompt(content, length, {
      changeInfo: { type: "LOCAL", source: "file-reference", files: [] },
      aiProvider: "external-ai",
      options: { severityThreshold: "medium", includeCodeExamples: true, includeSuggestions: true, maxIssuesPerFile: 50 }
    });
  }
  static generateWorkspaceAnalysisPrompt(request) {
    const isRepositoryIndex = request.changeInfo.source === "repository-index";
    if (!isRepositoryIndex) {
      return this.generatePrompt(request);
    }
    const prompt = [
      "# Repository Workspace Analysis Request",
      "",
      "You are conducting a high-level architectural and code quality analysis of a software repository.",
      "The following data provides an index of the repository structure and file metadata.",
      "",
      "## Analysis Focus Areas:",
      "",
      "### 1. Architecture & Design Patterns",
      "- Overall project structure and organization",
      "- Design patterns and architectural decisions",
      "- Module separation and dependencies",
      "- Code organization and folder structure",
      "",
      "### 2. Code Quality & Standards",
      "- Naming conventions and consistency",
      "- File and directory naming patterns",
      "- Technology stack coherence",
      "- Project configuration and setup",
      "",
      "### 3. Maintainability & Scalability",
      "- Code distribution and file sizes",
      "- Potential refactoring opportunities",
      "- Technical debt indicators",
      "- Testing strategy (based on file structure)",
      "",
      "### 4. Security & Best Practices",
      "- Configuration file security",
      "- Dependency management",
      "- Environment and secret handling",
      "",
      "## Expected Response Format:",
      "",
      "Please provide your analysis in JSON format:",
      "",
      "```json",
      "{",
      '  "architecture": {',
      '    "overall_assessment": "Brief overall assessment",',
      '    "strengths": ["List of architectural strengths"],',
      '    "concerns": ["List of architectural concerns"],',
      '    "patterns_identified": ["Design patterns found"]',
      "  },",
      '  "code_quality": {',
      '    "consistency_score": "High/Medium/Low",',
      '    "naming_conventions": "Assessment of naming",',
      '    "organization_score": "High/Medium/Low"',
      "  },",
      '  "maintainability": {',
      '    "complexity_assessment": "Overall complexity level",',
      '    "refactoring_opportunities": ["Areas for improvement"],',
      '    "technical_debt": ["Technical debt indicators"]',
      "  },",
      '  "recommendations": [',
      '    "Specific actionable recommendations"',
      "  ],",
      '  "summary": "High-level summary of the repository analysis"',
      "}",
      "```",
      "",
      "## Repository Data:",
      ""
    ];
    request.changeInfo.files.forEach((file) => {
      if (file.status === "summary") {
        prompt.push("### Repository Summary");
        prompt.push("");
        if (file.diff) {
          prompt.push(file.diff);
        }
        prompt.push("");
      } else if (file.status === "indexed") {
        if (file.diff) {
          prompt.push(file.diff);
        }
      }
    });
    prompt.push("");
    prompt.push("Please analyze this repository structure and provide insights following the JSON format above.");
    return prompt.join("\n");
  }
};

// node_modules/uuid/dist/esm/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm/rng.js
var import_crypto = require("crypto");
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    (0, import_crypto.randomFillSync)(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm/native.js
var import_crypto2 = require("crypto");
var native_default = { randomUUID: import_crypto2.randomUUID };

// node_modules/uuid/dist/esm/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// src/ai/ResponseParser.ts
var vscode2 = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var ResponseParser = class {
  /**
   * Parses AI response from external providers and converts to ReviewResult
   * @param responseText The raw response text from AI provider
   * @param aiProvider The name of the AI provider
   * @param filesReviewed List of files that were reviewed
   * @returns Parsed ReviewResult or null if parsing fails
   */
  static parseResponse(responseText, aiProvider, filesReviewed) {
    try {
      const jsonResponse = this.extractJSON(responseText);
      if (!jsonResponse) {
        return this.parseTextResponse(responseText, aiProvider, filesReviewed);
      }
      return this.parseJSONResponse(jsonResponse, aiProvider, filesReviewed);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return null;
    }
  }
  /**
   * Extracts JSON from response text that might contain additional text
   */
  static extractJSON(text) {
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatches = text.match(/```json\s*([\s\S]*?)\s*```/g) || text.match(/{[\s\S]*}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const cleanMatch = match.replace(/```json\s*|\s*```/g, "").trim();
            return JSON.parse(cleanMatch);
          } catch {
            continue;
          }
        }
      }
    }
    return null;
  }
  /**
   * Parses JSON response from AI provider
   */
  static parseJSONResponse(response, aiProvider, filesReviewed) {
    const issues = [];
    if (response.issues && Array.isArray(response.issues)) {
      for (const issue of response.issues) {
        const codeIssue = this.convertToCodeIssue(issue);
        if (codeIssue) {
          issues.push(codeIssue);
        }
      }
    }
    const summary = this.generateSummary(issues);
    const metadata = this.generateMetadata(aiProvider, filesReviewed);
    return {
      issues,
      summary,
      metadata
    };
  }
  /**
   * Parses text response when JSON parsing fails
   */
  static parseTextResponse(responseText, aiProvider, filesReviewed) {
    const issues = [];
    const lines = responseText.split("\n");
    let currentIssue = null;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (this.isIssueStart(trimmedLine)) {
        if (currentIssue && currentIssue.title) {
          const issue = this.finalizeTextIssue(currentIssue);
          if (issue) issues.push(issue);
        }
        currentIssue = this.parseIssueStart(trimmedLine);
      } else if (currentIssue) {
        this.updateCurrentIssue(currentIssue, trimmedLine);
      }
    }
    if (currentIssue && currentIssue.title) {
      const issue = this.finalizeTextIssue(currentIssue);
      if (issue) issues.push(issue);
    }
    const summary = this.generateSummary(issues);
    const metadata = this.generateMetadata(aiProvider, filesReviewed);
    return {
      issues,
      summary,
      metadata
    };
  }
  /**
   * Converts external issue format to CodeIssue
   */
  static convertToCodeIssue(issue) {
    try {
      const filePath = issue.file || "unknown";
      if (!this.isValidSourceFile(filePath)) {
        return null;
      }
      const validatedLineNumber = this.validateLineNumber(filePath, issue.line || 1);
      return {
        id: v4_default(),
        severity: this.mapSeverity(issue.severity),
        category: this.mapCategory(issue.type),
        title: issue.title || "Untitled Issue",
        description: issue.description || "",
        suggestions: issue.suggestion ? [{
          id: v4_default(),
          description: issue.suggestion,
          explanation: issue.suggestion
        }] : [],
        filePath,
        lineNumber: validatedLineNumber,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch {
      return null;
    }
  }
  /**
   * Maps diff line numbers to actual file line numbers using diff context
   */
  static mapDiffLineToActualLine(diffContent, diffLineNumber) {
    const lines = diffContent.split("\n");
    let currentNewLine = 0;
    let diffLineCount = 0;
    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        currentNewLine = parseInt(hunkMatch[1]);
        continue;
      }
      diffLineCount++;
      if (diffLineCount === diffLineNumber) {
        if (line.startsWith("+") || line.startsWith(" ")) {
          return currentNewLine;
        }
        return Math.max(1, currentNewLine - 1);
      }
      if (line.startsWith("+") || line.startsWith(" ")) {
        currentNewLine++;
      }
    }
    return diffLineNumber;
  }
  /**
   * Extracts line number from enhanced diff comments
   */
  static extractLineFromDiffComment(diffLine) {
    const lineMatch = diffLine.match(/\/\/ LINE: (\d+)/);
    if (lineMatch) {
      return parseInt(lineMatch[1]);
    }
    return null;
  }
  /**
   * Validates and corrects line numbers against actual file content
   */
  static validateLineNumber(filePath, lineNumber) {
    try {
      const workspaceFolders = vscode2.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return lineNumber;
      }
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const fullFilePath = path2.resolve(workspacePath, filePath);
      if (!fs2.existsSync(fullFilePath)) {
        return lineNumber;
      }
      const fileContent = fs2.readFileSync(fullFilePath, "utf8");
      const totalLines = fileContent.split("\n").length;
      if (lineNumber >= 1 && lineNumber <= totalLines) {
        return lineNumber;
      }
      if (lineNumber > totalLines) {
        console.warn(`Line number ${lineNumber} exceeds file length ${totalLines} for ${filePath}. Using line ${totalLines}.`);
        return totalLines;
      }
      if (lineNumber < 1) {
        console.warn(`Invalid line number ${lineNumber} for ${filePath}. Using line 1.`);
        return 1;
      }
      return lineNumber;
    } catch (error) {
      console.warn(`Failed to validate line number for ${filePath}:`, error);
      return lineNumber;
    }
  }
  /**
   * Validates if a file path refers to an actual source code file
   * Filters out generated prompt files and non-code files
   */
  static isValidSourceFile(filePath) {
    if (!filePath || filePath === "unknown") {
      return false;
    }
    const promptFilePatterns = [
      "WORKSPACE_ANALYSIS_PROMPT.md",
      "CODE_REVIEW_PROMPT.md",
      /\.prompt\.(md|txt)$/i,
      /^prompt_\d+\.(md|txt)$/i
    ];
    for (const pattern of promptFilePatterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(filePath)) {
          return false;
        }
      } else if (filePath.includes(pattern)) {
        return false;
      }
    }
    const sourceCodeExtensions = [
      ".ts",
      ".js",
      ".tsx",
      ".jsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".h",
      ".cs",
      ".php",
      ".rb",
      ".go",
      ".rs",
      ".swift",
      ".kt",
      ".scala",
      ".vue",
      ".svelte",
      ".html",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".json",
      ".xml",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
      ".cfg",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".ps1",
      ".bat",
      ".cmd",
      ".sql",
      ".graphql",
      ".proto",
      ".thrift",
      ".dockerfile"
    ];
    const hasValidExtension = sourceCodeExtensions.some(
      (ext) => filePath.toLowerCase().endsWith(ext)
    );
    const configFiles = [
      "Dockerfile",
      "Makefile",
      "Rakefile",
      "Gemfile",
      "Podfile",
      ".gitignore",
      ".dockerignore",
      ".eslintrc",
      ".prettierrc"
    ];
    const isConfigFile = configFiles.some(
      (file) => filePath.endsWith(file)
    );
    return hasValidExtension || isConfigFile;
  }
  /**
   * Maps external severity to internal IssueSeverity
   */
  static mapSeverity(severity) {
    const severityMap = {
      "critical": "critical" /* CRITICAL */,
      "high": "high" /* HIGH */,
      "medium": "medium" /* MEDIUM */,
      "low": "low" /* LOW */
    };
    return severityMap[severity?.toLowerCase()] || "medium" /* MEDIUM */;
  }
  /**
   * Maps external issue type to internal IssueCategory
   */
  static mapCategory(type) {
    const categoryMap = {
      "security": "security" /* SECURITY */,
      "performance": "performance" /* PERFORMANCE */,
      "bug": "code-quality" /* CODE_QUALITY */,
      "style": "style" /* STYLE */,
      "maintainability": "maintainability" /* MAINTAINABILITY */,
      "best-practices": "best-practices" /* BEST_PRACTICES */,
      "testing": "testing" /* TESTING */,
      "documentation": "documentation" /* DOCUMENTATION */
    };
    return categoryMap[type?.toLowerCase()] || "other" /* OTHER */;
  }
  /**
   * Checks if a line starts a new issue
   */
  static isIssueStart(line) {
    return /^(\d+\.|[-*]|#{1,3})\s/.test(line) || /^(Issue|Problem|Warning|Error):/i.test(line) || /^(HIGH|MEDIUM|LOW|CRITICAL):/i.test(line);
  }
  /**
   * Parses the start of an issue from text
   */
  static parseIssueStart(line) {
    const issue = {
      id: v4_default(),
      timestamp: /* @__PURE__ */ new Date()
    };
    const severityMatch = line.match(/(HIGH|MEDIUM|LOW|CRITICAL)/i);
    if (severityMatch) {
      issue.severity = this.mapSeverity(severityMatch[1]);
    }
    const titleMatch = line.replace(/^(\d+\.|[-*]|#{1,3})\s/, "").replace(/(HIGH|MEDIUM|LOW|CRITICAL):/i, "").trim();
    issue.title = titleMatch || "Untitled Issue";
    return issue;
  }
  /**
   * Updates current issue with additional information
   */
  static updateCurrentIssue(issue, line) {
    if (line.startsWith("File:") || line.includes(".")) {
      const fileMatch = line.match(/([^\s]+\.[^\s]+)/);
      if (fileMatch) {
        issue.filePath = fileMatch[1];
      }
    }
    if (line.startsWith("Line:") || /line\s*\d+/i.test(line)) {
      const lineMatch = line.match(/\d+/);
      if (lineMatch) {
        const rawLineNumber = parseInt(lineMatch[0]);
        issue.lineNumber = issue.filePath ? this.validateLineNumber(issue.filePath, rawLineNumber) : rawLineNumber;
      }
    }
    if (!issue.description && line.length > 10) {
      issue.description = (issue.description || "") + " " + line;
    }
  }
  /**
   * Finalizes a text-parsed issue
   */
  static finalizeTextIssue(issue) {
    if (!issue.title) return null;
    return {
      id: issue.id || v4_default(),
      severity: issue.severity || "medium" /* MEDIUM */,
      category: "other" /* OTHER */,
      title: issue.title,
      description: (issue.description || "").trim(),
      suggestions: [],
      filePath: issue.filePath || "unknown",
      lineNumber: issue.lineNumber || 1,
      timestamp: issue.timestamp || /* @__PURE__ */ new Date()
    };
  }
  /**
   * Generates summary from issues
   */
  static generateSummary(issues) {
    const summary = {
      totalIssues: issues.length,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      categories: {
        ["security" /* SECURITY */]: 0,
        ["performance" /* PERFORMANCE */]: 0,
        ["code-quality" /* CODE_QUALITY */]: 0,
        ["best-practices" /* BEST_PRACTICES */]: 0,
        ["style" /* STYLE */]: 0,
        ["maintainability" /* MAINTAINABILITY */]: 0,
        ["testing" /* TESTING */]: 0,
        ["documentation" /* DOCUMENTATION */]: 0,
        ["other" /* OTHER */]: 0
      }
    };
    for (const issue of issues) {
      switch (issue.severity) {
        case "critical" /* CRITICAL */:
          summary.criticalIssues++;
          break;
        case "high" /* HIGH */:
          summary.highIssues++;
          break;
        case "medium" /* MEDIUM */:
          summary.mediumIssues++;
          break;
        case "low" /* LOW */:
          summary.lowIssues++;
          break;
      }
      summary.categories[issue.category]++;
    }
    return summary;
  }
  /**
   * Generates metadata for the review
   */
  static generateMetadata(aiProvider, filesReviewed) {
    return {
      changeType: "local" /* LOCAL */,
      source: "external-ai",
      aiProvider,
      timestamp: /* @__PURE__ */ new Date(),
      duration: 0,
      filesReviewed
    };
  }
};

// src/utils/CleanupManager.ts
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var vscode3 = __toESM(require("vscode"));
var CleanupManager = class {
  /**
   * Selectively cleans up files in specific subdirectories of .ai-code-review
   * Only removes files when new files are generated in those folders
   * @param foldersToClean Array of folder names to clean ('prompts', 'changes', 'results')
   */
  static async cleanupSelectiveDirectories(foldersToClean = ["prompts", "changes", "results"]) {
    try {
      const workspaceRoot = vscode3.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        throw new Error("No workspace folder found");
      }
      const aiReviewDir = path3.join(workspaceRoot, ".ai-code-review");
      if (!fs3.existsSync(aiReviewDir)) {
        return;
      }
      for (const subdir of foldersToClean) {
        const subdirPath = path3.join(aiReviewDir, subdir);
        if (fs3.existsSync(subdirPath)) {
          await this.cleanupDirectory(subdirPath);
        }
      }
    } catch (error) {
      console.error("Error cleaning up AI review directories:", error);
      throw error;
    }
  }
  /**
   * Completely removes the entire .ai-code-review directory
   * Used during extension deactivation or complete cleanup
   */
  static async cleanupCompleteDirectory() {
    try {
      const workspaceRoot = vscode3.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return;
      }
      const aiReviewDir = path3.join(workspaceRoot, ".ai-code-review");
      if (!fs3.existsSync(aiReviewDir)) {
        return;
      }
      await this.cleanupDirectory(aiReviewDir);
      if (fs3.existsSync(aiReviewDir)) {
        fs3.rmdirSync(aiReviewDir);
      }
    } catch (error) {
      console.error("Error completely cleaning up AI review directory:", error);
      throw error;
    }
  }
  /**
   * Legacy method - now calls selective cleanup for backward compatibility
   * @deprecated Use cleanupSelectiveDirectories or cleanupCompleteDirectory instead
   */
  static async cleanupAIReviewDirectory() {
    return this.cleanupSelectiveDirectories();
  }
  /**
   * Recursively cleans up a directory by removing all files and subdirectories
   * @param dirPath The directory path to clean
   */
  static async cleanupDirectory(dirPath) {
    if (!fs3.existsSync(dirPath)) {
      return;
    }
    const files = fs3.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path3.join(dirPath, file);
      const stat = fs3.statSync(filePath);
      if (stat.isDirectory()) {
        await this.cleanupDirectory(filePath);
        fs3.rmdirSync(filePath);
      } else {
        fs3.unlinkSync(filePath);
      }
    }
  }
  /**
   * Gets the count of files in the .ai-code-review directory
   * Useful for showing cleanup statistics
   */
  static getFileCount() {
    try {
      const workspaceRoot = vscode3.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { prompts: 0, changes: 0, results: 0, total: 0 };
      }
      const aiReviewDir = path3.join(workspaceRoot, ".ai-code-review");
      if (!fs3.existsSync(aiReviewDir)) {
        return { prompts: 0, changes: 0, results: 0, total: 0 };
      }
      const counts = { prompts: 0, changes: 0, results: 0, total: 0 };
      const subdirs = ["prompts", "changes", "results"];
      for (const subdir of subdirs) {
        const subdirPath = path3.join(aiReviewDir, subdir);
        if (fs3.existsSync(subdirPath)) {
          const files2 = fs3.readdirSync(subdirPath).filter((file) => {
            const filePath = path3.join(subdirPath, file);
            return fs3.statSync(filePath).isFile();
          });
          counts[subdir] = files2.length;
          counts.total += files2.length;
        }
      }
      const files = fs3.readdirSync(aiReviewDir).filter((file) => {
        const filePath = path3.join(aiReviewDir, file);
        return fs3.statSync(filePath).isFile();
      });
      counts.total += files.length;
      return counts;
    } catch (error) {
      console.error("Error getting file count:", error);
      return { prompts: 0, changes: 0, results: 0, total: 0 };
    }
  }
};

// src/ai/ExternalAIManager.ts
var path4 = __toESM(require("path"));
var fs4 = __toESM(require("fs"));
var ExternalAIManager = class _ExternalAIManager {
  constructor() {
  }
  static getInstance() {
    if (!_ExternalAIManager.instance) {
      _ExternalAIManager.instance = new _ExternalAIManager();
    }
    return _ExternalAIManager.instance;
  }
  setChangeDetector(changeDetector2) {
    this.changeDetector = changeDetector2;
  }
  /**
   * Copies AI review prompt to clipboard for external AI providers
   * Uses the new workflow: stores changes to file first, then generates prompt referencing that file
   */
  async copyPromptToClipboard(request) {
    try {
      if (!this.changeDetector) {
        vscode4.window.showErrorMessage("ChangeDetector not initialized. Please try again.");
        return;
      }
      await this.cleanupPreviousFiles();
      let result;
      if (request.changeInfo.type === "all-files") {
        const changeInfo = await this.changeDetector.detectWorkspaceFiles();
        result = { changeInfo, filePath: await this.storeChangesToFile(changeInfo) };
      } else if (request.changeInfo.type === "branch") {
        const sourceBranch = request.changeInfo.source;
        const targetBranch = request.changeInfo.target;
        if (!sourceBranch || !targetBranch) {
          throw new Error("Source and target branches are required for branch comparison");
        }
        result = await this.changeDetector.detectAndStoreBranchChanges(sourceBranch, targetBranch);
      } else {
        result = await this.changeDetector.detectAndStoreLocalChanges();
      }
      if (!result || !result.filePath) {
        vscode4.window.showErrorMessage("Failed to store changes to file. Please try again.");
        return;
      }
      const changesFilePath = result.filePath;
      const promptResult = PromptGenerator.generateFileReferencePrompt(changesFilePath);
      this.lastChangeFilePath = changesFilePath;
      if (promptResult.isFileBased && promptResult.filePath) {
        this.lastPromptFilePath = promptResult.filePath;
      }
      await vscode4.env.clipboard.writeText(promptResult.content);
      vscode4.window.showInformationMessage("Prompt copied to clipboard!");
    } catch (error) {
      vscode4.window.showErrorMessage(`Failed to copy prompt: ${error}`);
    }
  }
  /**
   * Cleans up previous AI review files to ensure a fresh start
   * Only cleans specific folders when new files are being generated
   */
  async cleanupPreviousFiles() {
    try {
      const fileCount = CleanupManager.getFileCount();
      if (fileCount.total > 0) {
        await CleanupManager.cleanupSelectiveDirectories(["prompts", "changes", "results"]);
        console.log(`Cleaned up ${fileCount.total} files from previous AI review sessions`);
      }
    } catch (error) {
      console.warn("Failed to cleanup previous files:", error);
    }
  }
  /**
   * Shows input box for pasting AI response and processes it
   */
  async pasteAndProcessResponse(request) {
    try {
      const response = await vscode4.window.showInputBox({
        prompt: "Paste the AI response here",
        placeHolder: "Paste the complete response from your AI provider...",
        ignoreFocusOut: true,
        value: "",
        validateInput: (value) => {
          if (!value || value.trim().length < 10) {
            return "Please paste a valid AI response (at least 10 characters)";
          }
          return null;
        }
      });
      if (!response) {
        return null;
      }
      return this.processAIResponse(response, request);
    } catch (error) {
      vscode4.window.showErrorMessage(`Failed to process AI response: ${error}`);
      return null;
    }
  }
  /**
   * Processes AI response text and converts to ReviewResult
   */
  processAIResponse(responseText, request) {
    try {
      const filesReviewed = request.changeInfo.files.map((f) => f.path);
      const result = ResponseParser.parseResponse(
        responseText,
        "external-ai",
        filesReviewed
      );
      if (!result) {
        vscode4.window.showErrorMessage(
          "Failed to parse AI response. Please ensure the response is in the correct format."
        );
        return null;
      }
      return result;
    } catch (error) {
      vscode4.window.showErrorMessage(`Error processing AI response: ${error}`);
      return null;
    }
  }
  /**
   * Shows a webview for easier response pasting with syntax highlighting
   */
  async showResponseInputWebview(request) {
    return new Promise((resolve2) => {
      const panel = vscode4.window.createWebviewPanel(
        "aiResponseInput",
        "Paste AI Response",
        vscode4.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      panel.webview.html = this.getWebviewContent();
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "submitResponse": {
              const result = this.processAIResponse(message.response, request);
              panel.dispose();
              resolve2(result);
              break;
            }
            case "cancel": {
              panel.dispose();
              resolve2(null);
              break;
            }
          }
        }
      );
      panel.onDidDispose(() => {
        resolve2(null);
      });
    });
  }
  /**
   * Generates HTML content for the response input webview
   */
  getWebviewContent() {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Paste AI Response</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: var(--vscode-foreground);
                        margin-bottom: 20px;
                    }
                    .instructions {
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    textarea {
                        width: 100%;
                        height: 400px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        padding: 10px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                        resize: vertical;
                    }
                    .button-container {
                        margin-top: 20px;
                        display: flex;
                        gap: 10px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Paste AI Response</h1>
                    <div class="instructions">
                        <strong>Instructions:</strong>
                        <ul>
                            <li>Paste the complete response from your AI provider below</li>
                            <li>The response can be in JSON format or plain text</li>
                            <li>Make sure to include all issues and suggestions</li>
                        </ul>
                    </div>
                    <textarea id="responseInput" placeholder="Paste your AI response here..."></textarea>
                    <div class="button-container">
                        <button onclick="submitResponse()">Process Response</button>
                        <button class="secondary" onclick="cancel()">Cancel</button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function submitResponse() {
                        const response = document.getElementById('responseInput').value;
                        if (!response || response.trim().length < 10) {
                            alert('Please paste a valid AI response (at least 10 characters)');
                            return;
                        }
                        vscode.postMessage({
                            command: 'submitResponse',
                            response: response
                        });
                    }

                    function cancel() {
                        vscode.postMessage({
                            command: 'cancel'
                        });
                    }

                    // Auto-focus the textarea
                    document.getElementById('responseInput').focus();
                </script>
            </body>
            </html>
        `;
  }
  /**
   * Prompts user to select a JSON file containing AI review results and processes it
   */
  async checkReviewResultFromFile() {
    try {
      const workspaceFolder = vscode4.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode4.window.showErrorMessage("No workspace folder found.");
        return null;
      }
      const resultsFolder = vscode4.Uri.joinPath(workspaceFolder.uri, ".ai-code-review", "results");
      try {
        const folderStat = await vscode4.workspace.fs.stat(resultsFolder);
        if (!(folderStat.type & vscode4.FileType.Directory)) {
          vscode4.window.showErrorMessage(".ai-code-review/results is not a directory.");
          return null;
        }
      } catch (error) {
        try {
          await vscode4.workspace.fs.createDirectory(resultsFolder);
        } catch (createError) {
          vscode4.window.showErrorMessage("Failed to create .ai-code-review/results directory.");
          return null;
        }
      }
      const files = await vscode4.workspace.fs.readDirectory(resultsFolder);
      const jsonFiles = files.filter(
        ([name, type]) => type === vscode4.FileType.File && name.endsWith(".json")
      ).sort((a, b) => b[0].localeCompare(a[0]));
      if (jsonFiles.length === 0) {
        vscode4.window.showErrorMessage("No result found. You should paste the prompt first.");
        return null;
      }
      const firstFile = jsonFiles[0][0];
      const fileUri = vscode4.Uri.joinPath(resultsFolder, firstFile);
      const fileContent = await vscode4.workspace.fs.readFile(fileUri);
      const responseText = Buffer.from(fileContent).toString("utf8");
      const dummyRequest = {
        changeInfo: {
          type: "LOCAL",
          source: "file-based-review",
          files: []
        },
        aiProvider: "external-ai",
        options: {
          severityThreshold: "medium",
          includeCodeExamples: true,
          includeSuggestions: true,
          maxIssuesPerFile: 50
        }
      };
      const result = this.processAIResponse(responseText, dummyRequest);
      if (result) {
        vscode4.window.showInformationMessage(
          `Successfully loaded review result from ${firstFile} with ${result.issues.length} issues.`
        );
      } else {
        vscode4.window.showErrorMessage("Failed to parse the review result file. Please check the JSON format.");
      }
      return result;
    } catch (error) {
      vscode4.window.showErrorMessage(`Error reading review result file: ${error}`);
      return null;
    }
  }
  /**
   * Gets the path of the last generated prompt file
   */
  async getLastPromptFilePath() {
    return this.lastPromptFilePath;
  }
  /**
   * Gets the path of the last generated change file
   */
  async getLastChangeFilePath() {
    return this.lastChangeFilePath;
  }
  async storeChangesToFile(changeInfo) {
    const workspacePath = vscode4.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
    const aiReviewDir = path4.join(workspacePath, ".ai-code-review");
    const changesDir = path4.join(aiReviewDir, "changes");
    if (!fs4.existsSync(aiReviewDir)) {
      fs4.mkdirSync(aiReviewDir, { recursive: true });
    }
    if (!fs4.existsSync(changesDir)) {
      fs4.mkdirSync(changesDir, { recursive: true });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const fileName = `ai-code-review-changes-${timestamp}.json`;
    const filePath = path4.join(changesDir, fileName);
    const content = JSON.stringify(changeInfo, null, 2);
    fs4.writeFileSync(filePath, content, "utf8");
    return filePath;
  }
};

// src/core/ChangeDetector.ts
var vscode5 = __toESM(require("vscode"));

// node_modules/simple-git/dist/esm/index.js
var import_node_buffer = require("node:buffer");
var import_file_exists = __toESM(require_dist(), 1);
var import_debug = __toESM(require_src(), 1);
var import_child_process = require("child_process");
var import_promise_deferred = __toESM(require_dist2(), 1);
var import_promise_deferred2 = __toESM(require_dist2(), 1);
var import_node_events = require("node:events");
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames2(fn)[0]])(fn = 0)), res;
};
var __commonJS2 = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export2 = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var __copyProps2 = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames2(from))
      if (!__hasOwnProp2.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
function pathspec(...paths) {
  const key = new String(paths);
  cache.set(key, paths);
  return key;
}
function isPathSpec(path7) {
  return path7 instanceof String && cache.has(path7);
}
function toPaths(pathSpec) {
  return cache.get(pathSpec) || [];
}
var cache;
var init_pathspec = __esm({
  "src/lib/args/pathspec.ts"() {
    "use strict";
    cache = /* @__PURE__ */ new WeakMap();
  }
});
var GitError;
var init_git_error = __esm({
  "src/lib/errors/git-error.ts"() {
    "use strict";
    GitError = class extends Error {
      constructor(task, message) {
        super(message);
        this.task = task;
        Object.setPrototypeOf(this, new.target.prototype);
      }
    };
  }
});
var GitResponseError;
var init_git_response_error = __esm({
  "src/lib/errors/git-response-error.ts"() {
    "use strict";
    init_git_error();
    GitResponseError = class extends GitError {
      constructor(git, message) {
        super(void 0, message || String(git));
        this.git = git;
      }
    };
  }
});
var TaskConfigurationError;
var init_task_configuration_error = __esm({
  "src/lib/errors/task-configuration-error.ts"() {
    "use strict";
    init_git_error();
    TaskConfigurationError = class extends GitError {
      constructor(message) {
        super(void 0, message);
      }
    };
  }
});
function asFunction(source) {
  if (typeof source !== "function") {
    return NOOP;
  }
  return source;
}
function isUserFunction(source) {
  return typeof source === "function" && source !== NOOP;
}
function splitOn(input, char) {
  const index = input.indexOf(char);
  if (index <= 0) {
    return [input, ""];
  }
  return [input.substr(0, index), input.substr(index + 1)];
}
function first(input, offset = 0) {
  return isArrayLike(input) && input.length > offset ? input[offset] : void 0;
}
function last(input, offset = 0) {
  if (isArrayLike(input) && input.length > offset) {
    return input[input.length - 1 - offset];
  }
}
function isArrayLike(input) {
  return !!(input && typeof input.length === "number");
}
function toLinesWithContent(input = "", trimmed2 = true, separator = "\n") {
  return input.split(separator).reduce((output, line) => {
    const lineContent = trimmed2 ? line.trim() : line;
    if (lineContent) {
      output.push(lineContent);
    }
    return output;
  }, []);
}
function forEachLineWithContent(input, callback) {
  return toLinesWithContent(input, true).map((line) => callback(line));
}
function folderExists(path7) {
  return (0, import_file_exists.exists)(path7, import_file_exists.FOLDER);
}
function append(target, item) {
  if (Array.isArray(target)) {
    if (!target.includes(item)) {
      target.push(item);
    }
  } else {
    target.add(item);
  }
  return item;
}
function including(target, item) {
  if (Array.isArray(target) && !target.includes(item)) {
    target.push(item);
  }
  return target;
}
function remove(target, item) {
  if (Array.isArray(target)) {
    const index = target.indexOf(item);
    if (index >= 0) {
      target.splice(index, 1);
    }
  } else {
    target.delete(item);
  }
  return item;
}
function asArray(source) {
  return Array.isArray(source) ? source : [source];
}
function asCamelCase(str) {
  return str.replace(/[\s-]+(.)/g, (_all, chr) => {
    return chr.toUpperCase();
  });
}
function asStringArray(source) {
  return asArray(source).map(String);
}
function asNumber(source, onNaN = 0) {
  if (source == null) {
    return onNaN;
  }
  const num = parseInt(source, 10);
  return isNaN(num) ? onNaN : num;
}
function prefixedArray(input, prefix) {
  const output = [];
  for (let i = 0, max = input.length; i < max; i++) {
    output.push(prefix, input[i]);
  }
  return output;
}
function bufferToString(input) {
  return (Array.isArray(input) ? import_node_buffer.Buffer.concat(input) : input).toString("utf-8");
}
function pick(source, properties) {
  return Object.assign(
    {},
    ...properties.map((property) => property in source ? { [property]: source[property] } : {})
  );
}
function delay(duration = 0) {
  return new Promise((done) => setTimeout(done, duration));
}
function orVoid(input) {
  if (input === false) {
    return void 0;
  }
  return input;
}
var NULL;
var NOOP;
var objectToString;
var init_util = __esm({
  "src/lib/utils/util.ts"() {
    "use strict";
    NULL = "\0";
    NOOP = () => {
    };
    objectToString = Object.prototype.toString.call.bind(Object.prototype.toString);
  }
});
function filterType(input, filter, def) {
  if (filter(input)) {
    return input;
  }
  return arguments.length > 2 ? def : void 0;
}
function filterPrimitives(input, omit) {
  const type = isPathSpec(input) ? "string" : typeof input;
  return /number|string|boolean/.test(type) && (!omit || !omit.includes(type));
}
function filterPlainObject(input) {
  return !!input && objectToString(input) === "[object Object]";
}
function filterFunction(input) {
  return typeof input === "function";
}
var filterArray;
var filterString;
var filterStringArray;
var filterStringOrStringArray;
var filterHasLength;
var init_argument_filters = __esm({
  "src/lib/utils/argument-filters.ts"() {
    "use strict";
    init_util();
    init_pathspec();
    filterArray = (input) => {
      return Array.isArray(input);
    };
    filterString = (input) => {
      return typeof input === "string";
    };
    filterStringArray = (input) => {
      return Array.isArray(input) && input.every(filterString);
    };
    filterStringOrStringArray = (input) => {
      return filterString(input) || Array.isArray(input) && input.every(filterString);
    };
    filterHasLength = (input) => {
      if (input == null || "number|boolean|function".includes(typeof input)) {
        return false;
      }
      return Array.isArray(input) || typeof input === "string" || typeof input.length === "number";
    };
  }
});
var ExitCodes;
var init_exit_codes = __esm({
  "src/lib/utils/exit-codes.ts"() {
    "use strict";
    ExitCodes = /* @__PURE__ */ ((ExitCodes2) => {
      ExitCodes2[ExitCodes2["SUCCESS"] = 0] = "SUCCESS";
      ExitCodes2[ExitCodes2["ERROR"] = 1] = "ERROR";
      ExitCodes2[ExitCodes2["NOT_FOUND"] = -2] = "NOT_FOUND";
      ExitCodes2[ExitCodes2["UNCLEAN"] = 128] = "UNCLEAN";
      return ExitCodes2;
    })(ExitCodes || {});
  }
});
var GitOutputStreams;
var init_git_output_streams = __esm({
  "src/lib/utils/git-output-streams.ts"() {
    "use strict";
    GitOutputStreams = class _GitOutputStreams {
      constructor(stdOut, stdErr) {
        this.stdOut = stdOut;
        this.stdErr = stdErr;
      }
      asStrings() {
        return new _GitOutputStreams(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
      }
    };
  }
});
var LineParser;
var RemoteLineParser;
var init_line_parser = __esm({
  "src/lib/utils/line-parser.ts"() {
    "use strict";
    LineParser = class {
      constructor(regExp, useMatches) {
        this.matches = [];
        this.parse = (line, target) => {
          this.resetMatches();
          if (!this._regExp.every((reg, index) => this.addMatch(reg, index, line(index)))) {
            return false;
          }
          return this.useMatches(target, this.prepareMatches()) !== false;
        };
        this._regExp = Array.isArray(regExp) ? regExp : [regExp];
        if (useMatches) {
          this.useMatches = useMatches;
        }
      }
      // @ts-ignore
      useMatches(target, match) {
        throw new Error(`LineParser:useMatches not implemented`);
      }
      resetMatches() {
        this.matches.length = 0;
      }
      prepareMatches() {
        return this.matches;
      }
      addMatch(reg, index, line) {
        const matched = line && reg.exec(line);
        if (matched) {
          this.pushMatch(index, matched);
        }
        return !!matched;
      }
      pushMatch(_index, matched) {
        this.matches.push(...matched.slice(1));
      }
    };
    RemoteLineParser = class extends LineParser {
      addMatch(reg, index, line) {
        return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
      }
      pushMatch(index, matched) {
        if (index > 0 || matched.length > 1) {
          super.pushMatch(index, matched);
        }
      }
    };
  }
});
function createInstanceConfig(...options) {
  const baseDir = process.cwd();
  const config = Object.assign(
    { baseDir, ...defaultOptions },
    ...options.filter((o) => typeof o === "object" && o)
  );
  config.baseDir = config.baseDir || baseDir;
  config.trimmed = config.trimmed === true;
  return config;
}
var defaultOptions;
var init_simple_git_options = __esm({
  "src/lib/utils/simple-git-options.ts"() {
    "use strict";
    defaultOptions = {
      binary: "git",
      maxConcurrentProcesses: 5,
      config: [],
      trimmed: false
    };
  }
});
function appendTaskOptions(options, commands2 = []) {
  if (!filterPlainObject(options)) {
    return commands2;
  }
  return Object.keys(options).reduce((commands22, key) => {
    const value = options[key];
    if (isPathSpec(value)) {
      commands22.push(value);
    } else if (filterPrimitives(value, ["boolean"])) {
      commands22.push(key + "=" + value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (!filterPrimitives(v, ["string", "number"])) {
          commands22.push(key + "=" + v);
        }
      }
    } else {
      commands22.push(key);
    }
    return commands22;
  }, commands2);
}
function getTrailingOptions(args, initialPrimitive = 0, objectOnly = false) {
  const command = [];
  for (let i = 0, max = initialPrimitive < 0 ? args.length : initialPrimitive; i < max; i++) {
    if ("string|number".includes(typeof args[i])) {
      command.push(String(args[i]));
    }
  }
  appendTaskOptions(trailingOptionsArgument(args), command);
  if (!objectOnly) {
    command.push(...trailingArrayArgument(args));
  }
  return command;
}
function trailingArrayArgument(args) {
  const hasTrailingCallback = typeof last(args) === "function";
  return filterType(last(args, hasTrailingCallback ? 1 : 0), filterArray, []);
}
function trailingOptionsArgument(args) {
  const hasTrailingCallback = filterFunction(last(args));
  return filterType(last(args, hasTrailingCallback ? 1 : 0), filterPlainObject);
}
function trailingFunctionArgument(args, includeNoop = true) {
  const callback = asFunction(last(args));
  return includeNoop || isUserFunction(callback) ? callback : void 0;
}
var init_task_options = __esm({
  "src/lib/utils/task-options.ts"() {
    "use strict";
    init_argument_filters();
    init_util();
    init_pathspec();
  }
});
function callTaskParser(parser4, streams) {
  return parser4(streams.stdOut, streams.stdErr);
}
function parseStringResponse(result, parsers12, texts, trim = true) {
  asArray(texts).forEach((text) => {
    for (let lines = toLinesWithContent(text, trim), i = 0, max = lines.length; i < max; i++) {
      const line = (offset = 0) => {
        if (i + offset >= max) {
          return;
        }
        return lines[i + offset];
      };
      parsers12.some(({ parse }) => parse(line, result));
    }
  });
  return result;
}
var init_task_parser = __esm({
  "src/lib/utils/task-parser.ts"() {
    "use strict";
    init_util();
  }
});
var utils_exports = {};
__export2(utils_exports, {
  ExitCodes: () => ExitCodes,
  GitOutputStreams: () => GitOutputStreams,
  LineParser: () => LineParser,
  NOOP: () => NOOP,
  NULL: () => NULL,
  RemoteLineParser: () => RemoteLineParser,
  append: () => append,
  appendTaskOptions: () => appendTaskOptions,
  asArray: () => asArray,
  asCamelCase: () => asCamelCase,
  asFunction: () => asFunction,
  asNumber: () => asNumber,
  asStringArray: () => asStringArray,
  bufferToString: () => bufferToString,
  callTaskParser: () => callTaskParser,
  createInstanceConfig: () => createInstanceConfig,
  delay: () => delay,
  filterArray: () => filterArray,
  filterFunction: () => filterFunction,
  filterHasLength: () => filterHasLength,
  filterPlainObject: () => filterPlainObject,
  filterPrimitives: () => filterPrimitives,
  filterString: () => filterString,
  filterStringArray: () => filterStringArray,
  filterStringOrStringArray: () => filterStringOrStringArray,
  filterType: () => filterType,
  first: () => first,
  folderExists: () => folderExists,
  forEachLineWithContent: () => forEachLineWithContent,
  getTrailingOptions: () => getTrailingOptions,
  including: () => including,
  isUserFunction: () => isUserFunction,
  last: () => last,
  objectToString: () => objectToString,
  orVoid: () => orVoid,
  parseStringResponse: () => parseStringResponse,
  pick: () => pick,
  prefixedArray: () => prefixedArray,
  remove: () => remove,
  splitOn: () => splitOn,
  toLinesWithContent: () => toLinesWithContent,
  trailingFunctionArgument: () => trailingFunctionArgument,
  trailingOptionsArgument: () => trailingOptionsArgument
});
var init_utils = __esm({
  "src/lib/utils/index.ts"() {
    "use strict";
    init_argument_filters();
    init_exit_codes();
    init_git_output_streams();
    init_line_parser();
    init_simple_git_options();
    init_task_options();
    init_task_parser();
    init_util();
  }
});
var check_is_repo_exports = {};
__export2(check_is_repo_exports, {
  CheckRepoActions: () => CheckRepoActions,
  checkIsBareRepoTask: () => checkIsBareRepoTask,
  checkIsRepoRootTask: () => checkIsRepoRootTask,
  checkIsRepoTask: () => checkIsRepoTask
});
function checkIsRepoTask(action) {
  switch (action) {
    case "bare":
      return checkIsBareRepoTask();
    case "root":
      return checkIsRepoRootTask();
  }
  const commands2 = ["rev-parse", "--is-inside-work-tree"];
  return {
    commands: commands2,
    format: "utf-8",
    onError,
    parser
  };
}
function checkIsRepoRootTask() {
  const commands2 = ["rev-parse", "--git-dir"];
  return {
    commands: commands2,
    format: "utf-8",
    onError,
    parser(path7) {
      return /^\.(git)?$/.test(path7.trim());
    }
  };
}
function checkIsBareRepoTask() {
  const commands2 = ["rev-parse", "--is-bare-repository"];
  return {
    commands: commands2,
    format: "utf-8",
    onError,
    parser
  };
}
function isNotRepoMessage(error) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(error));
}
var CheckRepoActions;
var onError;
var parser;
var init_check_is_repo = __esm({
  "src/lib/tasks/check-is-repo.ts"() {
    "use strict";
    init_utils();
    CheckRepoActions = /* @__PURE__ */ ((CheckRepoActions2) => {
      CheckRepoActions2["BARE"] = "bare";
      CheckRepoActions2["IN_TREE"] = "tree";
      CheckRepoActions2["IS_REPO_ROOT"] = "root";
      return CheckRepoActions2;
    })(CheckRepoActions || {});
    onError = ({ exitCode }, error, done, fail) => {
      if (exitCode === 128 && isNotRepoMessage(error)) {
        return done(Buffer.from("false"));
      }
      fail(error);
    };
    parser = (text) => {
      return text.trim() === "true";
    };
  }
});
function cleanSummaryParser(dryRun, text) {
  const summary = new CleanResponse(dryRun);
  const regexp = dryRun ? dryRunRemovalRegexp : removalRegexp;
  toLinesWithContent(text).forEach((line) => {
    const removed = line.replace(regexp, "");
    summary.paths.push(removed);
    (isFolderRegexp.test(removed) ? summary.folders : summary.files).push(removed);
  });
  return summary;
}
var CleanResponse;
var removalRegexp;
var dryRunRemovalRegexp;
var isFolderRegexp;
var init_CleanSummary = __esm({
  "src/lib/responses/CleanSummary.ts"() {
    "use strict";
    init_utils();
    CleanResponse = class {
      constructor(dryRun) {
        this.dryRun = dryRun;
        this.paths = [];
        this.files = [];
        this.folders = [];
      }
    };
    removalRegexp = /^[a-z]+\s*/i;
    dryRunRemovalRegexp = /^[a-z]+\s+[a-z]+\s*/i;
    isFolderRegexp = /\/$/;
  }
});
var task_exports = {};
__export2(task_exports, {
  EMPTY_COMMANDS: () => EMPTY_COMMANDS,
  adhocExecTask: () => adhocExecTask,
  configurationErrorTask: () => configurationErrorTask,
  isBufferTask: () => isBufferTask,
  isEmptyTask: () => isEmptyTask,
  straightThroughBufferTask: () => straightThroughBufferTask,
  straightThroughStringTask: () => straightThroughStringTask
});
function adhocExecTask(parser4) {
  return {
    commands: EMPTY_COMMANDS,
    format: "empty",
    parser: parser4
  };
}
function configurationErrorTask(error) {
  return {
    commands: EMPTY_COMMANDS,
    format: "empty",
    parser() {
      throw typeof error === "string" ? new TaskConfigurationError(error) : error;
    }
  };
}
function straightThroughStringTask(commands2, trimmed2 = false) {
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return trimmed2 ? String(text).trim() : text;
    }
  };
}
function straightThroughBufferTask(commands2) {
  return {
    commands: commands2,
    format: "buffer",
    parser(buffer) {
      return buffer;
    }
  };
}
function isBufferTask(task) {
  return task.format === "buffer";
}
function isEmptyTask(task) {
  return task.format === "empty" || !task.commands.length;
}
var EMPTY_COMMANDS;
var init_task = __esm({
  "src/lib/tasks/task.ts"() {
    "use strict";
    init_task_configuration_error();
    EMPTY_COMMANDS = [];
  }
});
var clean_exports = {};
__export2(clean_exports, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => CONFIG_ERROR_INTERACTIVE_MODE,
  CONFIG_ERROR_MODE_REQUIRED: () => CONFIG_ERROR_MODE_REQUIRED,
  CONFIG_ERROR_UNKNOWN_OPTION: () => CONFIG_ERROR_UNKNOWN_OPTION,
  CleanOptions: () => CleanOptions,
  cleanTask: () => cleanTask,
  cleanWithOptionsTask: () => cleanWithOptionsTask,
  isCleanOptionsArray: () => isCleanOptionsArray
});
function cleanWithOptionsTask(mode, customArgs) {
  const { cleanMode, options, valid } = getCleanOptions(mode);
  if (!cleanMode) {
    return configurationErrorTask(CONFIG_ERROR_MODE_REQUIRED);
  }
  if (!valid.options) {
    return configurationErrorTask(CONFIG_ERROR_UNKNOWN_OPTION + JSON.stringify(mode));
  }
  options.push(...customArgs);
  if (options.some(isInteractiveMode)) {
    return configurationErrorTask(CONFIG_ERROR_INTERACTIVE_MODE);
  }
  return cleanTask(cleanMode, options);
}
function cleanTask(mode, customArgs) {
  const commands2 = ["clean", `-${mode}`, ...customArgs];
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return cleanSummaryParser(mode === "n", text);
    }
  };
}
function isCleanOptionsArray(input) {
  return Array.isArray(input) && input.every((test) => CleanOptionValues.has(test));
}
function getCleanOptions(input) {
  let cleanMode;
  let options = [];
  let valid = { cleanMode: false, options: true };
  input.replace(/[^a-z]i/g, "").split("").forEach((char) => {
    if (isCleanMode(char)) {
      cleanMode = char;
      valid.cleanMode = true;
    } else {
      valid.options = valid.options && isKnownOption(options[options.length] = `-${char}`);
    }
  });
  return {
    cleanMode,
    options,
    valid
  };
}
function isCleanMode(cleanMode) {
  return cleanMode === "f" || cleanMode === "n";
}
function isKnownOption(option) {
  return /^-[a-z]$/i.test(option) && CleanOptionValues.has(option.charAt(1));
}
function isInteractiveMode(option) {
  if (/^-[^\-]/.test(option)) {
    return option.indexOf("i") > 0;
  }
  return option === "--interactive";
}
var CONFIG_ERROR_INTERACTIVE_MODE;
var CONFIG_ERROR_MODE_REQUIRED;
var CONFIG_ERROR_UNKNOWN_OPTION;
var CleanOptions;
var CleanOptionValues;
var init_clean = __esm({
  "src/lib/tasks/clean.ts"() {
    "use strict";
    init_CleanSummary();
    init_utils();
    init_task();
    CONFIG_ERROR_INTERACTIVE_MODE = "Git clean interactive mode is not supported";
    CONFIG_ERROR_MODE_REQUIRED = 'Git clean mode parameter ("n" or "f") is required';
    CONFIG_ERROR_UNKNOWN_OPTION = "Git clean unknown option found in: ";
    CleanOptions = /* @__PURE__ */ ((CleanOptions2) => {
      CleanOptions2["DRY_RUN"] = "n";
      CleanOptions2["FORCE"] = "f";
      CleanOptions2["IGNORED_INCLUDED"] = "x";
      CleanOptions2["IGNORED_ONLY"] = "X";
      CleanOptions2["EXCLUDING"] = "e";
      CleanOptions2["QUIET"] = "q";
      CleanOptions2["RECURSIVE"] = "d";
      return CleanOptions2;
    })(CleanOptions || {});
    CleanOptionValues = /* @__PURE__ */ new Set([
      "i",
      ...asStringArray(Object.values(CleanOptions))
    ]);
  }
});
function configListParser(text) {
  const config = new ConfigList();
  for (const item of configParser(text)) {
    config.addValue(item.file, String(item.key), item.value);
  }
  return config;
}
function configGetParser(text, key) {
  let value = null;
  const values = [];
  const scopes = /* @__PURE__ */ new Map();
  for (const item of configParser(text, key)) {
    if (item.key !== key) {
      continue;
    }
    values.push(value = item.value);
    if (!scopes.has(item.file)) {
      scopes.set(item.file, []);
    }
    scopes.get(item.file).push(value);
  }
  return {
    key,
    paths: Array.from(scopes.keys()),
    scopes,
    value,
    values
  };
}
function configFilePath(filePath) {
  return filePath.replace(/^(file):/, "");
}
function* configParser(text, requestedKey = null) {
  const lines = text.split("\0");
  for (let i = 0, max = lines.length - 1; i < max; ) {
    const file = configFilePath(lines[i++]);
    let value = lines[i++];
    let key = requestedKey;
    if (value.includes("\n")) {
      const line = splitOn(value, "\n");
      key = line[0];
      value = line[1];
    }
    yield { file, key, value };
  }
}
var ConfigList;
var init_ConfigList = __esm({
  "src/lib/responses/ConfigList.ts"() {
    "use strict";
    init_utils();
    ConfigList = class {
      constructor() {
        this.files = [];
        this.values = /* @__PURE__ */ Object.create(null);
      }
      get all() {
        if (!this._all) {
          this._all = this.files.reduce((all, file) => {
            return Object.assign(all, this.values[file]);
          }, {});
        }
        return this._all;
      }
      addFile(file) {
        if (!(file in this.values)) {
          const latest = last(this.files);
          this.values[file] = latest ? Object.create(this.values[latest]) : {};
          this.files.push(file);
        }
        return this.values[file];
      }
      addValue(file, key, value) {
        const values = this.addFile(file);
        if (!values.hasOwnProperty(key)) {
          values[key] = value;
        } else if (Array.isArray(values[key])) {
          values[key].push(value);
        } else {
          values[key] = [values[key], value];
        }
        this._all = void 0;
      }
    };
  }
});
function asConfigScope(scope, fallback) {
  if (typeof scope === "string" && GitConfigScope.hasOwnProperty(scope)) {
    return scope;
  }
  return fallback;
}
function addConfigTask(key, value, append2, scope) {
  const commands2 = ["config", `--${scope}`];
  if (append2) {
    commands2.push("--add");
  }
  commands2.push(key, value);
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return text;
    }
  };
}
function getConfigTask(key, scope) {
  const commands2 = ["config", "--null", "--show-origin", "--get-all", key];
  if (scope) {
    commands2.splice(1, 0, `--${scope}`);
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return configGetParser(text, key);
    }
  };
}
function listConfigTask(scope) {
  const commands2 = ["config", "--list", "--show-origin", "--null"];
  if (scope) {
    commands2.push(`--${scope}`);
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return configListParser(text);
    }
  };
}
function config_default() {
  return {
    addConfig(key, value, ...rest) {
      return this._runTask(
        addConfigTask(
          key,
          value,
          rest[0] === true,
          asConfigScope(
            rest[1],
            "local"
            /* local */
          )
        ),
        trailingFunctionArgument(arguments)
      );
    },
    getConfig(key, scope) {
      return this._runTask(
        getConfigTask(key, asConfigScope(scope, void 0)),
        trailingFunctionArgument(arguments)
      );
    },
    listConfig(...rest) {
      return this._runTask(
        listConfigTask(asConfigScope(rest[0], void 0)),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var GitConfigScope;
var init_config = __esm({
  "src/lib/tasks/config.ts"() {
    "use strict";
    init_ConfigList();
    init_utils();
    GitConfigScope = /* @__PURE__ */ ((GitConfigScope2) => {
      GitConfigScope2["system"] = "system";
      GitConfigScope2["global"] = "global";
      GitConfigScope2["local"] = "local";
      GitConfigScope2["worktree"] = "worktree";
      return GitConfigScope2;
    })(GitConfigScope || {});
  }
});
function isDiffNameStatus(input) {
  return diffNameStatus.has(input);
}
var DiffNameStatus;
var diffNameStatus;
var init_diff_name_status = __esm({
  "src/lib/tasks/diff-name-status.ts"() {
    "use strict";
    DiffNameStatus = /* @__PURE__ */ ((DiffNameStatus2) => {
      DiffNameStatus2["ADDED"] = "A";
      DiffNameStatus2["COPIED"] = "C";
      DiffNameStatus2["DELETED"] = "D";
      DiffNameStatus2["MODIFIED"] = "M";
      DiffNameStatus2["RENAMED"] = "R";
      DiffNameStatus2["CHANGED"] = "T";
      DiffNameStatus2["UNMERGED"] = "U";
      DiffNameStatus2["UNKNOWN"] = "X";
      DiffNameStatus2["BROKEN"] = "B";
      return DiffNameStatus2;
    })(DiffNameStatus || {});
    diffNameStatus = new Set(Object.values(DiffNameStatus));
  }
});
function grepQueryBuilder(...params) {
  return new GrepQuery().param(...params);
}
function parseGrep(grep) {
  const paths = /* @__PURE__ */ new Set();
  const results = {};
  forEachLineWithContent(grep, (input) => {
    const [path7, line, preview] = input.split(NULL);
    paths.add(path7);
    (results[path7] = results[path7] || []).push({
      line: asNumber(line),
      path: path7,
      preview
    });
  });
  return {
    paths,
    results
  };
}
function grep_default() {
  return {
    grep(searchTerm) {
      const then = trailingFunctionArgument(arguments);
      const options = getTrailingOptions(arguments);
      for (const option of disallowedOptions) {
        if (options.includes(option)) {
          return this._runTask(
            configurationErrorTask(`git.grep: use of "${option}" is not supported.`),
            then
          );
        }
      }
      if (typeof searchTerm === "string") {
        searchTerm = grepQueryBuilder().param(searchTerm);
      }
      const commands2 = ["grep", "--null", "-n", "--full-name", ...options, ...searchTerm];
      return this._runTask(
        {
          commands: commands2,
          format: "utf-8",
          parser(stdOut) {
            return parseGrep(stdOut);
          }
        },
        then
      );
    }
  };
}
var disallowedOptions;
var Query;
var _a;
var GrepQuery;
var init_grep = __esm({
  "src/lib/tasks/grep.ts"() {
    "use strict";
    init_utils();
    init_task();
    disallowedOptions = ["-h"];
    Query = Symbol("grepQuery");
    GrepQuery = class {
      constructor() {
        this[_a] = [];
      }
      *[(_a = Query, Symbol.iterator)]() {
        for (const query of this[Query]) {
          yield query;
        }
      }
      and(...and) {
        and.length && this[Query].push("--and", "(", ...prefixedArray(and, "-e"), ")");
        return this;
      }
      param(...param) {
        this[Query].push(...prefixedArray(param, "-e"));
        return this;
      }
    };
  }
});
var reset_exports = {};
__export2(reset_exports, {
  ResetMode: () => ResetMode,
  getResetMode: () => getResetMode,
  resetTask: () => resetTask
});
function resetTask(mode, customArgs) {
  const commands2 = ["reset"];
  if (isValidResetMode(mode)) {
    commands2.push(`--${mode}`);
  }
  commands2.push(...customArgs);
  return straightThroughStringTask(commands2);
}
function getResetMode(mode) {
  if (isValidResetMode(mode)) {
    return mode;
  }
  switch (typeof mode) {
    case "string":
    case "undefined":
      return "soft";
  }
  return;
}
function isValidResetMode(mode) {
  return ResetModes.includes(mode);
}
var ResetMode;
var ResetModes;
var init_reset = __esm({
  "src/lib/tasks/reset.ts"() {
    "use strict";
    init_task();
    ResetMode = /* @__PURE__ */ ((ResetMode2) => {
      ResetMode2["MIXED"] = "mixed";
      ResetMode2["SOFT"] = "soft";
      ResetMode2["HARD"] = "hard";
      ResetMode2["MERGE"] = "merge";
      ResetMode2["KEEP"] = "keep";
      return ResetMode2;
    })(ResetMode || {});
    ResetModes = Array.from(Object.values(ResetMode));
  }
});
function createLog() {
  return (0, import_debug.default)("simple-git");
}
function prefixedLogger(to, prefix, forward) {
  if (!prefix || !String(prefix).replace(/\s*/, "")) {
    return !forward ? to : (message, ...args) => {
      to(message, ...args);
      forward(message, ...args);
    };
  }
  return (message, ...args) => {
    to(`%s ${message}`, prefix, ...args);
    if (forward) {
      forward(message, ...args);
    }
  };
}
function childLoggerName(name, childDebugger, { namespace: parentNamespace }) {
  if (typeof name === "string") {
    return name;
  }
  const childNamespace = childDebugger && childDebugger.namespace || "";
  if (childNamespace.startsWith(parentNamespace)) {
    return childNamespace.substr(parentNamespace.length + 1);
  }
  return childNamespace || parentNamespace;
}
function createLogger(label, verbose, initialStep, infoDebugger = createLog()) {
  const labelPrefix = label && `[${label}]` || "";
  const spawned = [];
  const debugDebugger = typeof verbose === "string" ? infoDebugger.extend(verbose) : verbose;
  const key = childLoggerName(filterType(verbose, filterString), debugDebugger, infoDebugger);
  return step(initialStep);
  function sibling(name, initial) {
    return append(
      spawned,
      createLogger(label, key.replace(/^[^:]+/, name), initial, infoDebugger)
    );
  }
  function step(phase) {
    const stepPrefix = phase && `[${phase}]` || "";
    const debug2 = debugDebugger && prefixedLogger(debugDebugger, stepPrefix) || NOOP;
    const info = prefixedLogger(infoDebugger, `${labelPrefix} ${stepPrefix}`, debug2);
    return Object.assign(debugDebugger ? debug2 : info, {
      label,
      sibling,
      info,
      step
    });
  }
}
var init_git_logger = __esm({
  "src/lib/git-logger.ts"() {
    "use strict";
    init_utils();
    import_debug.default.formatters.L = (value) => String(filterHasLength(value) ? value.length : "-");
    import_debug.default.formatters.B = (value) => {
      if (Buffer.isBuffer(value)) {
        return value.toString("utf8");
      }
      return objectToString(value);
    };
  }
});
var TasksPendingQueue;
var init_tasks_pending_queue = __esm({
  "src/lib/runners/tasks-pending-queue.ts"() {
    "use strict";
    init_git_error();
    init_git_logger();
    TasksPendingQueue = class _TasksPendingQueue {
      constructor(logLabel = "GitExecutor") {
        this.logLabel = logLabel;
        this._queue = /* @__PURE__ */ new Map();
      }
      withProgress(task) {
        return this._queue.get(task);
      }
      createProgress(task) {
        const name = _TasksPendingQueue.getName(task.commands[0]);
        const logger = createLogger(this.logLabel, name);
        return {
          task,
          logger,
          name
        };
      }
      push(task) {
        const progress = this.createProgress(task);
        progress.logger("Adding task to the queue, commands = %o", task.commands);
        this._queue.set(task, progress);
        return progress;
      }
      fatal(err) {
        for (const [task, { logger }] of Array.from(this._queue.entries())) {
          if (task === err.task) {
            logger.info(`Failed %o`, err);
            logger(
              `Fatal exception, any as-yet un-started tasks run through this executor will not be attempted`
            );
          } else {
            logger.info(
              `A fatal exception occurred in a previous task, the queue has been purged: %o`,
              err.message
            );
          }
          this.complete(task);
        }
        if (this._queue.size !== 0) {
          throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
        }
      }
      complete(task) {
        const progress = this.withProgress(task);
        if (progress) {
          this._queue.delete(task);
        }
      }
      attempt(task) {
        const progress = this.withProgress(task);
        if (!progress) {
          throw new GitError(void 0, "TasksPendingQueue: attempt called for an unknown task");
        }
        progress.logger("Starting task");
        return progress;
      }
      static getName(name = "empty") {
        return `task:${name}:${++_TasksPendingQueue.counter}`;
      }
      static {
        this.counter = 0;
      }
    };
  }
});
function pluginContext(task, commands2) {
  return {
    method: first(task.commands) || "",
    commands: commands2
  };
}
function onErrorReceived(target, logger) {
  return (err) => {
    logger(`[ERROR] child process exception %o`, err);
    target.push(Buffer.from(String(err.stack), "ascii"));
  };
}
function onDataReceived(target, name, logger, output) {
  return (buffer) => {
    logger(`%s received %L bytes`, name, buffer);
    output(`%B`, buffer);
    target.push(buffer);
  };
}
var GitExecutorChain;
var init_git_executor_chain = __esm({
  "src/lib/runners/git-executor-chain.ts"() {
    "use strict";
    init_git_error();
    init_task();
    init_utils();
    init_tasks_pending_queue();
    GitExecutorChain = class {
      constructor(_executor, _scheduler, _plugins) {
        this._executor = _executor;
        this._scheduler = _scheduler;
        this._plugins = _plugins;
        this._chain = Promise.resolve();
        this._queue = new TasksPendingQueue();
      }
      get cwd() {
        return this._cwd || this._executor.cwd;
      }
      set cwd(cwd) {
        this._cwd = cwd;
      }
      get env() {
        return this._executor.env;
      }
      get outputHandler() {
        return this._executor.outputHandler;
      }
      chain() {
        return this;
      }
      push(task) {
        this._queue.push(task);
        return this._chain = this._chain.then(() => this.attemptTask(task));
      }
      async attemptTask(task) {
        const onScheduleComplete = await this._scheduler.next();
        const onQueueComplete = () => this._queue.complete(task);
        try {
          const { logger } = this._queue.attempt(task);
          return await (isEmptyTask(task) ? this.attemptEmptyTask(task, logger) : this.attemptRemoteTask(task, logger));
        } catch (e) {
          throw this.onFatalException(task, e);
        } finally {
          onQueueComplete();
          onScheduleComplete();
        }
      }
      onFatalException(task, e) {
        const gitError = e instanceof GitError ? Object.assign(e, { task }) : new GitError(task, e && String(e));
        this._chain = Promise.resolve();
        this._queue.fatal(gitError);
        return gitError;
      }
      async attemptRemoteTask(task, logger) {
        const binary = this._plugins.exec("spawn.binary", "", pluginContext(task, task.commands));
        const args = this._plugins.exec(
          "spawn.args",
          [...task.commands],
          pluginContext(task, task.commands)
        );
        const raw = await this.gitResponse(
          task,
          binary,
          args,
          this.outputHandler,
          logger.step("SPAWN")
        );
        const outputStreams = await this.handleTaskData(task, args, raw, logger.step("HANDLE"));
        logger(`passing response to task's parser as a %s`, task.format);
        if (isBufferTask(task)) {
          return callTaskParser(task.parser, outputStreams);
        }
        return callTaskParser(task.parser, outputStreams.asStrings());
      }
      async attemptEmptyTask(task, logger) {
        logger(`empty task bypassing child process to call to task's parser`);
        return task.parser(this);
      }
      handleTaskData(task, args, result, logger) {
        const { exitCode, rejection, stdOut, stdErr } = result;
        return new Promise((done, fail) => {
          logger(`Preparing to handle process response exitCode=%d stdOut=`, exitCode);
          const { error } = this._plugins.exec(
            "task.error",
            { error: rejection },
            {
              ...pluginContext(task, args),
              ...result
            }
          );
          if (error && task.onError) {
            logger.info(`exitCode=%s handling with custom error handler`);
            return task.onError(
              result,
              error,
              (newStdOut) => {
                logger.info(`custom error handler treated as success`);
                logger(`custom error returned a %s`, objectToString(newStdOut));
                done(
                  new GitOutputStreams(
                    Array.isArray(newStdOut) ? Buffer.concat(newStdOut) : newStdOut,
                    Buffer.concat(stdErr)
                  )
                );
              },
              fail
            );
          }
          if (error) {
            logger.info(
              `handling as error: exitCode=%s stdErr=%s rejection=%o`,
              exitCode,
              stdErr.length,
              rejection
            );
            return fail(error);
          }
          logger.info(`retrieving task output complete`);
          done(new GitOutputStreams(Buffer.concat(stdOut), Buffer.concat(stdErr)));
        });
      }
      async gitResponse(task, command, args, outputHandler, logger) {
        const outputLogger = logger.sibling("output");
        const spawnOptions = this._plugins.exec(
          "spawn.options",
          {
            cwd: this.cwd,
            env: this.env,
            windowsHide: true
          },
          pluginContext(task, task.commands)
        );
        return new Promise((done) => {
          const stdOut = [];
          const stdErr = [];
          logger.info(`%s %o`, command, args);
          logger("%O", spawnOptions);
          let rejection = this._beforeSpawn(task, args);
          if (rejection) {
            return done({
              stdOut,
              stdErr,
              exitCode: 9901,
              rejection
            });
          }
          this._plugins.exec("spawn.before", void 0, {
            ...pluginContext(task, args),
            kill(reason) {
              rejection = reason || rejection;
            }
          });
          const spawned = (0, import_child_process.spawn)(command, args, spawnOptions);
          spawned.stdout.on(
            "data",
            onDataReceived(stdOut, "stdOut", logger, outputLogger.step("stdOut"))
          );
          spawned.stderr.on(
            "data",
            onDataReceived(stdErr, "stdErr", logger, outputLogger.step("stdErr"))
          );
          spawned.on("error", onErrorReceived(stdErr, logger));
          if (outputHandler) {
            logger(`Passing child process stdOut/stdErr to custom outputHandler`);
            outputHandler(command, spawned.stdout, spawned.stderr, [...args]);
          }
          this._plugins.exec("spawn.after", void 0, {
            ...pluginContext(task, args),
            spawned,
            close(exitCode, reason) {
              done({
                stdOut,
                stdErr,
                exitCode,
                rejection: rejection || reason
              });
            },
            kill(reason) {
              if (spawned.killed) {
                return;
              }
              rejection = reason;
              spawned.kill("SIGINT");
            }
          });
        });
      }
      _beforeSpawn(task, args) {
        let rejection;
        this._plugins.exec("spawn.before", void 0, {
          ...pluginContext(task, args),
          kill(reason) {
            rejection = reason || rejection;
          }
        });
        return rejection;
      }
    };
  }
});
var git_executor_exports = {};
__export2(git_executor_exports, {
  GitExecutor: () => GitExecutor
});
var GitExecutor;
var init_git_executor = __esm({
  "src/lib/runners/git-executor.ts"() {
    "use strict";
    init_git_executor_chain();
    GitExecutor = class {
      constructor(cwd, _scheduler, _plugins) {
        this.cwd = cwd;
        this._scheduler = _scheduler;
        this._plugins = _plugins;
        this._chain = new GitExecutorChain(this, this._scheduler, this._plugins);
      }
      chain() {
        return new GitExecutorChain(this, this._scheduler, this._plugins);
      }
      push(task) {
        return this._chain.push(task);
      }
    };
  }
});
function taskCallback(task, response, callback = NOOP) {
  const onSuccess = (data) => {
    callback(null, data);
  };
  const onError2 = (err) => {
    if (err?.task === task) {
      callback(
        err instanceof GitResponseError ? addDeprecationNoticeToError(err) : err,
        void 0
      );
    }
  };
  response.then(onSuccess, onError2);
}
function addDeprecationNoticeToError(err) {
  let log = (name) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${name} should be GitResponseError.git.${name}, this will no longer be available in version 3`
    );
    log = NOOP;
  };
  return Object.create(err, Object.getOwnPropertyNames(err.git).reduce(descriptorReducer, {}));
  function descriptorReducer(all, name) {
    if (name in err) {
      return all;
    }
    all[name] = {
      enumerable: false,
      configurable: false,
      get() {
        log(name);
        return err.git[name];
      }
    };
    return all;
  }
}
var init_task_callback = __esm({
  "src/lib/task-callback.ts"() {
    "use strict";
    init_git_response_error();
    init_utils();
  }
});
function changeWorkingDirectoryTask(directory, root) {
  return adhocExecTask((instance) => {
    if (!folderExists(directory)) {
      throw new Error(`Git.cwd: cannot change to non-directory "${directory}"`);
    }
    return (root || instance).cwd = directory;
  });
}
var init_change_working_directory = __esm({
  "src/lib/tasks/change-working-directory.ts"() {
    "use strict";
    init_utils();
    init_task();
  }
});
function checkoutTask(args) {
  const commands2 = ["checkout", ...args];
  if (commands2[1] === "-b" && commands2.includes("-B")) {
    commands2[1] = remove(commands2, "-B");
  }
  return straightThroughStringTask(commands2);
}
function checkout_default() {
  return {
    checkout() {
      return this._runTask(
        checkoutTask(getTrailingOptions(arguments, 1)),
        trailingFunctionArgument(arguments)
      );
    },
    checkoutBranch(branchName, startPoint) {
      return this._runTask(
        checkoutTask(["-b", branchName, startPoint, ...getTrailingOptions(arguments)]),
        trailingFunctionArgument(arguments)
      );
    },
    checkoutLocalBranch(branchName) {
      return this._runTask(
        checkoutTask(["-b", branchName, ...getTrailingOptions(arguments)]),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_checkout = __esm({
  "src/lib/tasks/checkout.ts"() {
    "use strict";
    init_utils();
    init_task();
  }
});
function countObjectsResponse() {
  return {
    count: 0,
    garbage: 0,
    inPack: 0,
    packs: 0,
    prunePackable: 0,
    size: 0,
    sizeGarbage: 0,
    sizePack: 0
  };
}
function count_objects_default() {
  return {
    countObjects() {
      return this._runTask({
        commands: ["count-objects", "--verbose"],
        format: "utf-8",
        parser(stdOut) {
          return parseStringResponse(countObjectsResponse(), [parser2], stdOut);
        }
      });
    }
  };
}
var parser2;
var init_count_objects = __esm({
  "src/lib/tasks/count-objects.ts"() {
    "use strict";
    init_utils();
    parser2 = new LineParser(
      /([a-z-]+): (\d+)$/,
      (result, [key, value]) => {
        const property = asCamelCase(key);
        if (result.hasOwnProperty(property)) {
          result[property] = asNumber(value);
        }
      }
    );
  }
});
function parseCommitResult(stdOut) {
  const result = {
    author: null,
    branch: "",
    commit: "",
    root: false,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  };
  return parseStringResponse(result, parsers, stdOut);
}
var parsers;
var init_parse_commit = __esm({
  "src/lib/parsers/parse-commit.ts"() {
    "use strict";
    init_utils();
    parsers = [
      new LineParser(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (result, [branch, root, commit]) => {
        result.branch = branch;
        result.commit = commit;
        result.root = !!root;
      }),
      new LineParser(/\s*Author:\s(.+)/i, (result, [author]) => {
        const parts = author.split("<");
        const email = parts.pop();
        if (!email || !email.includes("@")) {
          return;
        }
        result.author = {
          email: email.substr(0, email.length - 1),
          name: parts.join("<").trim()
        };
      }),
      new LineParser(
        /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
        (result, [changes, insertions, deletions]) => {
          result.summary.changes = parseInt(changes, 10) || 0;
          result.summary.insertions = parseInt(insertions, 10) || 0;
          result.summary.deletions = parseInt(deletions, 10) || 0;
        }
      ),
      new LineParser(
        /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
        (result, [changes, lines, direction]) => {
          result.summary.changes = parseInt(changes, 10) || 0;
          const count = parseInt(lines, 10) || 0;
          if (direction === "-") {
            result.summary.deletions = count;
          } else if (direction === "+") {
            result.summary.insertions = count;
          }
        }
      )
    ];
  }
});
function commitTask(message, files, customArgs) {
  const commands2 = [
    "-c",
    "core.abbrev=40",
    "commit",
    ...prefixedArray(message, "-m"),
    ...files,
    ...customArgs
  ];
  return {
    commands: commands2,
    format: "utf-8",
    parser: parseCommitResult
  };
}
function commit_default() {
  return {
    commit(message, ...rest) {
      const next = trailingFunctionArgument(arguments);
      const task = rejectDeprecatedSignatures(message) || commitTask(
        asArray(message),
        asArray(filterType(rest[0], filterStringOrStringArray, [])),
        [...filterType(rest[1], filterArray, []), ...getTrailingOptions(arguments, 0, true)]
      );
      return this._runTask(task, next);
    }
  };
  function rejectDeprecatedSignatures(message) {
    return !filterStringOrStringArray(message) && configurationErrorTask(
      `git.commit: requires the commit message to be supplied as a string/string[]`
    );
  }
}
var init_commit = __esm({
  "src/lib/tasks/commit.ts"() {
    "use strict";
    init_parse_commit();
    init_utils();
    init_task();
  }
});
function first_commit_default() {
  return {
    firstCommit() {
      return this._runTask(
        straightThroughStringTask(["rev-list", "--max-parents=0", "HEAD"], true),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_first_commit = __esm({
  "src/lib/tasks/first-commit.ts"() {
    "use strict";
    init_utils();
    init_task();
  }
});
function hashObjectTask(filePath, write) {
  const commands2 = ["hash-object", filePath];
  if (write) {
    commands2.push("-w");
  }
  return straightThroughStringTask(commands2, true);
}
var init_hash_object = __esm({
  "src/lib/tasks/hash-object.ts"() {
    "use strict";
    init_task();
  }
});
function parseInit(bare, path7, text) {
  const response = String(text).trim();
  let result;
  if (result = initResponseRegex.exec(response)) {
    return new InitSummary(bare, path7, false, result[1]);
  }
  if (result = reInitResponseRegex.exec(response)) {
    return new InitSummary(bare, path7, true, result[1]);
  }
  let gitDir = "";
  const tokens = response.split(" ");
  while (tokens.length) {
    const token = tokens.shift();
    if (token === "in") {
      gitDir = tokens.join(" ");
      break;
    }
  }
  return new InitSummary(bare, path7, /^re/i.test(response), gitDir);
}
var InitSummary;
var initResponseRegex;
var reInitResponseRegex;
var init_InitSummary = __esm({
  "src/lib/responses/InitSummary.ts"() {
    "use strict";
    InitSummary = class {
      constructor(bare, path7, existing, gitDir) {
        this.bare = bare;
        this.path = path7;
        this.existing = existing;
        this.gitDir = gitDir;
      }
    };
    initResponseRegex = /^Init.+ repository in (.+)$/;
    reInitResponseRegex = /^Rein.+ in (.+)$/;
  }
});
function hasBareCommand(command) {
  return command.includes(bareCommand);
}
function initTask(bare = false, path7, customArgs) {
  const commands2 = ["init", ...customArgs];
  if (bare && !hasBareCommand(commands2)) {
    commands2.splice(1, 0, bareCommand);
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser(text) {
      return parseInit(commands2.includes("--bare"), path7, text);
    }
  };
}
var bareCommand;
var init_init = __esm({
  "src/lib/tasks/init.ts"() {
    "use strict";
    init_InitSummary();
    bareCommand = "--bare";
  }
});
function logFormatFromCommand(customArgs) {
  for (let i = 0; i < customArgs.length; i++) {
    const format = logFormatRegex.exec(customArgs[i]);
    if (format) {
      return `--${format[1]}`;
    }
  }
  return "";
}
function isLogFormat(customArg) {
  return logFormatRegex.test(customArg);
}
var logFormatRegex;
var init_log_format = __esm({
  "src/lib/args/log-format.ts"() {
    "use strict";
    logFormatRegex = /^--(stat|numstat|name-only|name-status)(=|$)/;
  }
});
var DiffSummary;
var init_DiffSummary = __esm({
  "src/lib/responses/DiffSummary.ts"() {
    "use strict";
    DiffSummary = class {
      constructor() {
        this.changed = 0;
        this.deletions = 0;
        this.insertions = 0;
        this.files = [];
      }
    };
  }
});
function getDiffParser(format = "") {
  const parser4 = diffSummaryParsers[format];
  return (stdOut) => parseStringResponse(new DiffSummary(), parser4, stdOut, false);
}
var statParser;
var numStatParser;
var nameOnlyParser;
var nameStatusParser;
var diffSummaryParsers;
var init_parse_diff_summary = __esm({
  "src/lib/parsers/parse-diff-summary.ts"() {
    "use strict";
    init_log_format();
    init_DiffSummary();
    init_diff_name_status();
    init_utils();
    statParser = [
      new LineParser(
        /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
        (result, [file, changes, alterations = ""]) => {
          result.files.push({
            file: file.trim(),
            changes: asNumber(changes),
            insertions: alterations.replace(/[^+]/g, "").length,
            deletions: alterations.replace(/[^-]/g, "").length,
            binary: false
          });
        }
      ),
      new LineParser(
        /^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
        (result, [file, before, after]) => {
          result.files.push({
            file: file.trim(),
            before: asNumber(before),
            after: asNumber(after),
            binary: true
          });
        }
      ),
      new LineParser(
        /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
        (result, [changed, summary]) => {
          const inserted = /(\d+) i/.exec(summary);
          const deleted = /(\d+) d/.exec(summary);
          result.changed = asNumber(changed);
          result.insertions = asNumber(inserted?.[1]);
          result.deletions = asNumber(deleted?.[1]);
        }
      )
    ];
    numStatParser = [
      new LineParser(
        /(\d+)\t(\d+)\t(.+)$/,
        (result, [changesInsert, changesDelete, file]) => {
          const insertions = asNumber(changesInsert);
          const deletions = asNumber(changesDelete);
          result.changed++;
          result.insertions += insertions;
          result.deletions += deletions;
          result.files.push({
            file,
            changes: insertions + deletions,
            insertions,
            deletions,
            binary: false
          });
        }
      ),
      new LineParser(/-\t-\t(.+)$/, (result, [file]) => {
        result.changed++;
        result.files.push({
          file,
          after: 0,
          before: 0,
          binary: true
        });
      })
    ];
    nameOnlyParser = [
      new LineParser(/(.+)$/, (result, [file]) => {
        result.changed++;
        result.files.push({
          file,
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: false
        });
      })
    ];
    nameStatusParser = [
      new LineParser(
        /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
        (result, [status, similarity, from, _to, to]) => {
          result.changed++;
          result.files.push({
            file: to ?? from,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: false,
            status: orVoid(isDiffNameStatus(status) && status),
            from: orVoid(!!to && from !== to && from),
            similarity: asNumber(similarity)
          });
        }
      )
    ];
    diffSummaryParsers = {
      [
        ""
        /* NONE */
      ]: statParser,
      [
        "--stat"
        /* STAT */
      ]: statParser,
      [
        "--numstat"
        /* NUM_STAT */
      ]: numStatParser,
      [
        "--name-status"
        /* NAME_STATUS */
      ]: nameStatusParser,
      [
        "--name-only"
        /* NAME_ONLY */
      ]: nameOnlyParser
    };
  }
});
function lineBuilder(tokens, fields) {
  return fields.reduce(
    (line, field, index) => {
      line[field] = tokens[index] || "";
      return line;
    },
    /* @__PURE__ */ Object.create({ diff: null })
  );
}
function createListLogSummaryParser(splitter = SPLITTER, fields = defaultFieldNames, logFormat = "") {
  const parseDiffResult = getDiffParser(logFormat);
  return function(stdOut) {
    const all = toLinesWithContent(
      stdOut.trim(),
      false,
      START_BOUNDARY
    ).map(function(item) {
      const lineDetail = item.split(COMMIT_BOUNDARY);
      const listLogLine = lineBuilder(lineDetail[0].split(splitter), fields);
      if (lineDetail.length > 1 && !!lineDetail[1].trim()) {
        listLogLine.diff = parseDiffResult(lineDetail[1]);
      }
      return listLogLine;
    });
    return {
      all,
      latest: all.length && all[0] || null,
      total: all.length
    };
  };
}
var START_BOUNDARY;
var COMMIT_BOUNDARY;
var SPLITTER;
var defaultFieldNames;
var init_parse_list_log_summary = __esm({
  "src/lib/parsers/parse-list-log-summary.ts"() {
    "use strict";
    init_utils();
    init_parse_diff_summary();
    init_log_format();
    START_BOUNDARY = "\xF2\xF2\xF2\xF2\xF2\xF2 ";
    COMMIT_BOUNDARY = " \xF2\xF2";
    SPLITTER = " \xF2 ";
    defaultFieldNames = ["hash", "date", "message", "refs", "author_name", "author_email"];
  }
});
var diff_exports = {};
__export2(diff_exports, {
  diffSummaryTask: () => diffSummaryTask,
  validateLogFormatConfig: () => validateLogFormatConfig
});
function diffSummaryTask(customArgs) {
  let logFormat = logFormatFromCommand(customArgs);
  const commands2 = ["diff"];
  if (logFormat === "") {
    logFormat = "--stat";
    commands2.push("--stat=4096");
  }
  commands2.push(...customArgs);
  return validateLogFormatConfig(commands2) || {
    commands: commands2,
    format: "utf-8",
    parser: getDiffParser(logFormat)
  };
}
function validateLogFormatConfig(customArgs) {
  const flags = customArgs.filter(isLogFormat);
  if (flags.length > 1) {
    return configurationErrorTask(
      `Summary flags are mutually exclusive - pick one of ${flags.join(",")}`
    );
  }
  if (flags.length && customArgs.includes("-z")) {
    return configurationErrorTask(
      `Summary flag ${flags} parsing is not compatible with null termination option '-z'`
    );
  }
}
var init_diff = __esm({
  "src/lib/tasks/diff.ts"() {
    "use strict";
    init_log_format();
    init_parse_diff_summary();
    init_task();
  }
});
function prettyFormat(format, splitter) {
  const fields = [];
  const formatStr = [];
  Object.keys(format).forEach((field) => {
    fields.push(field);
    formatStr.push(String(format[field]));
  });
  return [fields, formatStr.join(splitter)];
}
function userOptions(input) {
  return Object.keys(input).reduce((out, key) => {
    if (!(key in excludeOptions)) {
      out[key] = input[key];
    }
    return out;
  }, {});
}
function parseLogOptions(opt = {}, customArgs = []) {
  const splitter = filterType(opt.splitter, filterString, SPLITTER);
  const format = filterPlainObject(opt.format) ? opt.format : {
    hash: "%H",
    date: opt.strictDate === false ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: opt.multiLine ? "%B" : "%b",
    author_name: opt.mailMap !== false ? "%aN" : "%an",
    author_email: opt.mailMap !== false ? "%aE" : "%ae"
  };
  const [fields, formatStr] = prettyFormat(format, splitter);
  const suffix = [];
  const command = [
    `--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`,
    ...customArgs
  ];
  const maxCount = opt.n || opt["max-count"] || opt.maxCount;
  if (maxCount) {
    command.push(`--max-count=${maxCount}`);
  }
  if (opt.from || opt.to) {
    const rangeOperator = opt.symmetric !== false ? "..." : "..";
    suffix.push(`${opt.from || ""}${rangeOperator}${opt.to || ""}`);
  }
  if (filterString(opt.file)) {
    command.push("--follow", pathspec(opt.file));
  }
  appendTaskOptions(userOptions(opt), command);
  return {
    fields,
    splitter,
    commands: [...command, ...suffix]
  };
}
function logTask(splitter, fields, customArgs) {
  const parser4 = createListLogSummaryParser(splitter, fields, logFormatFromCommand(customArgs));
  return {
    commands: ["log", ...customArgs],
    format: "utf-8",
    parser: parser4
  };
}
function log_default() {
  return {
    log(...rest) {
      const next = trailingFunctionArgument(arguments);
      const options = parseLogOptions(
        trailingOptionsArgument(arguments),
        filterType(arguments[0], filterArray)
      );
      const task = rejectDeprecatedSignatures(...rest) || validateLogFormatConfig(options.commands) || createLogTask(options);
      return this._runTask(task, next);
    }
  };
  function createLogTask(options) {
    return logTask(options.splitter, options.fields, options.commands);
  }
  function rejectDeprecatedSignatures(from, to) {
    return filterString(from) && filterString(to) && configurationErrorTask(
      `git.log(string, string) should be replaced with git.log({ from: string, to: string })`
    );
  }
}
var excludeOptions;
var init_log = __esm({
  "src/lib/tasks/log.ts"() {
    "use strict";
    init_log_format();
    init_pathspec();
    init_parse_list_log_summary();
    init_utils();
    init_task();
    init_diff();
    excludeOptions = /* @__PURE__ */ ((excludeOptions2) => {
      excludeOptions2[excludeOptions2["--pretty"] = 0] = "--pretty";
      excludeOptions2[excludeOptions2["max-count"] = 1] = "max-count";
      excludeOptions2[excludeOptions2["maxCount"] = 2] = "maxCount";
      excludeOptions2[excludeOptions2["n"] = 3] = "n";
      excludeOptions2[excludeOptions2["file"] = 4] = "file";
      excludeOptions2[excludeOptions2["format"] = 5] = "format";
      excludeOptions2[excludeOptions2["from"] = 6] = "from";
      excludeOptions2[excludeOptions2["to"] = 7] = "to";
      excludeOptions2[excludeOptions2["splitter"] = 8] = "splitter";
      excludeOptions2[excludeOptions2["symmetric"] = 9] = "symmetric";
      excludeOptions2[excludeOptions2["mailMap"] = 10] = "mailMap";
      excludeOptions2[excludeOptions2["multiLine"] = 11] = "multiLine";
      excludeOptions2[excludeOptions2["strictDate"] = 12] = "strictDate";
      return excludeOptions2;
    })(excludeOptions || {});
  }
});
var MergeSummaryConflict;
var MergeSummaryDetail;
var init_MergeSummary = __esm({
  "src/lib/responses/MergeSummary.ts"() {
    "use strict";
    MergeSummaryConflict = class {
      constructor(reason, file = null, meta) {
        this.reason = reason;
        this.file = file;
        this.meta = meta;
      }
      toString() {
        return `${this.file}:${this.reason}`;
      }
    };
    MergeSummaryDetail = class {
      constructor() {
        this.conflicts = [];
        this.merges = [];
        this.result = "success";
      }
      get failed() {
        return this.conflicts.length > 0;
      }
      get reason() {
        return this.result;
      }
      toString() {
        if (this.conflicts.length) {
          return `CONFLICTS: ${this.conflicts.join(", ")}`;
        }
        return "OK";
      }
    };
  }
});
var PullSummary;
var PullFailedSummary;
var init_PullSummary = __esm({
  "src/lib/responses/PullSummary.ts"() {
    "use strict";
    PullSummary = class {
      constructor() {
        this.remoteMessages = {
          all: []
        };
        this.created = [];
        this.deleted = [];
        this.files = [];
        this.deletions = {};
        this.insertions = {};
        this.summary = {
          changes: 0,
          deletions: 0,
          insertions: 0
        };
      }
    };
    PullFailedSummary = class {
      constructor() {
        this.remote = "";
        this.hash = {
          local: "",
          remote: ""
        };
        this.branch = {
          local: "",
          remote: ""
        };
        this.message = "";
      }
      toString() {
        return this.message;
      }
    };
  }
});
function objectEnumerationResult(remoteMessages) {
  return remoteMessages.objects = remoteMessages.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 }
  };
}
function asObjectCount(source) {
  const count = /^\s*(\d+)/.exec(source);
  const delta = /delta (\d+)/i.exec(source);
  return {
    count: asNumber(count && count[1] || "0"),
    delta: asNumber(delta && delta[1] || "0")
  };
}
var remoteMessagesObjectParsers;
var init_parse_remote_objects = __esm({
  "src/lib/parsers/parse-remote-objects.ts"() {
    "use strict";
    init_utils();
    remoteMessagesObjectParsers = [
      new RemoteLineParser(
        /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
        (result, [action, count]) => {
          const key = action.toLowerCase();
          const enumeration = objectEnumerationResult(result.remoteMessages);
          Object.assign(enumeration, { [key]: asNumber(count) });
        }
      ),
      new RemoteLineParser(
        /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
        (result, [action, count]) => {
          const key = action.toLowerCase();
          const enumeration = objectEnumerationResult(result.remoteMessages);
          Object.assign(enumeration, { [key]: asNumber(count) });
        }
      ),
      new RemoteLineParser(
        /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
        (result, [total, reused, packReused]) => {
          const objects = objectEnumerationResult(result.remoteMessages);
          objects.total = asObjectCount(total);
          objects.reused = asObjectCount(reused);
          objects.packReused = asNumber(packReused);
        }
      )
    ];
  }
});
function parseRemoteMessages(_stdOut, stdErr) {
  return parseStringResponse({ remoteMessages: new RemoteMessageSummary() }, parsers2, stdErr);
}
var parsers2;
var RemoteMessageSummary;
var init_parse_remote_messages = __esm({
  "src/lib/parsers/parse-remote-messages.ts"() {
    "use strict";
    init_utils();
    init_parse_remote_objects();
    parsers2 = [
      new RemoteLineParser(/^remote:\s*(.+)$/, (result, [text]) => {
        result.remoteMessages.all.push(text.trim());
        return false;
      }),
      ...remoteMessagesObjectParsers,
      new RemoteLineParser(
        [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
        (result, [pullRequestUrl]) => {
          result.remoteMessages.pullRequestUrl = pullRequestUrl;
        }
      ),
      new RemoteLineParser(
        [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
        (result, [count, summary, url]) => {
          result.remoteMessages.vulnerabilities = {
            count: asNumber(count),
            summary,
            url
          };
        }
      )
    ];
    RemoteMessageSummary = class {
      constructor() {
        this.all = [];
      }
    };
  }
});
function parsePullErrorResult(stdOut, stdErr) {
  const pullError = parseStringResponse(new PullFailedSummary(), errorParsers, [stdOut, stdErr]);
  return pullError.message && pullError;
}
var FILE_UPDATE_REGEX;
var SUMMARY_REGEX;
var ACTION_REGEX;
var parsers3;
var errorParsers;
var parsePullDetail;
var parsePullResult;
var init_parse_pull = __esm({
  "src/lib/parsers/parse-pull.ts"() {
    "use strict";
    init_PullSummary();
    init_utils();
    init_parse_remote_messages();
    FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/;
    SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/;
    ACTION_REGEX = /^(create|delete) mode \d+ (.+)/;
    parsers3 = [
      new LineParser(FILE_UPDATE_REGEX, (result, [file, insertions, deletions]) => {
        result.files.push(file);
        if (insertions) {
          result.insertions[file] = insertions.length;
        }
        if (deletions) {
          result.deletions[file] = deletions.length;
        }
      }),
      new LineParser(SUMMARY_REGEX, (result, [changes, , insertions, , deletions]) => {
        if (insertions !== void 0 || deletions !== void 0) {
          result.summary.changes = +changes || 0;
          result.summary.insertions = +insertions || 0;
          result.summary.deletions = +deletions || 0;
          return true;
        }
        return false;
      }),
      new LineParser(ACTION_REGEX, (result, [action, file]) => {
        append(result.files, file);
        append(action === "create" ? result.created : result.deleted, file);
      })
    ];
    errorParsers = [
      new LineParser(/^from\s(.+)$/i, (result, [remote]) => void (result.remote = remote)),
      new LineParser(/^fatal:\s(.+)$/, (result, [message]) => void (result.message = message)),
      new LineParser(
        /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
        (result, [hashLocal, hashRemote, branchLocal, branchRemote]) => {
          result.branch.local = branchLocal;
          result.hash.local = hashLocal;
          result.branch.remote = branchRemote;
          result.hash.remote = hashRemote;
        }
      )
    ];
    parsePullDetail = (stdOut, stdErr) => {
      return parseStringResponse(new PullSummary(), parsers3, [stdOut, stdErr]);
    };
    parsePullResult = (stdOut, stdErr) => {
      return Object.assign(
        new PullSummary(),
        parsePullDetail(stdOut, stdErr),
        parseRemoteMessages(stdOut, stdErr)
      );
    };
  }
});
var parsers4;
var parseMergeResult;
var parseMergeDetail;
var init_parse_merge = __esm({
  "src/lib/parsers/parse-merge.ts"() {
    "use strict";
    init_MergeSummary();
    init_utils();
    init_parse_pull();
    parsers4 = [
      new LineParser(/^Auto-merging\s+(.+)$/, (summary, [autoMerge]) => {
        summary.merges.push(autoMerge);
      }),
      new LineParser(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (summary, [reason, file]) => {
        summary.conflicts.push(new MergeSummaryConflict(reason, file));
      }),
      new LineParser(
        /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
        (summary, [reason, file, deleteRef]) => {
          summary.conflicts.push(new MergeSummaryConflict(reason, file, { deleteRef }));
        }
      ),
      new LineParser(/^CONFLICT\s+\((.+)\):/, (summary, [reason]) => {
        summary.conflicts.push(new MergeSummaryConflict(reason, null));
      }),
      new LineParser(/^Automatic merge failed;\s+(.+)$/, (summary, [result]) => {
        summary.result = result;
      })
    ];
    parseMergeResult = (stdOut, stdErr) => {
      return Object.assign(parseMergeDetail(stdOut, stdErr), parsePullResult(stdOut, stdErr));
    };
    parseMergeDetail = (stdOut) => {
      return parseStringResponse(new MergeSummaryDetail(), parsers4, stdOut);
    };
  }
});
function mergeTask(customArgs) {
  if (!customArgs.length) {
    return configurationErrorTask("Git.merge requires at least one option");
  }
  return {
    commands: ["merge", ...customArgs],
    format: "utf-8",
    parser(stdOut, stdErr) {
      const merge = parseMergeResult(stdOut, stdErr);
      if (merge.failed) {
        throw new GitResponseError(merge);
      }
      return merge;
    }
  };
}
var init_merge = __esm({
  "src/lib/tasks/merge.ts"() {
    "use strict";
    init_git_response_error();
    init_parse_merge();
    init_task();
  }
});
function pushResultPushedItem(local, remote, status) {
  const deleted = status.includes("deleted");
  const tag = status.includes("tag") || /^refs\/tags/.test(local);
  const alreadyUpdated = !status.includes("new");
  return {
    deleted,
    tag,
    branch: !tag,
    new: !alreadyUpdated,
    alreadyUpdated,
    local,
    remote
  };
}
var parsers5;
var parsePushResult;
var parsePushDetail;
var init_parse_push = __esm({
  "src/lib/parsers/parse-push.ts"() {
    "use strict";
    init_utils();
    init_parse_remote_messages();
    parsers5 = [
      new LineParser(/^Pushing to (.+)$/, (result, [repo]) => {
        result.repo = repo;
      }),
      new LineParser(/^updating local tracking ref '(.+)'/, (result, [local]) => {
        result.ref = {
          ...result.ref || {},
          local
        };
      }),
      new LineParser(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (result, [local, remote, type]) => {
        result.pushed.push(pushResultPushedItem(local, remote, type));
      }),
      new LineParser(
        /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
        (result, [local, remote, remoteName]) => {
          result.branch = {
            ...result.branch || {},
            local,
            remote,
            remoteName
          };
        }
      ),
      new LineParser(
        /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
        (result, [local, remote, from, to]) => {
          result.update = {
            head: {
              local,
              remote
            },
            hash: {
              from,
              to
            }
          };
        }
      )
    ];
    parsePushResult = (stdOut, stdErr) => {
      const pushDetail = parsePushDetail(stdOut, stdErr);
      const responseDetail = parseRemoteMessages(stdOut, stdErr);
      return {
        ...pushDetail,
        ...responseDetail
      };
    };
    parsePushDetail = (stdOut, stdErr) => {
      return parseStringResponse({ pushed: [] }, parsers5, [stdOut, stdErr]);
    };
  }
});
var push_exports = {};
__export2(push_exports, {
  pushTagsTask: () => pushTagsTask,
  pushTask: () => pushTask
});
function pushTagsTask(ref = {}, customArgs) {
  append(customArgs, "--tags");
  return pushTask(ref, customArgs);
}
function pushTask(ref = {}, customArgs) {
  const commands2 = ["push", ...customArgs];
  if (ref.branch) {
    commands2.splice(1, 0, ref.branch);
  }
  if (ref.remote) {
    commands2.splice(1, 0, ref.remote);
  }
  remove(commands2, "-v");
  append(commands2, "--verbose");
  append(commands2, "--porcelain");
  return {
    commands: commands2,
    format: "utf-8",
    parser: parsePushResult
  };
}
var init_push = __esm({
  "src/lib/tasks/push.ts"() {
    "use strict";
    init_parse_push();
    init_utils();
  }
});
function show_default() {
  return {
    showBuffer() {
      const commands2 = ["show", ...getTrailingOptions(arguments, 1)];
      if (!commands2.includes("--binary")) {
        commands2.splice(1, 0, "--binary");
      }
      return this._runTask(
        straightThroughBufferTask(commands2),
        trailingFunctionArgument(arguments)
      );
    },
    show() {
      const commands2 = ["show", ...getTrailingOptions(arguments, 1)];
      return this._runTask(
        straightThroughStringTask(commands2),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_show = __esm({
  "src/lib/tasks/show.ts"() {
    "use strict";
    init_utils();
    init_task();
  }
});
var fromPathRegex;
var FileStatusSummary;
var init_FileStatusSummary = __esm({
  "src/lib/responses/FileStatusSummary.ts"() {
    "use strict";
    fromPathRegex = /^(.+)\0(.+)$/;
    FileStatusSummary = class {
      constructor(path7, index, working_dir) {
        this.path = path7;
        this.index = index;
        this.working_dir = working_dir;
        if (index === "R" || working_dir === "R") {
          const detail = fromPathRegex.exec(path7) || [null, path7, path7];
          this.from = detail[2] || "";
          this.path = detail[1] || "";
        }
      }
    };
  }
});
function renamedFile(line) {
  const [to, from] = line.split(NULL);
  return {
    from: from || to,
    to
  };
}
function parser3(indexX, indexY, handler) {
  return [`${indexX}${indexY}`, handler];
}
function conflicts(indexX, ...indexY) {
  return indexY.map((y) => parser3(indexX, y, (result, file) => append(result.conflicted, file)));
}
function splitLine(result, lineStr) {
  const trimmed2 = lineStr.trim();
  switch (" ") {
    case trimmed2.charAt(2):
      return data(trimmed2.charAt(0), trimmed2.charAt(1), trimmed2.substr(3));
    case trimmed2.charAt(1):
      return data(" ", trimmed2.charAt(0), trimmed2.substr(2));
    default:
      return;
  }
  function data(index, workingDir, path7) {
    const raw = `${index}${workingDir}`;
    const handler = parsers6.get(raw);
    if (handler) {
      handler(result, path7);
    }
    if (raw !== "##" && raw !== "!!") {
      result.files.push(new FileStatusSummary(path7, index, workingDir));
    }
  }
}
var StatusSummary;
var parsers6;
var parseStatusSummary;
var init_StatusSummary = __esm({
  "src/lib/responses/StatusSummary.ts"() {
    "use strict";
    init_utils();
    init_FileStatusSummary();
    StatusSummary = class {
      constructor() {
        this.not_added = [];
        this.conflicted = [];
        this.created = [];
        this.deleted = [];
        this.ignored = void 0;
        this.modified = [];
        this.renamed = [];
        this.files = [];
        this.staged = [];
        this.ahead = 0;
        this.behind = 0;
        this.current = null;
        this.tracking = null;
        this.detached = false;
        this.isClean = () => {
          return !this.files.length;
        };
      }
    };
    parsers6 = new Map([
      parser3(
        " ",
        "A",
        (result, file) => append(result.created, file)
      ),
      parser3(
        " ",
        "D",
        (result, file) => append(result.deleted, file)
      ),
      parser3(
        " ",
        "M",
        (result, file) => append(result.modified, file)
      ),
      parser3(
        "A",
        " ",
        (result, file) => append(result.created, file) && append(result.staged, file)
      ),
      parser3(
        "A",
        "M",
        (result, file) => append(result.created, file) && append(result.staged, file) && append(result.modified, file)
      ),
      parser3(
        "D",
        " ",
        (result, file) => append(result.deleted, file) && append(result.staged, file)
      ),
      parser3(
        "M",
        " ",
        (result, file) => append(result.modified, file) && append(result.staged, file)
      ),
      parser3(
        "M",
        "M",
        (result, file) => append(result.modified, file) && append(result.staged, file)
      ),
      parser3("R", " ", (result, file) => {
        append(result.renamed, renamedFile(file));
      }),
      parser3("R", "M", (result, file) => {
        const renamed = renamedFile(file);
        append(result.renamed, renamed);
        append(result.modified, renamed.to);
      }),
      parser3("!", "!", (_result, _file) => {
        append(_result.ignored = _result.ignored || [], _file);
      }),
      parser3(
        "?",
        "?",
        (result, file) => append(result.not_added, file)
      ),
      ...conflicts(
        "A",
        "A",
        "U"
        /* UNMERGED */
      ),
      ...conflicts(
        "D",
        "D",
        "U"
        /* UNMERGED */
      ),
      ...conflicts(
        "U",
        "A",
        "D",
        "U"
        /* UNMERGED */
      ),
      [
        "##",
        (result, line) => {
          const aheadReg = /ahead (\d+)/;
          const behindReg = /behind (\d+)/;
          const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
          const trackingReg = /\.{3}(\S*)/;
          const onEmptyBranchReg = /\son\s([\S]+)$/;
          let regexResult;
          regexResult = aheadReg.exec(line);
          result.ahead = regexResult && +regexResult[1] || 0;
          regexResult = behindReg.exec(line);
          result.behind = regexResult && +regexResult[1] || 0;
          regexResult = currentReg.exec(line);
          result.current = regexResult && regexResult[1];
          regexResult = trackingReg.exec(line);
          result.tracking = regexResult && regexResult[1];
          regexResult = onEmptyBranchReg.exec(line);
          result.current = regexResult && regexResult[1] || result.current;
          result.detached = /\(no branch\)/.test(line);
        }
      ]
    ]);
    parseStatusSummary = function(text) {
      const lines = text.split(NULL);
      const status = new StatusSummary();
      for (let i = 0, l = lines.length; i < l; ) {
        let line = lines[i++].trim();
        if (!line) {
          continue;
        }
        if (line.charAt(0) === "R") {
          line += NULL + (lines[i++] || "");
        }
        splitLine(status, line);
      }
      return status;
    };
  }
});
function statusTask(customArgs) {
  const commands2 = [
    "status",
    "--porcelain",
    "-b",
    "-u",
    "--null",
    ...customArgs.filter((arg) => !ignoredOptions.includes(arg))
  ];
  return {
    format: "utf-8",
    commands: commands2,
    parser(text) {
      return parseStatusSummary(text);
    }
  };
}
var ignoredOptions;
var init_status = __esm({
  "src/lib/tasks/status.ts"() {
    "use strict";
    init_StatusSummary();
    ignoredOptions = ["--null", "-z"];
  }
});
function versionResponse(major = 0, minor = 0, patch = 0, agent = "", installed = true) {
  return Object.defineProperty(
    {
      major,
      minor,
      patch,
      agent,
      installed
    },
    "toString",
    {
      value() {
        return `${this.major}.${this.minor}.${this.patch}`;
      },
      configurable: false,
      enumerable: false
    }
  );
}
function notInstalledResponse() {
  return versionResponse(0, 0, 0, "", false);
}
function version_default() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: versionParser,
        onError(result, error, done, fail) {
          if (result.exitCode === -2) {
            return done(Buffer.from(NOT_INSTALLED));
          }
          fail(error);
        }
      });
    }
  };
}
function versionParser(stdOut) {
  if (stdOut === NOT_INSTALLED) {
    return notInstalledResponse();
  }
  return parseStringResponse(versionResponse(0, 0, 0, stdOut), parsers7, stdOut);
}
var NOT_INSTALLED;
var parsers7;
var init_version = __esm({
  "src/lib/tasks/version.ts"() {
    "use strict";
    init_utils();
    NOT_INSTALLED = "installed=false";
    parsers7 = [
      new LineParser(
        /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
        (result, [major, minor, patch, agent = ""]) => {
          Object.assign(
            result,
            versionResponse(asNumber(major), asNumber(minor), asNumber(patch), agent)
          );
        }
      ),
      new LineParser(
        /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
        (result, [major, minor, patch, agent = ""]) => {
          Object.assign(result, versionResponse(asNumber(major), asNumber(minor), patch, agent));
        }
      )
    ];
  }
});
var simple_git_api_exports = {};
__export2(simple_git_api_exports, {
  SimpleGitApi: () => SimpleGitApi
});
var SimpleGitApi;
var init_simple_git_api = __esm({
  "src/lib/simple-git-api.ts"() {
    "use strict";
    init_task_callback();
    init_change_working_directory();
    init_checkout();
    init_count_objects();
    init_commit();
    init_config();
    init_first_commit();
    init_grep();
    init_hash_object();
    init_init();
    init_log();
    init_merge();
    init_push();
    init_show();
    init_status();
    init_task();
    init_version();
    init_utils();
    SimpleGitApi = class {
      constructor(_executor) {
        this._executor = _executor;
      }
      _runTask(task, then) {
        const chain = this._executor.chain();
        const promise = chain.push(task);
        if (then) {
          taskCallback(task, promise, then);
        }
        return Object.create(this, {
          then: { value: promise.then.bind(promise) },
          catch: { value: promise.catch.bind(promise) },
          _executor: { value: chain }
        });
      }
      add(files) {
        return this._runTask(
          straightThroughStringTask(["add", ...asArray(files)]),
          trailingFunctionArgument(arguments)
        );
      }
      cwd(directory) {
        const next = trailingFunctionArgument(arguments);
        if (typeof directory === "string") {
          return this._runTask(changeWorkingDirectoryTask(directory, this._executor), next);
        }
        if (typeof directory?.path === "string") {
          return this._runTask(
            changeWorkingDirectoryTask(
              directory.path,
              directory.root && this._executor || void 0
            ),
            next
          );
        }
        return this._runTask(
          configurationErrorTask("Git.cwd: workingDirectory must be supplied as a string"),
          next
        );
      }
      hashObject(path7, write) {
        return this._runTask(
          hashObjectTask(path7, write === true),
          trailingFunctionArgument(arguments)
        );
      }
      init(bare) {
        return this._runTask(
          initTask(bare === true, this._executor.cwd, getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
      merge() {
        return this._runTask(
          mergeTask(getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
      mergeFromTo(remote, branch) {
        if (!(filterString(remote) && filterString(branch))) {
          return this._runTask(
            configurationErrorTask(
              `Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings`
            )
          );
        }
        return this._runTask(
          mergeTask([remote, branch, ...getTrailingOptions(arguments)]),
          trailingFunctionArgument(arguments, false)
        );
      }
      outputHandler(handler) {
        this._executor.outputHandler = handler;
        return this;
      }
      push() {
        const task = pushTask(
          {
            remote: filterType(arguments[0], filterString),
            branch: filterType(arguments[1], filterString)
          },
          getTrailingOptions(arguments)
        );
        return this._runTask(task, trailingFunctionArgument(arguments));
      }
      stash() {
        return this._runTask(
          straightThroughStringTask(["stash", ...getTrailingOptions(arguments)]),
          trailingFunctionArgument(arguments)
        );
      }
      status() {
        return this._runTask(
          statusTask(getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
    };
    Object.assign(
      SimpleGitApi.prototype,
      checkout_default(),
      commit_default(),
      config_default(),
      count_objects_default(),
      first_commit_default(),
      grep_default(),
      log_default(),
      show_default(),
      version_default()
    );
  }
});
var scheduler_exports = {};
__export2(scheduler_exports, {
  Scheduler: () => Scheduler
});
var createScheduledTask;
var Scheduler;
var init_scheduler = __esm({
  "src/lib/runners/scheduler.ts"() {
    "use strict";
    init_utils();
    init_git_logger();
    createScheduledTask = /* @__PURE__ */ (() => {
      let id = 0;
      return () => {
        id++;
        const { promise, done } = (0, import_promise_deferred.createDeferred)();
        return {
          promise,
          done,
          id
        };
      };
    })();
    Scheduler = class {
      constructor(concurrency = 2) {
        this.concurrency = concurrency;
        this.logger = createLogger("", "scheduler");
        this.pending = [];
        this.running = [];
        this.logger(`Constructed, concurrency=%s`, concurrency);
      }
      schedule() {
        if (!this.pending.length || this.running.length >= this.concurrency) {
          this.logger(
            `Schedule attempt ignored, pending=%s running=%s concurrency=%s`,
            this.pending.length,
            this.running.length,
            this.concurrency
          );
          return;
        }
        const task = append(this.running, this.pending.shift());
        this.logger(`Attempting id=%s`, task.id);
        task.done(() => {
          this.logger(`Completing id=`, task.id);
          remove(this.running, task);
          this.schedule();
        });
      }
      next() {
        const { promise, id } = append(this.pending, createScheduledTask());
        this.logger(`Scheduling id=%s`, id);
        this.schedule();
        return promise;
      }
    };
  }
});
var apply_patch_exports = {};
__export2(apply_patch_exports, {
  applyPatchTask: () => applyPatchTask
});
function applyPatchTask(patches, customArgs) {
  return straightThroughStringTask(["apply", ...customArgs, ...patches]);
}
var init_apply_patch = __esm({
  "src/lib/tasks/apply-patch.ts"() {
    "use strict";
    init_task();
  }
});
function branchDeletionSuccess(branch, hash) {
  return {
    branch,
    hash,
    success: true
  };
}
function branchDeletionFailure(branch) {
  return {
    branch,
    hash: null,
    success: false
  };
}
var BranchDeletionBatch;
var init_BranchDeleteSummary = __esm({
  "src/lib/responses/BranchDeleteSummary.ts"() {
    "use strict";
    BranchDeletionBatch = class {
      constructor() {
        this.all = [];
        this.branches = {};
        this.errors = [];
      }
      get success() {
        return !this.errors.length;
      }
    };
  }
});
function hasBranchDeletionError(data, processExitCode) {
  return processExitCode === 1 && deleteErrorRegex.test(data);
}
var deleteSuccessRegex;
var deleteErrorRegex;
var parsers8;
var parseBranchDeletions;
var init_parse_branch_delete = __esm({
  "src/lib/parsers/parse-branch-delete.ts"() {
    "use strict";
    init_BranchDeleteSummary();
    init_utils();
    deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
    deleteErrorRegex = /^error[^']+'([^']+)'/m;
    parsers8 = [
      new LineParser(deleteSuccessRegex, (result, [branch, hash]) => {
        const deletion = branchDeletionSuccess(branch, hash);
        result.all.push(deletion);
        result.branches[branch] = deletion;
      }),
      new LineParser(deleteErrorRegex, (result, [branch]) => {
        const deletion = branchDeletionFailure(branch);
        result.errors.push(deletion);
        result.all.push(deletion);
        result.branches[branch] = deletion;
      })
    ];
    parseBranchDeletions = (stdOut, stdErr) => {
      return parseStringResponse(new BranchDeletionBatch(), parsers8, [stdOut, stdErr]);
    };
  }
});
var BranchSummaryResult;
var init_BranchSummary = __esm({
  "src/lib/responses/BranchSummary.ts"() {
    "use strict";
    BranchSummaryResult = class {
      constructor() {
        this.all = [];
        this.branches = {};
        this.current = "";
        this.detached = false;
      }
      push(status, detached, name, commit, label) {
        if (status === "*") {
          this.detached = detached;
          this.current = name;
        }
        this.all.push(name);
        this.branches[name] = {
          current: status === "*",
          linkedWorkTree: status === "+",
          name,
          commit,
          label
        };
      }
    };
  }
});
function branchStatus(input) {
  return input ? input.charAt(0) : "";
}
function parseBranchSummary(stdOut) {
  return parseStringResponse(new BranchSummaryResult(), parsers9, stdOut);
}
var parsers9;
var init_parse_branch = __esm({
  "src/lib/parsers/parse-branch.ts"() {
    "use strict";
    init_BranchSummary();
    init_utils();
    parsers9 = [
      new LineParser(
        /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
        (result, [current, name, commit, label]) => {
          result.push(branchStatus(current), true, name, commit, label);
        }
      ),
      new LineParser(
        /^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s,
        (result, [current, name, commit, label]) => {
          result.push(branchStatus(current), false, name, commit, label);
        }
      )
    ];
  }
});
var branch_exports = {};
__export2(branch_exports, {
  branchLocalTask: () => branchLocalTask,
  branchTask: () => branchTask,
  containsDeleteBranchCommand: () => containsDeleteBranchCommand,
  deleteBranchTask: () => deleteBranchTask,
  deleteBranchesTask: () => deleteBranchesTask
});
function containsDeleteBranchCommand(commands2) {
  const deleteCommands = ["-d", "-D", "--delete"];
  return commands2.some((command) => deleteCommands.includes(command));
}
function branchTask(customArgs) {
  const isDelete = containsDeleteBranchCommand(customArgs);
  const commands2 = ["branch", ...customArgs];
  if (commands2.length === 1) {
    commands2.push("-a");
  }
  if (!commands2.includes("-v")) {
    commands2.splice(1, 0, "-v");
  }
  return {
    format: "utf-8",
    commands: commands2,
    parser(stdOut, stdErr) {
      if (isDelete) {
        return parseBranchDeletions(stdOut, stdErr).all[0];
      }
      return parseBranchSummary(stdOut);
    }
  };
}
function branchLocalTask() {
  const parser4 = parseBranchSummary;
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser: parser4
  };
}
function deleteBranchesTask(branches, forceDelete = false) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", forceDelete ? "-D" : "-d", ...branches],
    parser(stdOut, stdErr) {
      return parseBranchDeletions(stdOut, stdErr);
    },
    onError({ exitCode, stdOut }, error, done, fail) {
      if (!hasBranchDeletionError(String(error), exitCode)) {
        return fail(error);
      }
      done(stdOut);
    }
  };
}
function deleteBranchTask(branch, forceDelete = false) {
  const task = {
    format: "utf-8",
    commands: ["branch", "-v", forceDelete ? "-D" : "-d", branch],
    parser(stdOut, stdErr) {
      return parseBranchDeletions(stdOut, stdErr).branches[branch];
    },
    onError({ exitCode, stdErr, stdOut }, error, _, fail) {
      if (!hasBranchDeletionError(String(error), exitCode)) {
        return fail(error);
      }
      throw new GitResponseError(
        task.parser(bufferToString(stdOut), bufferToString(stdErr)),
        String(error)
      );
    }
  };
  return task;
}
var init_branch = __esm({
  "src/lib/tasks/branch.ts"() {
    "use strict";
    init_git_response_error();
    init_parse_branch_delete();
    init_parse_branch();
    init_utils();
  }
});
var parseCheckIgnore;
var init_CheckIgnore = __esm({
  "src/lib/responses/CheckIgnore.ts"() {
    "use strict";
    parseCheckIgnore = (text) => {
      return text.split(/\n/g).map((line) => line.trim()).filter((file) => !!file);
    };
  }
});
var check_ignore_exports = {};
__export2(check_ignore_exports, {
  checkIgnoreTask: () => checkIgnoreTask
});
function checkIgnoreTask(paths) {
  return {
    commands: ["check-ignore", ...paths],
    format: "utf-8",
    parser: parseCheckIgnore
  };
}
var init_check_ignore = __esm({
  "src/lib/tasks/check-ignore.ts"() {
    "use strict";
    init_CheckIgnore();
  }
});
var clone_exports = {};
__export2(clone_exports, {
  cloneMirrorTask: () => cloneMirrorTask,
  cloneTask: () => cloneTask
});
function disallowedCommand(command) {
  return /^--upload-pack(=|$)/.test(command);
}
function cloneTask(repo, directory, customArgs) {
  const commands2 = ["clone", ...customArgs];
  filterString(repo) && commands2.push(repo);
  filterString(directory) && commands2.push(directory);
  const banned = commands2.find(disallowedCommand);
  if (banned) {
    return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
  }
  return straightThroughStringTask(commands2);
}
function cloneMirrorTask(repo, directory, customArgs) {
  append(customArgs, "--mirror");
  return cloneTask(repo, directory, customArgs);
}
var init_clone = __esm({
  "src/lib/tasks/clone.ts"() {
    "use strict";
    init_task();
    init_utils();
  }
});
function parseFetchResult(stdOut, stdErr) {
  const result = {
    raw: stdOut,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  };
  return parseStringResponse(result, parsers10, [stdOut, stdErr]);
}
var parsers10;
var init_parse_fetch = __esm({
  "src/lib/parsers/parse-fetch.ts"() {
    "use strict";
    init_utils();
    parsers10 = [
      new LineParser(/From (.+)$/, (result, [remote]) => {
        result.remote = remote;
      }),
      new LineParser(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
        result.branches.push({
          name,
          tracking
        });
      }),
      new LineParser(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
        result.tags.push({
          name,
          tracking
        });
      }),
      new LineParser(/- \[deleted]\s+\S+\s*-> (.+)$/, (result, [tracking]) => {
        result.deleted.push({
          tracking
        });
      }),
      new LineParser(
        /\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/,
        (result, [from, to, name, tracking]) => {
          result.updated.push({
            name,
            tracking,
            to,
            from
          });
        }
      )
    ];
  }
});
var fetch_exports = {};
__export2(fetch_exports, {
  fetchTask: () => fetchTask
});
function disallowedCommand2(command) {
  return /^--upload-pack(=|$)/.test(command);
}
function fetchTask(remote, branch, customArgs) {
  const commands2 = ["fetch", ...customArgs];
  if (remote && branch) {
    commands2.push(remote, branch);
  }
  const banned = commands2.find(disallowedCommand2);
  if (banned) {
    return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser: parseFetchResult
  };
}
var init_fetch = __esm({
  "src/lib/tasks/fetch.ts"() {
    "use strict";
    init_parse_fetch();
    init_task();
  }
});
function parseMoveResult(stdOut) {
  return parseStringResponse({ moves: [] }, parsers11, stdOut);
}
var parsers11;
var init_parse_move = __esm({
  "src/lib/parsers/parse-move.ts"() {
    "use strict";
    init_utils();
    parsers11 = [
      new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
        result.moves.push({ from, to });
      })
    ];
  }
});
var move_exports = {};
__export2(move_exports, {
  moveTask: () => moveTask
});
function moveTask(from, to) {
  return {
    commands: ["mv", "-v", ...asArray(from), to],
    format: "utf-8",
    parser: parseMoveResult
  };
}
var init_move = __esm({
  "src/lib/tasks/move.ts"() {
    "use strict";
    init_parse_move();
    init_utils();
  }
});
var pull_exports = {};
__export2(pull_exports, {
  pullTask: () => pullTask
});
function pullTask(remote, branch, customArgs) {
  const commands2 = ["pull", ...customArgs];
  if (remote && branch) {
    commands2.splice(1, 0, remote, branch);
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser(stdOut, stdErr) {
      return parsePullResult(stdOut, stdErr);
    },
    onError(result, _error, _done, fail) {
      const pullError = parsePullErrorResult(
        bufferToString(result.stdOut),
        bufferToString(result.stdErr)
      );
      if (pullError) {
        return fail(new GitResponseError(pullError));
      }
      fail(_error);
    }
  };
}
var init_pull = __esm({
  "src/lib/tasks/pull.ts"() {
    "use strict";
    init_git_response_error();
    init_parse_pull();
    init_utils();
  }
});
function parseGetRemotes(text) {
  const remotes = {};
  forEach(text, ([name]) => remotes[name] = { name });
  return Object.values(remotes);
}
function parseGetRemotesVerbose(text) {
  const remotes = {};
  forEach(text, ([name, url, purpose]) => {
    if (!remotes.hasOwnProperty(name)) {
      remotes[name] = {
        name,
        refs: { fetch: "", push: "" }
      };
    }
    if (purpose && url) {
      remotes[name].refs[purpose.replace(/[^a-z]/g, "")] = url;
    }
  });
  return Object.values(remotes);
}
function forEach(text, handler) {
  forEachLineWithContent(text, (line) => handler(line.split(/\s+/)));
}
var init_GetRemoteSummary = __esm({
  "src/lib/responses/GetRemoteSummary.ts"() {
    "use strict";
    init_utils();
  }
});
var remote_exports = {};
__export2(remote_exports, {
  addRemoteTask: () => addRemoteTask,
  getRemotesTask: () => getRemotesTask,
  listRemotesTask: () => listRemotesTask,
  remoteTask: () => remoteTask,
  removeRemoteTask: () => removeRemoteTask
});
function addRemoteTask(remoteName, remoteRepo, customArgs) {
  return straightThroughStringTask(["remote", "add", ...customArgs, remoteName, remoteRepo]);
}
function getRemotesTask(verbose) {
  const commands2 = ["remote"];
  if (verbose) {
    commands2.push("-v");
  }
  return {
    commands: commands2,
    format: "utf-8",
    parser: verbose ? parseGetRemotesVerbose : parseGetRemotes
  };
}
function listRemotesTask(customArgs) {
  const commands2 = [...customArgs];
  if (commands2[0] !== "ls-remote") {
    commands2.unshift("ls-remote");
  }
  return straightThroughStringTask(commands2);
}
function remoteTask(customArgs) {
  const commands2 = [...customArgs];
  if (commands2[0] !== "remote") {
    commands2.unshift("remote");
  }
  return straightThroughStringTask(commands2);
}
function removeRemoteTask(remoteName) {
  return straightThroughStringTask(["remote", "remove", remoteName]);
}
var init_remote = __esm({
  "src/lib/tasks/remote.ts"() {
    "use strict";
    init_GetRemoteSummary();
    init_task();
  }
});
var stash_list_exports = {};
__export2(stash_list_exports, {
  stashListTask: () => stashListTask
});
function stashListTask(opt = {}, customArgs) {
  const options = parseLogOptions(opt);
  const commands2 = ["stash", "list", ...options.commands, ...customArgs];
  const parser4 = createListLogSummaryParser(
    options.splitter,
    options.fields,
    logFormatFromCommand(commands2)
  );
  return validateLogFormatConfig(commands2) || {
    commands: commands2,
    format: "utf-8",
    parser: parser4
  };
}
var init_stash_list = __esm({
  "src/lib/tasks/stash-list.ts"() {
    "use strict";
    init_log_format();
    init_parse_list_log_summary();
    init_diff();
    init_log();
  }
});
var sub_module_exports = {};
__export2(sub_module_exports, {
  addSubModuleTask: () => addSubModuleTask,
  initSubModuleTask: () => initSubModuleTask,
  subModuleTask: () => subModuleTask,
  updateSubModuleTask: () => updateSubModuleTask
});
function addSubModuleTask(repo, path7) {
  return subModuleTask(["add", repo, path7]);
}
function initSubModuleTask(customArgs) {
  return subModuleTask(["init", ...customArgs]);
}
function subModuleTask(customArgs) {
  const commands2 = [...customArgs];
  if (commands2[0] !== "submodule") {
    commands2.unshift("submodule");
  }
  return straightThroughStringTask(commands2);
}
function updateSubModuleTask(customArgs) {
  return subModuleTask(["update", ...customArgs]);
}
var init_sub_module = __esm({
  "src/lib/tasks/sub-module.ts"() {
    "use strict";
    init_task();
  }
});
function singleSorted(a, b) {
  const aIsNum = isNaN(a);
  const bIsNum = isNaN(b);
  if (aIsNum !== bIsNum) {
    return aIsNum ? 1 : -1;
  }
  return aIsNum ? sorted(a, b) : 0;
}
function sorted(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}
function trimmed(input) {
  return input.trim();
}
function toNumber(input) {
  if (typeof input === "string") {
    return parseInt(input.replace(/^\D+/g, ""), 10) || 0;
  }
  return 0;
}
var TagList;
var parseTagList;
var init_TagList = __esm({
  "src/lib/responses/TagList.ts"() {
    "use strict";
    TagList = class {
      constructor(all, latest) {
        this.all = all;
        this.latest = latest;
      }
    };
    parseTagList = function(data, customSort = false) {
      const tags = data.split("\n").map(trimmed).filter(Boolean);
      if (!customSort) {
        tags.sort(function(tagA, tagB) {
          const partsA = tagA.split(".");
          const partsB = tagB.split(".");
          if (partsA.length === 1 || partsB.length === 1) {
            return singleSorted(toNumber(partsA[0]), toNumber(partsB[0]));
          }
          for (let i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
            const diff = sorted(toNumber(partsA[i]), toNumber(partsB[i]));
            if (diff) {
              return diff;
            }
          }
          return 0;
        });
      }
      const latest = customSort ? tags[0] : [...tags].reverse().find((tag) => tag.indexOf(".") >= 0);
      return new TagList(tags, latest);
    };
  }
});
var tag_exports = {};
__export2(tag_exports, {
  addAnnotatedTagTask: () => addAnnotatedTagTask,
  addTagTask: () => addTagTask,
  tagListTask: () => tagListTask
});
function tagListTask(customArgs = []) {
  const hasCustomSort = customArgs.some((option) => /^--sort=/.test(option));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...customArgs],
    parser(text) {
      return parseTagList(text, hasCustomSort);
    }
  };
}
function addTagTask(name) {
  return {
    format: "utf-8",
    commands: ["tag", name],
    parser() {
      return { name };
    }
  };
}
function addAnnotatedTagTask(name, tagMessage) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", tagMessage, name],
    parser() {
      return { name };
    }
  };
}
var init_tag = __esm({
  "src/lib/tasks/tag.ts"() {
    "use strict";
    init_TagList();
  }
});
var require_git = __commonJS2({
  "src/git.js"(exports2, module2) {
    "use strict";
    var { GitExecutor: GitExecutor2 } = (init_git_executor(), __toCommonJS2(git_executor_exports));
    var { SimpleGitApi: SimpleGitApi2 } = (init_simple_git_api(), __toCommonJS2(simple_git_api_exports));
    var { Scheduler: Scheduler2 } = (init_scheduler(), __toCommonJS2(scheduler_exports));
    var { configurationErrorTask: configurationErrorTask2 } = (init_task(), __toCommonJS2(task_exports));
    var {
      asArray: asArray2,
      filterArray: filterArray2,
      filterPrimitives: filterPrimitives2,
      filterString: filterString2,
      filterStringOrStringArray: filterStringOrStringArray2,
      filterType: filterType2,
      getTrailingOptions: getTrailingOptions2,
      trailingFunctionArgument: trailingFunctionArgument2,
      trailingOptionsArgument: trailingOptionsArgument2
    } = (init_utils(), __toCommonJS2(utils_exports));
    var { applyPatchTask: applyPatchTask2 } = (init_apply_patch(), __toCommonJS2(apply_patch_exports));
    var {
      branchTask: branchTask2,
      branchLocalTask: branchLocalTask2,
      deleteBranchesTask: deleteBranchesTask2,
      deleteBranchTask: deleteBranchTask2
    } = (init_branch(), __toCommonJS2(branch_exports));
    var { checkIgnoreTask: checkIgnoreTask2 } = (init_check_ignore(), __toCommonJS2(check_ignore_exports));
    var { checkIsRepoTask: checkIsRepoTask2 } = (init_check_is_repo(), __toCommonJS2(check_is_repo_exports));
    var { cloneTask: cloneTask2, cloneMirrorTask: cloneMirrorTask2 } = (init_clone(), __toCommonJS2(clone_exports));
    var { cleanWithOptionsTask: cleanWithOptionsTask2, isCleanOptionsArray: isCleanOptionsArray2 } = (init_clean(), __toCommonJS2(clean_exports));
    var { diffSummaryTask: diffSummaryTask2 } = (init_diff(), __toCommonJS2(diff_exports));
    var { fetchTask: fetchTask2 } = (init_fetch(), __toCommonJS2(fetch_exports));
    var { moveTask: moveTask2 } = (init_move(), __toCommonJS2(move_exports));
    var { pullTask: pullTask2 } = (init_pull(), __toCommonJS2(pull_exports));
    var { pushTagsTask: pushTagsTask2 } = (init_push(), __toCommonJS2(push_exports));
    var {
      addRemoteTask: addRemoteTask2,
      getRemotesTask: getRemotesTask2,
      listRemotesTask: listRemotesTask2,
      remoteTask: remoteTask2,
      removeRemoteTask: removeRemoteTask2
    } = (init_remote(), __toCommonJS2(remote_exports));
    var { getResetMode: getResetMode2, resetTask: resetTask2 } = (init_reset(), __toCommonJS2(reset_exports));
    var { stashListTask: stashListTask2 } = (init_stash_list(), __toCommonJS2(stash_list_exports));
    var {
      addSubModuleTask: addSubModuleTask2,
      initSubModuleTask: initSubModuleTask2,
      subModuleTask: subModuleTask2,
      updateSubModuleTask: updateSubModuleTask2
    } = (init_sub_module(), __toCommonJS2(sub_module_exports));
    var { addAnnotatedTagTask: addAnnotatedTagTask2, addTagTask: addTagTask2, tagListTask: tagListTask2 } = (init_tag(), __toCommonJS2(tag_exports));
    var { straightThroughBufferTask: straightThroughBufferTask2, straightThroughStringTask: straightThroughStringTask2 } = (init_task(), __toCommonJS2(task_exports));
    function Git2(options, plugins) {
      this._plugins = plugins;
      this._executor = new GitExecutor2(
        options.baseDir,
        new Scheduler2(options.maxConcurrentProcesses),
        plugins
      );
      this._trimmed = options.trimmed;
    }
    (Git2.prototype = Object.create(SimpleGitApi2.prototype)).constructor = Git2;
    Git2.prototype.customBinary = function(command) {
      this._plugins.reconfigure("binary", command);
      return this;
    };
    Git2.prototype.env = function(name, value) {
      if (arguments.length === 1 && typeof name === "object") {
        this._executor.env = name;
      } else {
        (this._executor.env = this._executor.env || {})[name] = value;
      }
      return this;
    };
    Git2.prototype.stashList = function(options) {
      return this._runTask(
        stashListTask2(
          trailingOptionsArgument2(arguments) || {},
          filterArray2(options) && options || []
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    function createCloneTask(api, task, repoPath, localPath) {
      if (typeof repoPath !== "string") {
        return configurationErrorTask2(`git.${api}() requires a string 'repoPath'`);
      }
      return task(repoPath, filterType2(localPath, filterString2), getTrailingOptions2(arguments));
    }
    Git2.prototype.clone = function() {
      return this._runTask(
        createCloneTask("clone", cloneTask2, ...arguments),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.mirror = function() {
      return this._runTask(
        createCloneTask("mirror", cloneMirrorTask2, ...arguments),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.mv = function(from, to) {
      return this._runTask(moveTask2(from, to), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.checkoutLatestTag = function(then) {
      var git = this;
      return this.pull(function() {
        git.tags(function(err, tags) {
          git.checkout(tags.latest, then);
        });
      });
    };
    Git2.prototype.pull = function(remote, branch, options, then) {
      return this._runTask(
        pullTask2(
          filterType2(remote, filterString2),
          filterType2(branch, filterString2),
          getTrailingOptions2(arguments)
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.fetch = function(remote, branch) {
      return this._runTask(
        fetchTask2(
          filterType2(remote, filterString2),
          filterType2(branch, filterString2),
          getTrailingOptions2(arguments)
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.silent = function(silence) {
      console.warn(
        "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3"
      );
      return this;
    };
    Git2.prototype.tags = function(options, then) {
      return this._runTask(
        tagListTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.rebase = function() {
      return this._runTask(
        straightThroughStringTask2(["rebase", ...getTrailingOptions2(arguments)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.reset = function(mode) {
      return this._runTask(
        resetTask2(getResetMode2(mode), getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.revert = function(commit) {
      const next = trailingFunctionArgument2(arguments);
      if (typeof commit !== "string") {
        return this._runTask(configurationErrorTask2("Commit must be a string"), next);
      }
      return this._runTask(
        straightThroughStringTask2(["revert", ...getTrailingOptions2(arguments, 0, true), commit]),
        next
      );
    };
    Git2.prototype.addTag = function(name) {
      const task = typeof name === "string" ? addTagTask2(name) : configurationErrorTask2("Git.addTag requires a tag name");
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.addAnnotatedTag = function(tagName, tagMessage) {
      return this._runTask(
        addAnnotatedTagTask2(tagName, tagMessage),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.deleteLocalBranch = function(branchName, forceDelete, then) {
      return this._runTask(
        deleteBranchTask2(branchName, typeof forceDelete === "boolean" ? forceDelete : false),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.deleteLocalBranches = function(branchNames, forceDelete, then) {
      return this._runTask(
        deleteBranchesTask2(branchNames, typeof forceDelete === "boolean" ? forceDelete : false),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.branch = function(options, then) {
      return this._runTask(
        branchTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.branchLocal = function(then) {
      return this._runTask(branchLocalTask2(), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.raw = function(commands2) {
      const createRestCommands = !Array.isArray(commands2);
      const command = [].slice.call(createRestCommands ? arguments : commands2, 0);
      for (let i = 0; i < command.length && createRestCommands; i++) {
        if (!filterPrimitives2(command[i])) {
          command.splice(i, command.length - i);
          break;
        }
      }
      command.push(...getTrailingOptions2(arguments, 0, true));
      var next = trailingFunctionArgument2(arguments);
      if (!command.length) {
        return this._runTask(
          configurationErrorTask2("Raw: must supply one or more command to execute"),
          next
        );
      }
      return this._runTask(straightThroughStringTask2(command, this._trimmed), next);
    };
    Git2.prototype.submoduleAdd = function(repo, path7, then) {
      return this._runTask(addSubModuleTask2(repo, path7), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.submoduleUpdate = function(args, then) {
      return this._runTask(
        updateSubModuleTask2(getTrailingOptions2(arguments, true)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.submoduleInit = function(args, then) {
      return this._runTask(
        initSubModuleTask2(getTrailingOptions2(arguments, true)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.subModule = function(options, then) {
      return this._runTask(
        subModuleTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.listRemote = function() {
      return this._runTask(
        listRemotesTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.addRemote = function(remoteName, remoteRepo, then) {
      return this._runTask(
        addRemoteTask2(remoteName, remoteRepo, getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.removeRemote = function(remoteName, then) {
      return this._runTask(removeRemoteTask2(remoteName), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.getRemotes = function(verbose, then) {
      return this._runTask(getRemotesTask2(verbose === true), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.remote = function(options, then) {
      return this._runTask(
        remoteTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.tag = function(options, then) {
      const command = getTrailingOptions2(arguments);
      if (command[0] !== "tag") {
        command.unshift("tag");
      }
      return this._runTask(straightThroughStringTask2(command), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.updateServerInfo = function(then) {
      return this._runTask(
        straightThroughStringTask2(["update-server-info"]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.pushTags = function(remote, then) {
      const task = pushTagsTask2(
        { remote: filterType2(remote, filterString2) },
        getTrailingOptions2(arguments)
      );
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.rm = function(files) {
      return this._runTask(
        straightThroughStringTask2(["rm", "-f", ...asArray2(files)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.rmKeepLocal = function(files) {
      return this._runTask(
        straightThroughStringTask2(["rm", "--cached", ...asArray2(files)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.catFile = function(options, then) {
      return this._catFile("utf-8", arguments);
    };
    Git2.prototype.binaryCatFile = function() {
      return this._catFile("buffer", arguments);
    };
    Git2.prototype._catFile = function(format, args) {
      var handler = trailingFunctionArgument2(args);
      var command = ["cat-file"];
      var options = args[0];
      if (typeof options === "string") {
        return this._runTask(
          configurationErrorTask2("Git.catFile: options must be supplied as an array of strings"),
          handler
        );
      }
      if (Array.isArray(options)) {
        command.push.apply(command, options);
      }
      const task = format === "buffer" ? straightThroughBufferTask2(command) : straightThroughStringTask2(command);
      return this._runTask(task, handler);
    };
    Git2.prototype.diff = function(options, then) {
      const task = filterString2(options) ? configurationErrorTask2(
        "git.diff: supplying options as a single string is no longer supported, switch to an array of strings"
      ) : straightThroughStringTask2(["diff", ...getTrailingOptions2(arguments)]);
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.diffSummary = function() {
      return this._runTask(
        diffSummaryTask2(getTrailingOptions2(arguments, 1)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.applyPatch = function(patches) {
      const task = !filterStringOrStringArray2(patches) ? configurationErrorTask2(
        `git.applyPatch requires one or more string patches as the first argument`
      ) : applyPatchTask2(asArray2(patches), getTrailingOptions2([].slice.call(arguments, 1)));
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.revparse = function() {
      const commands2 = ["rev-parse", ...getTrailingOptions2(arguments, true)];
      return this._runTask(
        straightThroughStringTask2(commands2, true),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.clean = function(mode, options, then) {
      const usingCleanOptionsArray = isCleanOptionsArray2(mode);
      const cleanMode = usingCleanOptionsArray && mode.join("") || filterType2(mode, filterString2) || "";
      const customArgs = getTrailingOptions2([].slice.call(arguments, usingCleanOptionsArray ? 1 : 0));
      return this._runTask(
        cleanWithOptionsTask2(cleanMode, customArgs),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.exec = function(then) {
      const task = {
        commands: [],
        format: "utf-8",
        parser() {
          if (typeof then === "function") {
            then();
          }
        }
      };
      return this._runTask(task);
    };
    Git2.prototype.clearQueue = function() {
      return this;
    };
    Git2.prototype.checkIgnore = function(pathnames, then) {
      return this._runTask(
        checkIgnoreTask2(asArray2(filterType2(pathnames, filterStringOrStringArray2, []))),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.checkIsRepo = function(checkType, then) {
      return this._runTask(
        checkIsRepoTask2(filterType2(checkType, filterString2)),
        trailingFunctionArgument2(arguments)
      );
    };
    module2.exports = Git2;
  }
});
init_pathspec();
init_git_error();
var GitConstructError = class extends GitError {
  constructor(config, message) {
    super(void 0, message);
    this.config = config;
  }
};
init_git_error();
init_git_error();
var GitPluginError = class extends GitError {
  constructor(task, plugin, message) {
    super(task, message);
    this.task = task;
    this.plugin = plugin;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
init_git_response_error();
init_task_configuration_error();
init_check_is_repo();
init_clean();
init_config();
init_diff_name_status();
init_grep();
init_reset();
function abortPlugin(signal) {
  if (!signal) {
    return;
  }
  const onSpawnAfter = {
    type: "spawn.after",
    action(_data, context) {
      function kill() {
        context.kill(new GitPluginError(void 0, "abort", "Abort signal received"));
      }
      signal.addEventListener("abort", kill);
      context.spawned.on("close", () => signal.removeEventListener("abort", kill));
    }
  };
  const onSpawnBefore = {
    type: "spawn.before",
    action(_data, context) {
      if (signal.aborted) {
        context.kill(new GitPluginError(void 0, "abort", "Abort already signaled"));
      }
    }
  };
  return [onSpawnBefore, onSpawnAfter];
}
function isConfigSwitch(arg) {
  return typeof arg === "string" && arg.trim().toLowerCase() === "-c";
}
function preventProtocolOverride(arg, next) {
  if (!isConfigSwitch(arg)) {
    return;
  }
  if (!/^\s*protocol(.[a-z]+)?.allow/.test(next)) {
    return;
  }
  throw new GitPluginError(
    void 0,
    "unsafe",
    "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol"
  );
}
function preventUploadPack(arg, method) {
  if (/^\s*--(upload|receive)-pack/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack`
    );
  }
  if (method === "clone" && /^\s*-u\b/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of clone with option -u is not permitted without enabling allowUnsafePack`
    );
  }
  if (method === "push" && /^\s*--exec\b/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of push with option --exec is not permitted without enabling allowUnsafePack`
    );
  }
}
function blockUnsafeOperationsPlugin({
  allowUnsafeProtocolOverride = false,
  allowUnsafePack = false
} = {}) {
  return {
    type: "spawn.args",
    action(args, context) {
      args.forEach((current, index) => {
        const next = index < args.length ? args[index + 1] : "";
        allowUnsafeProtocolOverride || preventProtocolOverride(current, next);
        allowUnsafePack || preventUploadPack(current, context.method);
      });
      return args;
    }
  };
}
init_utils();
function commandConfigPrefixingPlugin(configuration) {
  const prefix = prefixedArray(configuration, "-c");
  return {
    type: "spawn.args",
    action(data) {
      return [...prefix, ...data];
    }
  };
}
init_utils();
var never = (0, import_promise_deferred2.deferred)().promise;
function completionDetectionPlugin({
  onClose = true,
  onExit = 50
} = {}) {
  function createEvents() {
    let exitCode = -1;
    const events = {
      close: (0, import_promise_deferred2.deferred)(),
      closeTimeout: (0, import_promise_deferred2.deferred)(),
      exit: (0, import_promise_deferred2.deferred)(),
      exitTimeout: (0, import_promise_deferred2.deferred)()
    };
    const result = Promise.race([
      onClose === false ? never : events.closeTimeout.promise,
      onExit === false ? never : events.exitTimeout.promise
    ]);
    configureTimeout(onClose, events.close, events.closeTimeout);
    configureTimeout(onExit, events.exit, events.exitTimeout);
    return {
      close(code) {
        exitCode = code;
        events.close.done();
      },
      exit(code) {
        exitCode = code;
        events.exit.done();
      },
      get exitCode() {
        return exitCode;
      },
      result
    };
  }
  function configureTimeout(flag, event, timeout) {
    if (flag === false) {
      return;
    }
    (flag === true ? event.promise : event.promise.then(() => delay(flag))).then(timeout.done);
  }
  return {
    type: "spawn.after",
    async action(_data, { spawned, close }) {
      const events = createEvents();
      let deferClose = true;
      let quickClose = () => void (deferClose = false);
      spawned.stdout?.on("data", quickClose);
      spawned.stderr?.on("data", quickClose);
      spawned.on("error", quickClose);
      spawned.on("close", (code) => events.close(code));
      spawned.on("exit", (code) => events.exit(code));
      try {
        await events.result;
        if (deferClose) {
          await delay(50);
        }
        close(events.exitCode);
      } catch (err) {
        close(events.exitCode, err);
      }
    }
  };
}
init_utils();
var WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
var WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;
function isBadArgument(arg) {
  return !arg || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(arg);
}
function toBinaryConfig(input, allowUnsafe) {
  if (input.length < 1 || input.length > 2) {
    throw new GitPluginError(void 0, "binary", WRONG_NUMBER_ERR);
  }
  const isBad = input.some(isBadArgument);
  if (isBad) {
    if (allowUnsafe) {
      console.warn(WRONG_CHARS_ERR);
    } else {
      throw new GitPluginError(void 0, "binary", WRONG_CHARS_ERR);
    }
  }
  const [binary, prefix] = input;
  return {
    binary,
    prefix
  };
}
function customBinaryPlugin(plugins, input = ["git"], allowUnsafe = false) {
  let config = toBinaryConfig(asArray(input), allowUnsafe);
  plugins.on("binary", (input2) => {
    config = toBinaryConfig(asArray(input2), allowUnsafe);
  });
  plugins.append("spawn.binary", () => {
    return config.binary;
  });
  plugins.append("spawn.args", (data) => {
    return config.prefix ? [config.prefix, ...data] : data;
  });
}
init_git_error();
function isTaskError(result) {
  return !!(result.exitCode && result.stdErr.length);
}
function getErrorMessage(result) {
  return Buffer.concat([...result.stdOut, ...result.stdErr]);
}
function errorDetectionHandler(overwrite = false, isError = isTaskError, errorMessage = getErrorMessage) {
  return (error, result) => {
    if (!overwrite && error || !isError(result)) {
      return error;
    }
    return errorMessage(result);
  };
}
function errorDetectionPlugin(config) {
  return {
    type: "task.error",
    action(data, context) {
      const error = config(data.error, {
        stdErr: context.stdErr,
        stdOut: context.stdOut,
        exitCode: context.exitCode
      });
      if (Buffer.isBuffer(error)) {
        return { error: new GitError(void 0, error.toString("utf-8")) };
      }
      return {
        error
      };
    }
  };
}
init_utils();
var PluginStore = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set();
    this.events = new import_node_events.EventEmitter();
  }
  on(type, listener) {
    this.events.on(type, listener);
  }
  reconfigure(type, data) {
    this.events.emit(type, data);
  }
  append(type, action) {
    const plugin = append(this.plugins, { type, action });
    return () => this.plugins.delete(plugin);
  }
  add(plugin) {
    const plugins = [];
    asArray(plugin).forEach((plugin2) => plugin2 && this.plugins.add(append(plugins, plugin2)));
    return () => {
      plugins.forEach((plugin2) => this.plugins.delete(plugin2));
    };
  }
  exec(type, data, context) {
    let output = data;
    const contextual = Object.freeze(Object.create(context));
    for (const plugin of this.plugins) {
      if (plugin.type === type) {
        output = plugin.action(output, contextual);
      }
    }
    return output;
  }
};
init_utils();
function progressMonitorPlugin(progress) {
  const progressCommand = "--progress";
  const progressMethods = ["checkout", "clone", "fetch", "pull", "push"];
  const onProgress = {
    type: "spawn.after",
    action(_data, context) {
      if (!context.commands.includes(progressCommand)) {
        return;
      }
      context.spawned.stderr?.on("data", (chunk) => {
        const message = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(chunk.toString("utf8"));
        if (!message) {
          return;
        }
        progress({
          method: context.method,
          stage: progressEventStage(message[1]),
          progress: asNumber(message[2]),
          processed: asNumber(message[3]),
          total: asNumber(message[4])
        });
      });
    }
  };
  const onArgs = {
    type: "spawn.args",
    action(args, context) {
      if (!progressMethods.includes(context.method)) {
        return args;
      }
      return including(args, progressCommand);
    }
  };
  return [onArgs, onProgress];
}
function progressEventStage(input) {
  return String(input.toLowerCase().split(" ", 1)) || "unknown";
}
init_utils();
function spawnOptionsPlugin(spawnOptions) {
  const options = pick(spawnOptions, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(data) {
      return { ...options, ...data };
    }
  };
}
function timeoutPlugin({
  block,
  stdErr = true,
  stdOut = true
}) {
  if (block > 0) {
    return {
      type: "spawn.after",
      action(_data, context) {
        let timeout;
        function wait() {
          timeout && clearTimeout(timeout);
          timeout = setTimeout(kill, block);
        }
        function stop() {
          context.spawned.stdout?.off("data", wait);
          context.spawned.stderr?.off("data", wait);
          context.spawned.off("exit", stop);
          context.spawned.off("close", stop);
          timeout && clearTimeout(timeout);
        }
        function kill() {
          stop();
          context.kill(new GitPluginError(void 0, "timeout", `block timeout reached`));
        }
        stdOut && context.spawned.stdout?.on("data", wait);
        stdErr && context.spawned.stderr?.on("data", wait);
        context.spawned.on("exit", stop);
        context.spawned.on("close", stop);
        wait();
      }
    };
  }
}
init_pathspec();
function suffixPathsPlugin() {
  return {
    type: "spawn.args",
    action(data) {
      const prefix = [];
      let suffix;
      function append2(args) {
        (suffix = suffix || []).push(...args);
      }
      for (let i = 0; i < data.length; i++) {
        const param = data[i];
        if (isPathSpec(param)) {
          append2(toPaths(param));
          continue;
        }
        if (param === "--") {
          append2(
            data.slice(i + 1).flatMap((item) => isPathSpec(item) && toPaths(item) || item)
          );
          break;
        }
        prefix.push(param);
      }
      return !suffix ? prefix : [...prefix, "--", ...suffix.map(String)];
    }
  };
}
init_utils();
var Git = require_git();
function gitInstanceFactory(baseDir, options) {
  const plugins = new PluginStore();
  const config = createInstanceConfig(
    baseDir && (typeof baseDir === "string" ? { baseDir } : baseDir) || {},
    options
  );
  if (!folderExists(config.baseDir)) {
    throw new GitConstructError(
      config,
      `Cannot use simple-git on a directory that does not exist`
    );
  }
  if (Array.isArray(config.config)) {
    plugins.add(commandConfigPrefixingPlugin(config.config));
  }
  plugins.add(blockUnsafeOperationsPlugin(config.unsafe));
  plugins.add(suffixPathsPlugin());
  plugins.add(completionDetectionPlugin(config.completion));
  config.abort && plugins.add(abortPlugin(config.abort));
  config.progress && plugins.add(progressMonitorPlugin(config.progress));
  config.timeout && plugins.add(timeoutPlugin(config.timeout));
  config.spawnOptions && plugins.add(spawnOptionsPlugin(config.spawnOptions));
  plugins.add(errorDetectionPlugin(errorDetectionHandler(true)));
  config.errors && plugins.add(errorDetectionPlugin(config.errors));
  customBinaryPlugin(plugins, config.binary, config.unsafe?.allowUnsafeCustomBinary);
  return new Git(config, plugins);
}
init_git_response_error();
var esm_default = gitInstanceFactory;

// src/core/ChangeDetector.ts
var path5 = __toESM(require("path"));
var fs5 = __toESM(require("fs"));
var ChangeDetector = class {
  constructor() {
    this.workspacePath = "";
    this.git = esm_default();
  }
  async initialize(workspace11) {
    this.workspacePath = workspace11.uri.fsPath;
    this.git = esm_default(this.workspacePath);
    try {
      await this.git.status();
    } catch (error) {
      throw new Error("Not a git repository. Please initialize git in this workspace.");
    }
  }
  async detectLocalChanges() {
    try {
      const status = await this.git.status();
      const changedFiles = [];
      for (const file of status.modified) {
        if (this.shouldSkipFile(file)) {
          continue;
        }
        const diff = await this.git.diff([file]);
        changedFiles.push({
          path: file,
          status: "modified",
          additions: this.countAdditions(diff),
          deletions: this.countDeletions(diff),
          diff
        });
      }
      for (const file of status.created) {
        if (this.shouldSkipFile(file)) {
          continue;
        }
        try {
          const filePath = path5.join(this.workspacePath, file);
          const content = fs5.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          changedFiles.push({
            path: file,
            status: "added",
            additions: lines.length,
            deletions: 0,
            diff: content
          });
        } catch (error) {
          changedFiles.push({
            path: file,
            status: "added"
          });
        }
      }
      for (const file of status.deleted) {
        if (this.shouldSkipFile(file)) {
          continue;
        }
        changedFiles.push({
          path: file,
          status: "deleted"
        });
      }
      for (const file of status.renamed) {
        if (this.shouldSkipFile(file.to)) {
          continue;
        }
        changedFiles.push({
          path: file.to,
          status: "renamed"
        });
      }
      for (const file of status.not_added || []) {
        if (this.shouldSkipFile(file)) {
          continue;
        }
        try {
          const filePath = path5.join(this.workspacePath, file);
          const content = fs5.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          changedFiles.push({
            path: file,
            status: "added",
            additions: lines.length,
            deletions: 0,
            diff: content
          });
        } catch (error) {
          changedFiles.push({
            path: file,
            status: "added"
          });
        }
      }
      return {
        type: "local" /* LOCAL */,
        source: "working directory",
        files: changedFiles
      };
    } catch (error) {
      return this.detectWorkspaceFiles();
    }
  }
  async detectWorkspaceFiles() {
    const changedFiles = [];
    if (!this.workspacePath) {
      const workspaceFolder = vscode5.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        this.workspacePath = workspaceFolder.uri.fsPath;
      } else {
        throw new Error("No workspace folder found");
      }
    }
    const files = await this.scanDirectory(this.workspacePath);
    for (const file of files) {
      try {
        const content = fs5.readFileSync(file, "utf8");
        const relativePath = path5.relative(this.workspacePath, file);
        const lines = content.split("\n");
        changedFiles.push({
          path: relativePath,
          status: "summary",
          additions: lines.length,
          deletions: 0,
          diff: content
        });
      } catch (error) {
        continue;
      }
    }
    return {
      type: "local" /* LOCAL */,
      source: "workspace files",
      files: changedFiles
    };
  }
  async scanDirectory(dirPath) {
    const files = [];
    try {
      const entries = fs5.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path5.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (this.shouldSkipDirectory(fullPath)) {
            continue;
          }
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          if (this.shouldSkipFile(fullPath)) {
            continue;
          }
          files.push(fullPath);
        }
      }
    } catch (error) {
    }
    return files;
  }
  async detectAndStoreLocalChanges() {
    const changeInfo = await this.detectLocalChanges();
    const filePath = await this.storeChangesToFile(changeInfo);
    return { changeInfo, filePath };
  }
  async storeChangesToFile(changeInfo) {
    const aiReviewDir = path5.join(this.workspacePath, ".ai-code-review");
    const changesDir = path5.join(aiReviewDir, "changes");
    if (!fs5.existsSync(aiReviewDir)) {
      fs5.mkdirSync(aiReviewDir, { recursive: true });
      await this.ensureGitignoreEntry();
    }
    if (!fs5.existsSync(changesDir)) {
      fs5.mkdirSync(changesDir, { recursive: true });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const fileName = `ai-code-review-changes-${timestamp}.json`;
    const filePath = path5.join(changesDir, fileName);
    const content = JSON.stringify(changeInfo, null, 2);
    fs5.writeFileSync(filePath, content, "utf8");
    return filePath;
  }
  async ensureGitignoreEntry() {
    const gitignorePath = path5.join(this.workspacePath, ".gitignore");
    const gitignoreEntry = ".ai-code-review/";
    try {
      let gitignoreContent = "";
      if (fs5.existsSync(gitignorePath)) {
        gitignoreContent = fs5.readFileSync(gitignorePath, "utf8");
        if (gitignoreContent.includes(gitignoreEntry)) {
          return;
        }
      }
      const newEntry = gitignoreContent.endsWith("\n") || gitignoreContent === "" ? `
# AI Code Review temporary files
${gitignoreEntry}
` : `

# AI Code Review temporary files
${gitignoreEntry}
`;
      fs5.writeFileSync(gitignorePath, gitignoreContent + newEntry, "utf8");
      vscode5.window.showInformationMessage(
        "Added .ai-code-review/ to .gitignore to prevent temporary files from being committed."
      );
    } catch (error) {
      console.warn("Failed to update .gitignore:", error);
    }
  }
  async detectCommitChanges(commitHash) {
    const diff = await this.git.diff([`${commitHash}^`, commitHash]);
    const changedFiles = this.parseDiffOutput(diff);
    return {
      type: "commit" /* COMMIT */,
      source: commitHash,
      files: changedFiles
    };
  }
  async detectBranchChanges(sourceBranch, targetBranch) {
    const diff = await this.git.diff([sourceBranch, targetBranch]);
    const changedFiles = this.parseDiffOutput(diff);
    return {
      type: "branch" /* BRANCH */,
      source: sourceBranch,
      target: targetBranch,
      files: changedFiles
    };
  }
  async getRecentCommits(limit = 10) {
    const log = await this.git.log({ maxCount: limit });
    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: new Date(commit.date)
    }));
  }
  async getBranches() {
    const branches = await this.git.branch();
    return branches.all;
  }
  async getDefaultSourceBranch() {
    const branches = await this.getBranches();
    const defaultBranches = ["develop", "main", "master"];
    for (const defaultBranch of defaultBranches) {
      if (branches.includes(defaultBranch)) {
        return defaultBranch;
      }
    }
    return null;
  }
  async detectAndStoreBranchChanges(sourceBranch, targetBranch) {
    const changeInfo = await this.detectBranchChanges(sourceBranch, targetBranch);
    const filePath = await this.storeChangesToFile(changeInfo);
    return { changeInfo, filePath };
  }
  async getCurrentBranch() {
    const status = await this.git.status();
    return status.current || "";
  }
  async getFileContent(filePath, commitHash) {
    try {
      if (commitHash) {
        return await this.git.show([`${commitHash}:${filePath}`]);
      } else {
        const fullPath = path5.join(this.workspacePath, filePath);
        const uri = vscode5.Uri.file(fullPath);
        const document2 = await vscode5.workspace.openTextDocument(uri);
        return document2.getText();
      }
    } catch (error) {
      throw new Error(`Failed to get file content for ${filePath}: ${error}`);
    }
  }
  parseDiffOutput(diff) {
    const changedFiles = [];
    const filePattern = /^diff --git a\/(.+) b\/(.+)$/gm;
    let match;
    while ((match = filePattern.exec(diff)) !== null) {
      const filePath = match[1];
      if (this.shouldSkipFile(filePath)) {
        continue;
      }
      const fileDiff = this.extractFileDiff(diff, filePath);
      const enhancedDiff = this.enhanceDiffWithLineNumbers(fileDiff);
      const additions = this.countAdditions(fileDiff);
      const deletions = this.countDeletions(fileDiff);
      let status = "modified";
      if (additions > 0 && deletions === 0) {
        status = "added";
      } else if (additions === 0 && deletions > 0) {
        status = "deleted";
      }
      changedFiles.push({
        path: filePath,
        status,
        additions,
        deletions,
        diff: enhancedDiff
      });
    }
    return changedFiles;
  }
  extractFileDiff(fullDiff, filePath) {
    const fileStartPattern = new RegExp(`^diff --git a/${filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} b/${filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m");
    const nextFilePattern = /^diff --git a\//gm;
    const startMatch = fileStartPattern.exec(fullDiff);
    if (!startMatch) {
      return fullDiff;
    }
    const startIndex = startMatch.index;
    nextFilePattern.lastIndex = startIndex + startMatch[0].length;
    const nextMatch = nextFilePattern.exec(fullDiff);
    if (nextMatch) {
      return fullDiff.substring(startIndex, nextMatch.index);
    } else {
      return fullDiff.substring(startIndex);
    }
  }
  enhanceDiffWithLineNumbers(diff) {
    const lines = diff.split("\n");
    const enhancedLines = [];
    let currentOldLine = 0;
    let currentNewLine = 0;
    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        currentOldLine = parseInt(hunkMatch[1]);
        currentNewLine = parseInt(hunkMatch[3]);
        enhancedLines.push(line + ` // OLD_START: ${currentOldLine}, NEW_START: ${currentNewLine}`);
        continue;
      }
      if (line.startsWith("+")) {
        enhancedLines.push(line + ` // LINE: ${currentNewLine}`);
        currentNewLine++;
      } else if (line.startsWith("-")) {
        enhancedLines.push(line + ` // OLD_LINE: ${currentOldLine}`);
        currentOldLine++;
      } else if (line.startsWith(" ")) {
        enhancedLines.push(line + ` // LINE: ${currentNewLine}`);
        currentOldLine++;
        currentNewLine++;
      } else {
        enhancedLines.push(line);
      }
    }
    return enhancedLines.join("\n");
  }
  countAdditions(diff) {
    const additionPattern = /^\+/gm;
    const matches = diff.match(additionPattern);
    return matches ? matches.length : 0;
  }
  countDeletions(diff) {
    const deletionPattern = /^-/gm;
    const matches = diff.match(deletionPattern);
    return matches ? matches.length : 0;
  }
  async isGitRepository() {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }
  async getRepositoryInfo() {
    try {
      const remotes = await this.git.getRemotes(true);
      const status = await this.git.status();
      return {
        remote: remotes[0]?.refs?.fetch || "",
        branch: status.current || ""
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error}`);
    }
  }
  async getAllRepositoryFiles() {
    try {
      const workspacePrompt = [
        "# Code Review Request: Complete Repository Analysis",
        "",
        "## IMPORTANT: Analysis Instructions",
        "- Analyze the ENTIRE codebase in this workspace by exploring all files and directories",
        "- When referencing files in your response, use RELATIVE paths from the project root",
        "- Example: Use `src/components/Button.tsx` NOT `./Button.tsx` or absolute paths",
        "- Focus on actual code files, not generated files or dependencies",
        "",
        "## Analysis Scope",
        "Please analyze the entire codebase and provide a comprehensive code review covering:",
        "",
        "1. **Architecture & Design Patterns**: Evaluate the overall code structure, design patterns, and architectural decisions",
        "2. **Code Quality**: Check for code smells, maintainability issues, and adherence to best practices",
        "3. **Security**: Identify potential security vulnerabilities and suggest improvements",
        "4. **Performance**: Look for performance bottlenecks and optimization opportunities",
        "5. **Documentation**: Assess code documentation and suggest improvements",
        "6. **Testing**: Evaluate test coverage and testing strategies",
        "",
        "## Response Format Requirements",
        "**CRITICAL:** Use RELATIVE file paths from the project root in your response.",
        "",
        "Please provide your analysis in the following JSON format:",
        "",
        "```json",
        "{",
        '  "summary": "Overall assessment of the codebase",',
        '  "issues": [',
        "    {",
        '      "file": "src/path/to/file.ts",',
        '      "line": 42,',
        '      "severity": "high|medium|low",',
        '      "type": "security|performance|maintainability|style|bug",',
        '      "message": "Description of the issue",',
        '      "suggestion": "Recommended fix or improvement"',
        "    }",
        "  ],",
        '  "recommendations": [',
        '    "General recommendations for improving the codebase"',
        "  ]",
        "}",
        "```",
        "",
        "## Important Guidelines",
        "- Use RELATIVE file paths from project root (e.g., `src/components/Button.tsx`)",
        "- Focus on the most critical issues that impact code quality, security, and maintainability",
        "- Provide specific, actionable suggestions for improvements",
        "- Consider the project context and technology stack when making recommendations",
        "- Explore the entire workspace to understand the full codebase structure"
      ].join("\n");
      const changedFiles = [{
        path: "WORKSPACE_ANALYSIS_PROMPT.md",
        status: "added",
        additions: workspacePrompt.split("\n").length,
        deletions: 0,
        diff: workspacePrompt
      }];
      return {
        type: "all-files" /* ALL_FILES */,
        source: "workspace-prompt",
        files: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to create workspace analysis prompt: ${error}`);
    }
  }
  /**
   * Creates a repository index with file metadata instead of full content
   * This prevents massive prompts when reviewing entire repositories
   */
  async getRepositoryIndex() {
    try {
      const files = await this.git.raw(["ls-files"]);
      const fileList = files.trim().split("\n").filter((file) => file.length > 0);
      const changedFiles = [];
      const fileStats = /* @__PURE__ */ new Map();
      for (const file of fileList) {
        if (this.shouldSkipFile(file)) {
          continue;
        }
        try {
          const filePath = path5.join(this.workspacePath, file);
          const stats = await fs5.promises.stat(filePath);
          const ext = path5.extname(file).toLowerCase();
          const category = this.getFileCategory(ext);
          let lineCount = 0;
          try {
            const content = await fs5.promises.readFile(filePath, "utf8");
            lineCount = content.split("\n").length;
          } catch {
            lineCount = 0;
          }
          if (!fileStats.has(category)) {
            fileStats.set(category, { count: 0, totalLines: 0 });
          }
          const catStats = fileStats.get(category);
          catStats.count++;
          catStats.totalLines += lineCount;
          const fileMetadata = [
            `File: ${file}`,
            `Type: ${category}`,
            `Size: ${stats.size} bytes`,
            `Lines: ${lineCount}`,
            `Modified: ${stats.mtime.toISOString()}`,
            ""
          ].join("\n");
          changedFiles.push({
            path: file,
            status: "indexed",
            additions: lineCount,
            deletions: 0,
            diff: fileMetadata
          });
        } catch (error) {
          continue;
        }
      }
      const summary = this.generateRepositorySummary(fileStats, changedFiles.length);
      changedFiles.unshift({
        path: "REPOSITORY_SUMMARY.md",
        status: "summary",
        additions: 0,
        deletions: 0,
        diff: summary
      });
      return {
        type: "all-files" /* ALL_FILES */,
        source: "repository-index",
        files: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to create repository index: ${error}`);
    }
  }
  getFileCategory(extension) {
    const categories = {
      ".ts": "TypeScript",
      ".js": "JavaScript",
      ".tsx": "React TypeScript",
      ".jsx": "React JavaScript",
      ".py": "Python",
      ".java": "Java",
      ".c": "C",
      ".cpp": "C++",
      ".cs": "C#",
      ".php": "PHP",
      ".rb": "Ruby",
      ".go": "Go",
      ".rs": "Rust",
      ".swift": "Swift",
      ".kt": "Kotlin",
      ".html": "HTML",
      ".css": "CSS",
      ".scss": "SCSS",
      ".json": "JSON",
      ".xml": "XML",
      ".yaml": "YAML",
      ".yml": "YAML",
      ".md": "Markdown",
      ".sql": "SQL",
      ".sh": "Shell Script",
      ".dockerfile": "Docker",
      ".gitignore": "Git Config",
      ".env": "Environment"
    };
    return categories[extension] || "Other";
  }
  generateRepositorySummary(fileStats, totalFiles) {
    const summary = [
      "# Repository Analysis Summary",
      "",
      `**Total Files Analyzed:** ${totalFiles}`,
      "",
      "## File Type Distribution:",
      ""
    ];
    const sortedStats = Array.from(fileStats.entries()).sort((a, b) => b[1].count - a[1].count);
    for (const [category, stats] of sortedStats) {
      summary.push(`- **${category}**: ${stats.count} files, ${stats.totalLines} total lines`);
    }
    summary.push("");
    summary.push("## Repository Structure:");
    summary.push("");
    summary.push("This is a repository index for AI analysis. Each file entry below contains:");
    summary.push("- File path and type");
    summary.push("- File size and line count");
    summary.push("- Last modification date");
    summary.push("");
    summary.push("**Note**: Full file content is not included to keep the prompt manageable.");
    summary.push("For detailed code review, please specify individual files or directories.");
    summary.push("");
    return summary.join("\n");
  }
  async getFilesByType(fileExtensions) {
    try {
      const files = await this.git.raw(["ls-files"]);
      const fileList = files.trim().split("\n").filter((file) => file.length > 0);
      const changedFiles = [];
      for (const file of fileList) {
        const ext = path5.extname(file).toLowerCase();
        if (!fileExtensions.includes(ext)) {
          continue;
        }
        if (this.shouldSkipDirectory(file)) {
          continue;
        }
        try {
          const content = await vscode5.workspace.fs.readFile(
            vscode5.Uri.file(path5.join(this.workspacePath, file))
          );
          changedFiles.push({
            path: file,
            status: "modified",
            additions: 0,
            deletions: 0,
            diff: content.toString()
          });
        } catch (error) {
          continue;
        }
      }
      return {
        type: "all-files" /* ALL_FILES */,
        source: "repository-filtered",
        files: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to get files by type: ${error}`);
    }
  }
  async getFilesByDirectory(directories) {
    try {
      const files = await this.git.raw(["ls-files"]);
      const fileList = files.trim().split("\n").filter((file) => file.length > 0);
      const changedFiles = [];
      for (const file of fileList) {
        const isInTargetDirectory = directories.some((dir) => {
          const normalizedDir = dir.endsWith("/") ? dir : dir + "/";
          return file.startsWith(normalizedDir) || file === dir;
        });
        if (!isInTargetDirectory) {
          continue;
        }
        if (this.shouldSkipBinaryFile(file)) {
          continue;
        }
        try {
          const content = await vscode5.workspace.fs.readFile(
            vscode5.Uri.file(path5.join(this.workspacePath, file))
          );
          changedFiles.push({
            path: file,
            status: "modified",
            additions: 0,
            deletions: 0,
            diff: content.toString()
          });
        } catch (error) {
          continue;
        }
      }
      return {
        type: "all-files" /* ALL_FILES */,
        source: "repository-directory",
        files: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to get files by directory: ${error}`);
    }
  }
  async getAllFilesIncludingSkipped() {
    try {
      const files = await this.git.raw(["ls-files"]);
      const fileList = files.trim().split("\n").filter((file) => file.length > 0);
      const changedFiles = [];
      for (const file of fileList) {
        if (this.shouldSkipBinaryFile(file)) {
          continue;
        }
        try {
          const content = await vscode5.workspace.fs.readFile(
            vscode5.Uri.file(path5.join(this.workspacePath, file))
          );
          changedFiles.push({
            path: file,
            status: "modified",
            additions: 0,
            deletions: 0,
            diff: content.toString()
          });
        } catch (error) {
          continue;
        }
      }
      return {
        type: "all-files" /* ALL_FILES */,
        source: "repository-complete",
        files: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to get all files including skipped: ${error}`);
    }
  }
  shouldSkipFile(filePath) {
    const skipExtensions = [
      // Images
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".ico",
      ".webp",
      ".bmp",
      ".tiff",
      // Archives and binaries
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".rar",
      ".7z",
      ".dmg",
      ".pkg",
      ".deb",
      ".rpm",
      // Executables and libraries
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      // Fonts
      ".ttf",
      ".otf",
      ".woff",
      ".woff2",
      ".eot",
      // Media files
      ".mp4",
      ".avi",
      ".mov",
      ".webm",
      ".mp3",
      ".wav",
      ".ogg",
      // Compiled/generated files
      ".min.js",
      ".min.css",
      ".map",
      // Database and cache files
      ".db",
      ".sqlite",
      ".sqlite3",
      ".cache",
      ".tmp",
      ".temp"
    ];
    const skipDirectories = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "out",
      ".vscode",
      // Additional config and cache directories
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
      ".pytest_cache",
      "__pycache__",
      ".venv",
      "venv",
      "env"
    ];
    const skipFiles = [
      ".gitignore",
      ".npmignore",
      "package-lock.json",
      "yarn.lock",
      // Auto-generated documentation
      "CHANGELOG.md",
      "LICENSE",
      "AUTHORS"
    ];
    for (const dir of skipDirectories) {
      if (filePath.includes(`${dir}/`) || filePath.startsWith(`${dir}/`)) {
        return true;
      }
    }
    const ext = path5.extname(filePath).toLowerCase();
    if (skipExtensions.includes(ext)) {
      return true;
    }
    if (ext === ".ts" && filePath.endsWith(".d.ts")) {
      return true;
    }
    const fileName = path5.basename(filePath);
    if (skipFiles.includes(fileName)) {
      return true;
    }
    return false;
  }
  shouldSkipDirectory(filePath) {
    const skipDirectories = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "out",
      ".vscode",
      // Additional config and cache directories
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
      ".pytest_cache",
      "__pycache__",
      ".venv",
      "venv",
      "env"
    ];
    for (const dir of skipDirectories) {
      if (filePath.includes(`${dir}/`) || filePath.startsWith(`${dir}/`)) {
        return true;
      }
    }
    return false;
  }
  shouldSkipBinaryFile(filePath) {
    const binaryExtensions = [
      // Images
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".ico",
      ".webp",
      ".bmp",
      ".tiff",
      ".svg",
      // Archives and binaries
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".rar",
      ".7z",
      ".dmg",
      ".pkg",
      ".deb",
      ".rpm",
      // Executables and libraries
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      // Fonts
      ".ttf",
      ".otf",
      ".woff",
      ".woff2",
      ".eot",
      // Media files
      ".mp4",
      ".avi",
      ".mov",
      ".webm",
      ".mp3",
      ".wav",
      ".ogg",
      // Database and cache files
      ".db",
      ".sqlite",
      ".sqlite3"
    ];
    const ext = path5.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }
};

// src/ui/CodeReviewPanel.ts
var vscode6 = __toESM(require("vscode"));
var CodeReviewPanel = class _CodeReviewPanel {
  constructor(panel, extensionUri) {
    this._disposables = [];
    this._currentIssues = [];
    this._reviewHistory = [];
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "openFile":
            this._openFile(message.file, message.line);
            return;
          case "filterIssues":
            this._filterIssues(message.severity);
            return;
          case "exportReview":
            this._exportReview(message.reviewId);
            return;
          case "clearHistory":
            this._clearHistory();
            return;
        }
      },
      null,
      this._disposables
    );
  }
  static {
    this.viewType = "aiCodeReview.panel";
  }
  static createOrShow(extensionUri) {
    const column = vscode6.window.activeTextEditor ? vscode6.window.activeTextEditor.viewColumn : void 0;
    if (_CodeReviewPanel.currentPanel) {
      _CodeReviewPanel.currentPanel._panel.reveal(column);
      return _CodeReviewPanel.currentPanel;
    }
    const panel = vscode6.window.createWebviewPanel(
      _CodeReviewPanel.viewType,
      "AI Code Review",
      column || vscode6.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true
      }
    );
    _CodeReviewPanel.currentPanel = new _CodeReviewPanel(panel, extensionUri);
    return _CodeReviewPanel.currentPanel;
  }
  static revive(panel, extensionUri) {
    _CodeReviewPanel.currentPanel = new _CodeReviewPanel(panel, extensionUri);
  }
  updateIssues(issues) {
    this._currentIssues = issues;
    this._panel.webview.postMessage({
      command: "updateIssues",
      issues: this._currentIssues
    });
  }
  addReviewToHistory(review) {
    this._reviewHistory.unshift(review);
    if (this._reviewHistory.length > 50) {
      this._reviewHistory = this._reviewHistory.slice(0, 50);
    }
    this._panel.webview.postMessage({
      command: "updateHistory",
      history: this._reviewHistory
    });
  }
  clearIssues() {
    this._currentIssues = [];
    this._panel.webview.postMessage({
      command: "clearIssues"
    });
  }
  _openFile(file, line) {
    let absolutePath = file;
    if (!absolutePath.startsWith("/") && !absolutePath.match(/^[a-zA-Z]:/)) {
      const workspaceFolder = vscode6.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        absolutePath = vscode6.Uri.joinPath(workspaceFolder.uri, file).fsPath;
      }
    }
    const uri = vscode6.Uri.file(absolutePath);
    vscode6.window.showTextDocument(uri).then((editor) => {
      if (line && line > 0) {
        const position = new vscode6.Position(line - 1, 0);
        editor.selection = new vscode6.Selection(position, position);
        editor.revealRange(new vscode6.Range(position, position));
      }
    });
  }
  _filterIssues(severity) {
    let filteredIssues = this._currentIssues;
    if (severity !== "all") {
      filteredIssues = this._currentIssues.filter((issue) => issue.severity === severity);
    }
    this._panel.webview.postMessage({
      command: "updateIssues",
      issues: filteredIssues
    });
  }
  async _exportReview(reviewId) {
    const review = this._reviewHistory.find((r) => r.metadata?.timestamp?.toString() === reviewId);
    if (!review) return;
    const exportData = {
      timestamp: review.metadata.timestamp,
      changeType: review.metadata.changeType,
      aiProvider: review.metadata.aiProvider,
      summary: review.summary,
      issues: review.issues,
      metadata: review.metadata
    };
    const content = JSON.stringify(exportData, null, 2);
    const fileName = `code-review-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    const uri = await vscode6.window.showSaveDialog({
      defaultUri: vscode6.Uri.file(fileName),
      filters: {
        "JSON Files": ["json"],
        "All Files": ["*"]
      }
    });
    if (uri) {
      await vscode6.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
      vscode6.window.showInformationMessage(`Review exported to ${uri.fsPath}`);
    }
  }
  _clearHistory() {
    this._reviewHistory = [];
    this._panel.webview.postMessage({
      command: "updateHistory",
      history: []
    });
  }
  dispose() {
    _CodeReviewPanel.currentPanel = void 0;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }
  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Review</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .tabs {
            display: flex;
            background: var(--vscode-tab-inactiveBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            border-bottom: 2px solid transparent;
        }
        .tab.active {
            background: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom-color: var(--vscode-focusBorder);
        }
        .tab:hover {
            background: var(--vscode-tab-hoverBackground);
        }
        .tab-content {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        .tab-panel {
            display: none;
        }
        .tab-panel.active {
            display: block;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .title {
            font-weight: bold;
            font-size: 14px;
        }
        .filter-buttons {
            display: flex;
            gap: 5px;
        }
        .filter-btn {
            padding: 4px 8px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 11px;
            border-radius: 3px;
        }
        .filter-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .filter-btn.active {
            background: var(--vscode-button-secondaryBackground);
        }
        .issue-item {
            margin-bottom: 12px;
            padding: 10px;
            border-left: 3px solid;
            background: var(--vscode-editor-inactiveSelectionBackground);
            cursor: pointer;
            border-radius: 3px;
        }
        .issue-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .issue-item.critical {
            border-left-color: #9b59b6;
        }
        .issue-item.high {
            border-left-color: #e74c3c;
        }
        .issue-item.medium {
            border-left-color: #f1c40f;
        }
        .issue-item.low {
            border-left-color: #3498db;
        }
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .issue-title {
            font-weight: bold;
            font-size: 13px;
        }
        .issue-severity {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .severity-critical {
            background: #9b59b6;
            color: white;
        }
        .severity-high {
            background: #e74c3c;
            color: white;
        }
        .severity-medium {
            background: #f1c40f;
            color: #2c3e50;
        }
        .severity-low {
            background: #3498db;
            color: white;
        }
        .issue-description {
            margin-bottom: 5px;
            font-size: 12px;
            line-height: 1.4;
        }
        .issue-location {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-family: var(--vscode-editor-font-family);
        }
        .no-content {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin-top: 50px;
        }
        .history-item {
            margin-bottom: 10px;
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 5px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .history-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .review-info {
            flex: 1;
        }
        .review-date {
            font-weight: bold;
            font-size: 12px;
            color: var(--vscode-textLink-foreground);
        }
        .review-meta {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }
        .review-actions {
            display: flex;
            gap: 5px;
        }
        .action-btn {
            padding: 2px 6px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 10px;
            border-radius: 2px;
        }
        .action-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .action-btn.load {
            background: var(--vscode-button-secondaryBackground);
        }
        .action-btn.delete {
            background: var(--vscode-errorForeground);
            color: white;
            border-color: var(--vscode-errorForeground);
        }
        .review-summary {
            font-size: 11px;
            line-height: 1.4;
            margin-bottom: 5px;
        }
        .review-stats {
            display: flex;
            gap: 10px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .stat-critical { color: #9b59b6; }
        .stat-high { color: #e74c3c; }
        .stat-medium { color: #f1c40f; }
        .stat-low { color: #3498db; }

    </style>
</head>
<body>
    <div class="container">

        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('issues')">Issues</button>
            <button class="tab" onclick="switchTab('history')">History</button>
        </div>
        
        <div class="tab-content">
            <!-- Issues Tab -->
            <div id="issues-panel" class="tab-panel active">
                <div class="header">
                    <div class="title">Code Review Issues</div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" onclick="filterIssues('all')">All</button>
                        <button class="filter-btn" onclick="filterIssues('critical')">Critical</button>
                        <button class="filter-btn" onclick="filterIssues('high')">High</button>
                        <button class="filter-btn" onclick="filterIssues('medium')">Medium</button>
                        <button class="filter-btn" onclick="filterIssues('low')">Low</button>
                    </div>
                </div>
                <div id="issues-container">
                    <div class="no-content">No issues found. Run a code review to see results here.</div>
                </div>
            </div>
            
            <!-- History Tab -->
            <div id="history-panel" class="tab-panel">
                <div class="header">
                    <div class="title">Review History</div>
                    <button class="filter-btn" onclick="clearHistory()">Clear All</button>
                </div>
                <div id="history-container">
                    <div class="no-content">No review history yet. Complete a code review to see results here.</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentIssues = [];
        let reviewHistory = [];
        let currentFilter = 'all';

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateIssues':
                    currentIssues = message.issues;
                    renderIssues(currentIssues);
                    break;
                case 'clearIssues':
                    currentIssues = [];
                    renderIssues([]);
                    break;
                case 'updateHistory':
                    reviewHistory = message.history;
                    renderHistory(reviewHistory);
                    break;

            }
        });

        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');

            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(tabName + '-panel').classList.add('active');
        }

        function renderIssues(issues) {
            const container = document.getElementById('issues-container');
            
            if (issues.length === 0) {
                container.innerHTML = '<div class="no-content">No issues found. Run a code review to see results here.</div>';
                return;
            }

            container.innerHTML = issues.map(issue => \`
                <div class="issue-item \${issue.severity}" onclick="openFile('\${issue.filePath}', \${issue.lineNumber})">
                    <div class="issue-header">
                        <div class="issue-title">\${escapeHtml(issue.title)}</div>
                        <div class="issue-severity severity-\${issue.severity}">\${issue.severity}</div>
                    </div>
                    <div class="issue-description">\${escapeHtml(issue.description)}</div>
                    <div class="issue-location">\${issue.filePath}:\${issue.lineNumber}</div>
                </div>
            \`).join('');
        }

        function renderHistory(history) {
            const container = document.getElementById('history-container');
            
            if (history.length === 0) {
                container.innerHTML = '<div class="no-content">No review history yet. Complete a code review to see results here.</div>';
                return;
            }

            container.innerHTML = history.map(review => {
                const date = new Date(review.metadata.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                const reviewId = review.metadata.timestamp.toString();
                
                return \`
                    <div class="history-item">
                        <div class="review-header">
                            <div class="review-info">
                                <div class="review-date">\${dateStr}</div>
                                <div class="review-meta">\${review.metadata.changeType} \u2022 \${review.metadata.aiProvider}</div>
                            </div>
                            <div class="review-actions">
                                <button class="action-btn load" onclick="loadReview('\${reviewId}')">Load</button>
                                <button class="action-btn" onclick="exportReview('\${reviewId}')">Export</button>
                            </div>
                        </div>
                        <div class="review-summary">Total Issues: \${review.summary.totalIssues}, Critical: \${review.summary.criticalIssues}</div>
                        <div class="review-stats">
                            \${review.summary.criticalIssues > 0 ? \`<div class="stat-item stat-critical">Critical: \${review.summary.criticalIssues}</div>\` : ''}
                            \${review.summary.highIssues > 0 ? \`<div class="stat-item stat-high">High: \${review.summary.highIssues}</div>\` : ''}
                            \${review.summary.mediumIssues > 0 ? \`<div class="stat-item stat-medium">Medium: \${review.summary.mediumIssues}</div>\` : ''}
                            \${review.summary.lowIssues > 0 ? \`<div class="stat-item stat-low">Low: \${review.summary.lowIssues}</div>\` : ''}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function openFile(file, line) {
            vscode.postMessage({
                command: 'openFile',
                file: file,
                line: line
            });
        }

        function filterIssues(severity) {
            currentFilter = severity;
            
            // Update button states
            document.querySelectorAll('#issues-panel .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            vscode.postMessage({
                command: 'filterIssues',
                severity: severity
            });
        }

        function loadReview(reviewId) {
            const review = reviewHistory.find(r => r.metadata.timestamp.toString() === reviewId);
            if (review) {
                currentIssues = review.issues;
                renderIssues(currentIssues);
                switchTab('issues');
            }
        }

        function exportReview(reviewId) {
            vscode.postMessage({
                command: 'exportReview',
                reviewId: reviewId
            });
        }

        function clearHistory() {
            if (confirm('Are you sure you want to clear all review history?')) {
                vscode.postMessage({
                    command: 'clearHistory'
                });
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
  }
};

// src/ui/WorkflowGuidePanel.ts
var vscode7 = __toESM(require("vscode"));
var WorkflowGuidePanel = class _WorkflowGuidePanel {
  constructor(panel, extensionUri) {
    this._disposables = [];
    this._panel = panel;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode7.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }
  static {
    this.viewType = "workflowGuide";
  }
  static createOrShow(extensionUri) {
    const column = vscode7.window.activeTextEditor ? vscode7.window.activeTextEditor.viewColumn : void 0;
    if (_WorkflowGuidePanel.currentPanel) {
      _WorkflowGuidePanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode7.window.createWebviewPanel(
      _WorkflowGuidePanel.viewType,
      "AI Code Review - Workflow Guide",
      column || vscode7.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode7.Uri.joinPath(extensionUri, "media")]
      }
    );
    _WorkflowGuidePanel.currentPanel = new _WorkflowGuidePanel(panel, extensionUri);
  }
  static revive(panel, extensionUri) {
    _WorkflowGuidePanel.currentPanel = new _WorkflowGuidePanel(panel, extensionUri);
  }
  dispose() {
    _WorkflowGuidePanel.currentPanel = void 0;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  _update() {
    const webview = this._panel.webview;
    this._panel.title = "AI Code Review - Workflow Guide";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }
  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Review - Workflow Guide</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 10px;
        }
        .step {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .step-number {
            font-size: 1.2em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .step-title {
            font-size: 1.1em;
            font-weight: bold;
            margin: 5px 0;
        }
        .step-description {
            margin-top: 10px;
        }
        .highlight {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .info {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>\u{1F916} AI Code Review Workflow Guide</h1>
        
        <div class="info">
            <strong>\u{1F4CB} Overview:</strong> This extension helps you generate prompts for external AI services to review your code. Follow these steps for the best results.
        </div>

        <div class="step">
            <div class="step-number">Step 1</div>
            <div class="step-title">\u{1F4DD} Copy Prompt for External AI</div>
            <div class="step-description">
                Click the <span class="highlight">"Copy Prompt for External AI"</span> button in the sidebar to generate and copy a comprehensive prompt to your clipboard. This prompt includes:
                <ul>
                    <li>Your code changes or selected files</li>
                    <li>Context about your project</li>
                    <li>Specific instructions for the AI to review your code</li>
                </ul>
            </div>
        </div>

        <div class="step">
            <div class="step-number">Step 2</div>
            <div class="step-title">\u{1F916} Paste to AI Chat</div>
            <div class="step-description">
                Open your preferred AI service (ChatGPT, Claude, Gemini, etc.) and paste the copied prompt. The AI will analyze your code and provide:
                <ul>
                    <li>Code quality feedback</li>
                    <li>Security vulnerability detection</li>
                    <li>Performance optimization suggestions</li>
                    <li>Best practice recommendations</li>
                </ul>
            </div>
        </div>

        <div class="step">
            <div class="step-number">Step 3</div>
            <div class="step-title">\u{1F4CA} Check Scan Result</div>
            <div class="step-description">
                After receiving the AI's response, copy it and save it as a file in the <span class="highlight">.ai-code-review/results</span> folder. Then click the <span class="highlight">"Check Scan Result"</span> button in the sidebar to:
                <ul>
                    <li>View all your saved scan results</li>
                    <li>Compare different AI responses</li>
                    <li>Track your code improvement over time</li>
                </ul>
            </div>
        </div>

        <div class="warning">
            <strong>\u26A0\uFE0F Important:</strong> This extension generates prompts for external AI services. Make sure you're comfortable sharing your code with third-party AI providers and follow your organization's security policies.
        </div>

        <div class="info">
            <strong>\u{1F4A1} Tips:</strong>
            <ul>
                <li>Use different AI services to get varied perspectives on your code</li>
                <li>Save AI responses with descriptive filenames (e.g., "security-review-2024-01-15.md")</li>
                <li>Review the AI suggestions carefully before implementing changes</li>
                <li>Use the Default Change Type settings to focus on specific areas of your codebase</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  }
};

// src/ui/InlineAnnotationsProvider.ts
var vscode8 = __toESM(require("vscode"));
var InlineAnnotationsProvider = class {
  constructor() {
    this._decorationTypes = /* @__PURE__ */ new Map();
    this._issues = [];
    this._diagnosticCollection = vscode8.languages.createDiagnosticCollection("aiCodeReview");
    this._initializeDecorationTypes();
    vscode8.window.onDidChangeActiveTextEditor(() => {
      this._updateDecorations();
    });
  }
  _initializeDecorationTypes() {
    this._decorationTypes.set("critical" /* CRITICAL */, vscode8.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 68, 68, 0.1)",
      border: "1px solid #ff4444",
      borderWidth: "0 0 0 3px",
      overviewRulerColor: "#ff4444",
      overviewRulerLane: vscode8.OverviewRulerLane.Right,
      after: {
        contentText: " \u26A0\uFE0F Critical",
        color: "#ff4444",
        fontWeight: "bold"
      }
    }));
    this._decorationTypes.set("high" /* HIGH */, vscode8.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 136, 0, 0.1)",
      border: "1px solid #ff8800",
      borderWidth: "0 0 0 3px",
      overviewRulerColor: "#ff8800",
      overviewRulerLane: vscode8.OverviewRulerLane.Right,
      after: {
        contentText: " \u26A0\uFE0F High",
        color: "#ff8800",
        fontWeight: "bold"
      }
    }));
    this._decorationTypes.set("medium" /* MEDIUM */, vscode8.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 204, 0, 0.1)",
      border: "1px solid #ffcc00",
      borderWidth: "0 0 0 3px",
      overviewRulerColor: "#ffcc00",
      overviewRulerLane: vscode8.OverviewRulerLane.Right,
      after: {
        contentText: " \u26A0\uFE0F Medium",
        color: "#ffcc00"
      }
    }));
    this._decorationTypes.set("low" /* LOW */, vscode8.window.createTextEditorDecorationType({
      backgroundColor: "rgba(0, 170, 0, 0.1)",
      border: "1px solid #00aa00",
      borderWidth: "0 0 0 3px",
      overviewRulerColor: "#00aa00",
      overviewRulerLane: vscode8.OverviewRulerLane.Right,
      after: {
        contentText: " \u2139\uFE0F Low",
        color: "#00aa00"
      }
    }));
  }
  updateIssues(issues) {
    this._issues = issues;
    this._updateDecorations();
    this._updateDiagnostics();
  }
  clearIssues() {
    this._issues = [];
    this._clearDecorations();
    this._diagnosticCollection.clear();
  }
  _updateDecorations() {
    const editor = vscode8.window.activeTextEditor;
    if (!editor) {
      return;
    }
    this._decorationTypes.forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
    const currentFileIssues = this._issues.filter(
      (issue) => issue.filePath === editor.document.uri.fsPath || issue.filePath === editor.document.uri.path || issue.filePath.endsWith(editor.document.uri.fsPath.split("/").pop() || "")
    );
    const issuesBySeverity = /* @__PURE__ */ new Map();
    currentFileIssues.forEach((issue) => {
      if (!issuesBySeverity.has(issue.severity)) {
        issuesBySeverity.set(issue.severity, []);
      }
      issuesBySeverity.get(issue.severity).push(issue);
    });
    issuesBySeverity.forEach((issues, severity) => {
      const decorationType = this._decorationTypes.get(severity);
      if (!decorationType) return;
      const decorations = issues.map((issue) => {
        const line = Math.max(0, issue.lineNumber - 1);
        const range = new vscode8.Range(
          line,
          issue.columnNumber || 0,
          line,
          editor.document.lineAt(line).text.length
        );
        return {
          range,
          hoverMessage: new vscode8.MarkdownString(
            `**${issue.title}** (${issue.severity})

${issue.description}

` + (issue.suggestions.length > 0 ? `**Suggestions:**
${issue.suggestions.map((s) => `\u2022 ${s.description}`).join("\n")}` : "")
          )
        };
      });
      editor.setDecorations(decorationType, decorations);
    });
  }
  _updateDiagnostics() {
    const diagnosticMap = /* @__PURE__ */ new Map();
    this._issues.forEach((issue) => {
      let absolutePath = issue.filePath;
      if (!absolutePath.startsWith("/") && !absolutePath.match(/^[a-zA-Z]:/)) {
        const workspaceFolder = vscode8.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
          absolutePath = vscode8.Uri.joinPath(workspaceFolder.uri, issue.filePath).fsPath;
        }
      }
      const uri = vscode8.Uri.file(absolutePath);
      const uriString = uri.toString();
      if (!diagnosticMap.has(uriString)) {
        diagnosticMap.set(uriString, []);
      }
      const line = Math.max(0, issue.lineNumber - 1);
      const range = new vscode8.Range(
        line,
        issue.columnNumber || 0,
        line,
        issue.columnNumber ? issue.columnNumber + 10 : 100
        // Approximate end position
      );
      const diagnostic = new vscode8.Diagnostic(
        range,
        `${issue.title}: ${issue.description}`,
        this._getSeverityLevel(issue.severity)
      );
      diagnostic.source = "AI Code Review";
      diagnostic.code = issue.id;
      diagnosticMap.get(uriString).push(diagnostic);
    });
    this._diagnosticCollection.clear();
    diagnosticMap.forEach((diagnostics, uriString) => {
      this._diagnosticCollection.set(vscode8.Uri.parse(uriString), diagnostics);
    });
  }
  _getSeverityLevel(severity) {
    switch (severity) {
      case "critical" /* CRITICAL */:
        return vscode8.DiagnosticSeverity.Error;
      case "high" /* HIGH */:
        return vscode8.DiagnosticSeverity.Error;
      case "medium" /* MEDIUM */:
        return vscode8.DiagnosticSeverity.Warning;
      case "low" /* LOW */:
        return vscode8.DiagnosticSeverity.Information;
      default:
        return vscode8.DiagnosticSeverity.Information;
    }
  }
  _clearDecorations() {
    const editor = vscode8.window.activeTextEditor;
    if (!editor) {
      return;
    }
    this._decorationTypes.forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
  }
  dispose() {
    this._decorationTypes.forEach((decorationType) => {
      decorationType.dispose();
    });
    this._diagnosticCollection.dispose();
  }
};

// src/ui/CodeReviewTreeProvider.ts
var vscode9 = __toESM(require("vscode"));
var fs6 = __toESM(require("fs"));
var path6 = __toESM(require("path"));
var CodeReviewTreeProvider = class {
  constructor() {
    this._onDidChangeTreeData = new vscode9.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.currentDefaultChangeType = "local";
    this.loadDefaultChangeType();
  }
  hasResultFiles() {
    const workspaceFolder = vscode9.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return false;
    }
    const resultsPath = path6.join(workspaceFolder.uri.fsPath, ".ai-code-review", "results");
    try {
      if (!fs6.existsSync(resultsPath)) {
        return false;
      }
      const files = fs6.readdirSync(resultsPath);
      return files.length > 0;
    } catch (error) {
      return false;
    }
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  loadDefaultChangeType() {
    const config = vscode9.workspace.getConfiguration("aiCodeReview");
    this.currentDefaultChangeType = config.get("defaultChangeType", "local");
  }
  updateDefaultChangeType(changeType) {
    this.currentDefaultChangeType = changeType;
    this.refresh();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      return Promise.resolve([
        new CodeReviewItem(
          "Open Workflow Guide",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.openWorkflowGuide",
            title: "Open Workflow Guide",
            arguments: []
          },
          "action",
          "book",
          "Open detailed workflow guide in a new panel"
        ),
        new CodeReviewItem(
          "Configure Change Type",
          vscode9.TreeItemCollapsibleState.Expanded,
          void 0,
          "defaultChangeTypeGroup",
          "gear"
        ),
        new CodeReviewItem(
          "Generate AI Prompt",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.copyPrompt",
            title: "Copy Prompt",
            arguments: []
          },
          "action",
          "copy"
        ),
        new CodeReviewItem(
          "Paste Prompt to AI Chat",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.pastePrompt",
            title: "Paste Prompt to AI Chat",
            arguments: []
          },
          "action",
          "send"
        ),
        new CodeReviewItem(
          "Generate Code Review Result",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.checkReviewResult",
            title: "Generate Code Review Result",
            arguments: []
          },
          "action",
          "check",
          "Generate Code Review results"
        )
        // new CodeReviewItem(
        //     'View Code Review Report',
        //     vscode.TreeItemCollapsibleState.None,
        //     {
        //         title: 'Open Panel',
        //         arguments: []
        //     },
        //     'action',
        //     'eye'
        // ),
      ]);
    } else if (element.contextValue === "defaultChangeTypeGroup") {
      return Promise.resolve([
        new CodeReviewItem(
          "Local Changes",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.setDefaultChangeType",
            title: "Set Default to Local Changes",
            arguments: ["local"]
          },
          "changeTypeOption",
          this.currentDefaultChangeType === "local" ? "check" : "circle-outline",
          this.currentDefaultChangeType === "local" ? "Currently selected" : "Click to set as default"
        ),
        new CodeReviewItem(
          "All Files",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.setDefaultChangeType",
            title: "Set Default to All Files",
            arguments: ["all-files"]
          },
          "changeTypeOption",
          this.currentDefaultChangeType === "all-files" ? "check" : "circle-outline",
          this.currentDefaultChangeType === "all-files" ? "Currently selected" : "Click to set as default"
        ),
        new CodeReviewItem(
          "Compare Branches",
          vscode9.TreeItemCollapsibleState.None,
          {
            command: "aiCodeReview.setDefaultChangeType",
            title: "Set Default to Compare Branches",
            arguments: ["branch"]
          },
          "changeTypeOption",
          this.currentDefaultChangeType === "branch" ? "check" : "circle-outline",
          this.currentDefaultChangeType === "branch" ? "Currently selected" : "Click to set as default"
        )
      ]);
    }
    return Promise.resolve([]);
  }
};
var CodeReviewItem = class extends vscode9.TreeItem {
  constructor(label, collapsibleState, command, contextValue, iconName, tooltipText) {
    super(label, collapsibleState);
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.command = command;
    this.contextValue = contextValue;
    this.iconName = iconName;
    this.tooltipText = tooltipText;
    this.tooltip = tooltipText || this.label;
    this.contextValue = contextValue || "codeReviewItem";
    if (iconName) {
      this.iconPath = new vscode9.ThemeIcon(iconName);
    }
  }
};

// src/ui/IssuesPanelProvider.ts
var vscode10 = __toESM(require("vscode"));
var IssuesPanelProvider = class {
  constructor() {
    this._onDidChangeTreeData = new vscode10.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.issues = [];
    this.groupBy = "severity";
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  updateIssues(issues) {
    this.issues = issues;
    this.refresh();
  }
  setGroupBy(groupBy) {
    this.groupBy = groupBy;
    this.refresh();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!element) {
      if (this.issues.length === 0) {
        return Promise.resolve([
          new IssueItem(
            "No issues found",
            "info",
            vscode10.TreeItemCollapsibleState.None,
            void 0,
            "Run a code review to see issues here"
          )
        ]);
      }
      return Promise.resolve(this.getGroupedItems());
    } else if (element.contextValue === "issueGroup") {
      return Promise.resolve(this.getIssuesForGroup(element));
    }
    return Promise.resolve([]);
  }
  getGroupedItems() {
    const groups = /* @__PURE__ */ new Map();
    this.issues.forEach((issue) => {
      let groupKey;
      switch (this.groupBy) {
        case "severity":
          groupKey = issue.severity;
          break;
        case "category":
          groupKey = issue.category;
          break;
        case "file":
          groupKey = this.getFileName(issue.filePath);
          break;
        default:
          groupKey = issue.severity;
      }
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(issue);
    });
    const groupItems = [];
    groups.forEach((issues, groupKey) => {
      const iconName = this.getGroupIcon(groupKey);
      const label = `${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)} (${issues.length})`;
      const color = this.groupBy === "severity" ? this.getSeverityColor(groupKey) : void 0;
      groupItems.push(new IssueItem(
        label,
        iconName,
        vscode10.TreeItemCollapsibleState.Expanded,
        void 0,
        `${issues.length} issues in ${groupKey}`,
        "issueGroup",
        groupKey,
        void 0,
        color
      ));
    });
    return this.sortGroups(groupItems);
  }
  getIssuesForGroup(groupItem) {
    const groupKey = groupItem.groupKey;
    let filteredIssues;
    switch (this.groupBy) {
      case "severity":
        filteredIssues = this.issues.filter((issue) => issue.severity === groupKey);
        break;
      case "category":
        filteredIssues = this.issues.filter((issue) => issue.category === groupKey);
        break;
      case "file":
        filteredIssues = this.issues.filter((issue) => this.getFileName(issue.filePath) === groupKey);
        break;
      default:
        filteredIssues = [];
    }
    return filteredIssues.map((issue) => {
      const iconName = this.getSeverityIcon(issue.severity);
      const label = issue.title;
      const description = `${this.getFileName(issue.filePath)}:${issue.lineNumber}`;
      const color = this.getSeverityColor(issue.severity);
      const workspaceFolder = vscode10.workspace.workspaceFolders?.[0];
      let fileUri;
      if (workspaceFolder && !issue.filePath.startsWith("/") && !issue.filePath.match(/^[a-zA-Z]:/)) {
        fileUri = vscode10.Uri.joinPath(workspaceFolder.uri, issue.filePath);
      } else {
        fileUri = vscode10.Uri.file(issue.filePath);
      }
      return new IssueItem(
        label,
        iconName,
        vscode10.TreeItemCollapsibleState.None,
        {
          command: "vscode.open",
          title: "Open File",
          arguments: [
            fileUri,
            {
              selection: new vscode10.Range(
                Math.max(0, issue.lineNumber - 1),
                issue.columnNumber || 0,
                Math.max(0, issue.lineNumber - 1),
                issue.columnNumber || 0
              )
            }
          ]
        },
        `${issue.severity} - ${issue.description}`,
        "issue",
        void 0,
        description,
        color
      );
    });
  }
  getFileName(filePath) {
    return filePath.split("/").pop() || filePath;
  }
  getGroupIcon(groupKey) {
    switch (this.groupBy) {
      case "severity":
        return this.getSeverityIcon(groupKey);
      case "category":
        return this.getCategoryIcon(groupKey);
      case "file":
        return "file";
      default:
        return "folder";
    }
  }
  getSeverityIcon(severity) {
    switch (severity) {
      case "critical" /* CRITICAL */:
        return "error";
      case "high" /* HIGH */:
        return "warning";
      case "medium" /* MEDIUM */:
        return "info";
      case "low" /* LOW */:
        return "check";
      default:
        return "circle-outline";
    }
  }
  getSeverityColor(severity) {
    switch (severity) {
      case "critical" /* CRITICAL */:
        return new vscode10.ThemeColor("charts.purple");
      case "high" /* HIGH */:
        return new vscode10.ThemeColor("errorForeground");
      case "medium" /* MEDIUM */:
        return new vscode10.ThemeColor("problemsWarningIcon.foreground");
      case "low" /* LOW */:
        return new vscode10.ThemeColor("charts.blue");
      default:
        return void 0;
    }
  }
  getCategoryIcon(category) {
    switch (category) {
      case "security" /* SECURITY */:
        return "shield";
      case "performance" /* PERFORMANCE */:
        return "zap";
      case "code-quality" /* CODE_QUALITY */:
        return "code";
      case "best-practices" /* BEST_PRACTICES */:
        return "thumbsup";
      case "style" /* STYLE */:
        return "paintcan";
      case "maintainability" /* MAINTAINABILITY */:
        return "tools";
      case "testing" /* TESTING */:
        return "beaker";
      case "documentation" /* DOCUMENTATION */:
        return "book";
      default:
        return "question";
    }
  }
  sortGroups(groups) {
    if (this.groupBy === "severity") {
      const severityOrder = ["critical" /* CRITICAL */, "high" /* HIGH */, "medium" /* MEDIUM */, "low" /* LOW */];
      return groups.sort((a, b) => {
        const aIndex = severityOrder.findIndex((s) => a.groupKey === s);
        const bIndex = severityOrder.findIndex((s) => b.groupKey === s);
        return aIndex - bIndex;
      });
    }
    return groups.sort((a, b) => a.label.localeCompare(b.label));
  }
};
var IssueItem = class extends vscode10.TreeItem {
  constructor(label, iconName, collapsibleState, command, tooltip, contextValue, groupKey, description, iconColor) {
    super(label, collapsibleState);
    this.label = label;
    this.iconName = iconName;
    this.collapsibleState = collapsibleState;
    this.command = command;
    this.tooltip = tooltip;
    this.contextValue = contextValue;
    this.groupKey = groupKey;
    this.description = description;
    this.iconColor = iconColor;
    this.tooltip = tooltip || this.label;
    this.description = description;
    this.contextValue = contextValue || "issueItem";
    this.iconPath = new vscode10.ThemeIcon(iconName, iconColor);
  }
};

// src/extension.ts
var externalAIManager;
var changeDetector;
var inlineAnnotationsProvider;
var codeReviewTreeProvider;
var issuesPanelProvider;
function activate(context) {
  console.log("AI Code Review Assistant is now active!");
  changeDetector = new ChangeDetector();
  const workspaceFolder = vscode11.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    changeDetector.initialize(workspaceFolder).catch((error) => {
      console.error("Failed to initialize ChangeDetector:", error);
    });
  }
  externalAIManager = ExternalAIManager.getInstance();
  externalAIManager.setChangeDetector(changeDetector);
  inlineAnnotationsProvider = new InlineAnnotationsProvider();
  codeReviewTreeProvider = new CodeReviewTreeProvider();
  issuesPanelProvider = new IssuesPanelProvider();
  vscode11.window.registerTreeDataProvider("aiCodeReviewPanel", codeReviewTreeProvider);
  vscode11.window.registerTreeDataProvider("aiCodeReviewIssues", issuesPanelProvider);
  const commands2 = [
    // External AI commands
    vscode11.commands.registerCommand("aiCodeReview.copyPrompt", async () => {
      const config = vscode11.workspace.getConfiguration("aiCodeReview");
      const defaultChangeType = config.get("defaultChangeType", "local");
      const commandMap = {
        "local": "aiCodeReview.copyPromptLocalChanges",
        "commit": "aiCodeReview.copyPromptCompareBranches",
        // Use branch comparison for commit-like workflow
        "branch": "aiCodeReview.copyPromptCompareBranches",
        "all-files": "aiCodeReview.copyPromptAllFiles"
      };
      const command = commandMap[defaultChangeType];
      if (command) {
        await vscode11.commands.executeCommand(command);
      } else {
        const options = [
          {
            label: "$(git-branch) Local Changes",
            description: "Only local changes",
            command: "aiCodeReview.copyPromptLocalChanges"
          },
          {
            label: "$(folder) All Files",
            description: "Scan all Files in workspace",
            command: "aiCodeReview.copyPromptAllFiles"
          },
          {
            label: "$(git-compare) Compare Branches",
            description: "Compare changes between two branches",
            command: "aiCodeReview.copyPromptCompareBranches"
          }
        ];
        const selected = await vscode11.window.showQuickPick(options, {
          placeHolder: "Select the type of code review prompt to copy"
        });
        if (selected) {
          await vscode11.commands.executeCommand(selected.command);
        }
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.copyPromptLocalChanges", async () => {
      try {
        const request = {
          changeInfo: {
            type: "local" /* LOCAL */,
            source: "workspace",
            files: []
          },
          aiProvider: "external"
        };
        await externalAIManager.copyPromptToClipboard(request);
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to copy prompt for local changes: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.copyPromptAllFiles", async () => {
      try {
        const request = {
          changeInfo: {
            type: "all-files" /* ALL_FILES */,
            source: "workspace",
            files: []
          },
          aiProvider: "external"
        };
        await externalAIManager.copyPromptToClipboard(request);
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to copy prompt for all files: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.copyPromptCompareBranches", async () => {
      try {
        const branches = await changeDetector.getBranches();
        if (branches.length < 2) {
          vscode11.window.showErrorMessage("At least 2 branches are required for comparison.");
          return;
        }
        const defaultSourceBranch = await changeDetector.getDefaultSourceBranch();
        const currentBranch = await changeDetector.getCurrentBranch();
        const branchOptions = branches.map((branch) => ({
          label: branch,
          description: branch === currentBranch ? "(current)" : ""
        }));
        const selectedSource = await vscode11.window.showQuickPick(branchOptions, {
          placeHolder: `Select source branch ${defaultSourceBranch ? `(default: ${defaultSourceBranch})` : ""}`,
          title: "Compare Branches - Step 1/2: Select Source Branch"
        });
        if (!selectedSource) {
          return;
        }
        const sourceBranch = selectedSource.label;
        const targetBranchOptions = branches.filter((branch) => branch !== sourceBranch).map((branch) => ({
          label: branch,
          description: branch === currentBranch ? "(current)" : ""
        }));
        const selectedTarget = await vscode11.window.showQuickPick(targetBranchOptions, {
          placeHolder: "Select target branch to compare against",
          title: "Compare Branches - Step 2/2: Select Target Branch"
        });
        if (!selectedTarget) {
          return;
        }
        const targetBranch = selectedTarget.label;
        const request = {
          changeInfo: {
            type: "branch" /* BRANCH */,
            source: sourceBranch,
            target: targetBranch,
            files: []
          },
          aiProvider: "external"
        };
        await externalAIManager.copyPromptToClipboard(request);
        vscode11.window.showInformationMessage(`Comparing changes from ${sourceBranch} to ${targetBranch}`);
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to copy prompt for branch comparison: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.checkReviewResult", async () => {
      try {
        const result = await externalAIManager.checkReviewResultFromFile();
        if (result) {
          const panel = CodeReviewPanel.createOrShow(context.extensionUri);
          panel.updateIssues(result.issues);
          panel.addReviewToHistory(result);
          inlineAnnotationsProvider.updateIssues(result.issues);
          issuesPanelProvider.updateIssues(result.issues);
          vscode11.window.showInformationMessage("Code review result processed successfully!");
        }
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to process review result: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.openPromptFile", async () => {
      try {
        const promptFilePath = await externalAIManager.getLastPromptFilePath();
        if (promptFilePath) {
          await vscode11.commands.executeCommand("vscode.open", vscode11.Uri.file(promptFilePath));
        } else {
          vscode11.window.showInformationMessage("No prompt file found. Generate a prompt first.");
        }
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to open prompt file: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.openChangeFile", async () => {
      try {
        const changeFilePath = await externalAIManager.getLastChangeFilePath();
        if (changeFilePath) {
          await vscode11.commands.executeCommand("vscode.open", vscode11.Uri.file(changeFilePath));
        } else {
          vscode11.window.showInformationMessage("No change file found. Generate a prompt first.");
        }
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to open change file: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.openSettings", async () => {
      try {
        await vscode11.commands.executeCommand("workbench.action.openSettings", "@ext:ai-code-review.ai-code-review-assistant");
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to open settings: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.setDefaultChangeType", async (changeType) => {
      try {
        const config = vscode11.workspace.getConfiguration("aiCodeReview");
        await config.update("defaultChangeType", changeType, vscode11.ConfigurationTarget.Global);
        codeReviewTreeProvider.updateDefaultChangeType(changeType);
        vscode11.window.showInformationMessage(`Default change type set to: ${changeType}`);
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to set default change type: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.checkScanResult", async () => {
      try {
        const workspaceFolder2 = vscode11.workspace.workspaceFolders?.[0];
        if (!workspaceFolder2) {
          vscode11.window.showErrorMessage("No workspace folder found");
          return;
        }
        const resultsPath = vscode11.Uri.file(workspaceFolder2.uri.fsPath + "/.ai-code-review/results");
        await vscode11.commands.executeCommand("revealFileInOS", resultsPath);
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to open scan results: ${error}`);
      }
    }),
    vscode11.commands.registerCommand("aiCodeReview.openWorkflowGuide", () => {
      WorkflowGuidePanel.createOrShow(context.extensionUri);
    }),
    vscode11.commands.registerCommand("aiCodeReview.pastePrompt", async () => {
      try {
        const message = "Copy the prompt from clipboard and paste it into your AI chat (e.g., ChatGPT, Claude, Copilot Chat). The prompt has been generated and is ready to use!";
        const action = await vscode11.window.showInformationMessage(
          message,
          { modal: false },
          "Open AI Chat Instructions"
        );
        if (action === "Open AI Chat Instructions") {
          const detailedMessage = `How to use the AI Code Review prompt:

1. The prompt has been copied to your clipboard
2. Open your preferred AI chat
3. Paste the prompt (Ctrl+V) into the chat
4. Send the message to get your code review
5. When the AI responds, use "Generate Code Review Result" to process it
(Use "Open Workflow Guide" for detail instructions)`;
          vscode11.window.showInformationMessage(detailedMessage, { modal: true });
        }
      } catch (error) {
        vscode11.window.showErrorMessage(`Failed to show paste instructions: ${error}`);
      }
    })
  ];
  context.subscriptions.push(...commands2);
}
function deactivate() {
  if (inlineAnnotationsProvider) {
    inlineAnnotationsProvider.dispose();
  }
  if (CodeReviewPanel.currentPanel) {
    CodeReviewPanel.currentPanel.dispose();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
