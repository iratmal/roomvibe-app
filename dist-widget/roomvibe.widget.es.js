import Le, { useState as D, useEffect as de } from "react";
var ye = { exports: {} }, G = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ae;
function mr() {
  if (Ae) return G;
  Ae = 1;
  var i = Le, s = Symbol.for("react.element"), y = Symbol.for("react.fragment"), p = Object.prototype.hasOwnProperty, E = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, R = { key: !0, ref: !0, __self: !0, __source: !0 };
  function m(c, g, x) {
    var C, l = {}, N = null, F = null;
    x !== void 0 && (N = "" + x), g.key !== void 0 && (N = "" + g.key), g.ref !== void 0 && (F = g.ref);
    for (C in g) p.call(g, C) && !R.hasOwnProperty(C) && (l[C] = g[C]);
    if (c && c.defaultProps) for (C in g = c.defaultProps, g) l[C] === void 0 && (l[C] = g[C]);
    return { $$typeof: s, type: c, key: N, ref: F, props: l, _owner: E.current };
  }
  return G.Fragment = y, G.jsx = m, G.jsxs = m, G;
}
var H = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var We;
function hr() {
  return We || (We = 1, process.env.NODE_ENV !== "production" && function() {
    var i = Le, s = Symbol.for("react.element"), y = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), E = Symbol.for("react.strict_mode"), R = Symbol.for("react.profiler"), m = Symbol.for("react.provider"), c = Symbol.for("react.context"), g = Symbol.for("react.forward_ref"), x = Symbol.for("react.suspense"), C = Symbol.for("react.suspense_list"), l = Symbol.for("react.memo"), N = Symbol.for("react.lazy"), F = Symbol.for("react.offscreen"), M = Symbol.iterator, v = "@@iterator";
    function W(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = M && e[M] || e[v];
      return typeof t == "function" ? t : null;
    }
    var T = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function j(e) {
      {
        for (var t = arguments.length, a = new Array(t > 1 ? t - 1 : 0), o = 1; o < t; o++)
          a[o - 1] = arguments[o];
        z("error", e, a);
      }
    }
    function z(e, t, a) {
      {
        var o = T.ReactDebugCurrentFrame, h = o.getStackAddendum();
        h !== "" && (t += "%s", a = a.concat([h]));
        var b = a.map(function(f) {
          return String(f);
        });
        b.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, b);
      }
    }
    var X = !1, U = !1, Z = !1, V = !1, Q = !1, ee;
    ee = Symbol.for("react.module.reference");
    function q(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === p || e === R || Q || e === E || e === x || e === C || V || e === F || X || U || Z || typeof e == "object" && e !== null && (e.$$typeof === N || e.$$typeof === l || e.$$typeof === m || e.$$typeof === c || e.$$typeof === g || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === ee || e.getModuleId !== void 0));
    }
    function ue(e, t, a) {
      var o = e.displayName;
      if (o)
        return o;
      var h = t.displayName || t.name || "";
      return h !== "" ? a + "(" + h + ")" : a;
    }
    function re(e) {
      return e.displayName || "Context";
    }
    function O(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && j("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case p:
          return "Fragment";
        case y:
          return "Portal";
        case R:
          return "Profiler";
        case E:
          return "StrictMode";
        case x:
          return "Suspense";
        case C:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case c:
            var t = e;
            return re(t) + ".Consumer";
          case m:
            var a = e;
            return re(a._context) + ".Provider";
          case g:
            return ue(e, e.render, "ForwardRef");
          case l:
            var o = e.displayName || null;
            return o !== null ? o : O(e.type) || "Memo";
          case N: {
            var h = e, b = h._payload, f = h._init;
            try {
              return O(f(b));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var I = Object.assign, A = 0, te, K, ae, ne, n, u, ie;
    function we() {
    }
    we.__reactDisabledLog = !0;
    function Me() {
      {
        if (A === 0) {
          te = console.log, K = console.info, ae = console.warn, ne = console.error, n = console.group, u = console.groupCollapsed, ie = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: we,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        A++;
      }
    }
    function ze() {
      {
        if (A--, A === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: I({}, e, {
              value: te
            }),
            info: I({}, e, {
              value: K
            }),
            warn: I({}, e, {
              value: ae
            }),
            error: I({}, e, {
              value: ne
            }),
            group: I({}, e, {
              value: n
            }),
            groupCollapsed: I({}, e, {
              value: u
            }),
            groupEnd: I({}, e, {
              value: ie
            })
          });
        }
        A < 0 && j("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var fe = T.ReactCurrentDispatcher, me;
    function se(e, t, a) {
      {
        if (me === void 0)
          try {
            throw Error();
          } catch (h) {
            var o = h.stack.trim().match(/\n( *(at )?)/);
            me = o && o[1] || "";
          }
        return `
` + me + e;
      }
    }
    var he = !1, oe;
    {
      var Be = typeof WeakMap == "function" ? WeakMap : Map;
      oe = new Be();
    }
    function je(e, t) {
      if (!e || he)
        return "";
      {
        var a = oe.get(e);
        if (a !== void 0)
          return a;
      }
      var o;
      he = !0;
      var h = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var b;
      b = fe.current, fe.current = null, Me();
      try {
        if (t) {
          var f = function() {
            throw Error();
          };
          if (Object.defineProperty(f.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(f, []);
            } catch (k) {
              o = k;
            }
            Reflect.construct(e, [], f);
          } else {
            try {
              f.call();
            } catch (k) {
              o = k;
            }
            e.call(f.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (k) {
            o = k;
          }
          e();
        }
      } catch (k) {
        if (k && o && typeof k.stack == "string") {
          for (var d = k.stack.split(`
`), S = o.stack.split(`
`), w = d.length - 1, _ = S.length - 1; w >= 1 && _ >= 0 && d[w] !== S[_]; )
            _--;
          for (; w >= 1 && _ >= 0; w--, _--)
            if (d[w] !== S[_]) {
              if (w !== 1 || _ !== 1)
                do
                  if (w--, _--, _ < 0 || d[w] !== S[_]) {
                    var P = `
` + d[w].replace(" at new ", " at ");
                    return e.displayName && P.includes("<anonymous>") && (P = P.replace("<anonymous>", e.displayName)), typeof e == "function" && oe.set(e, P), P;
                  }
                while (w >= 1 && _ >= 0);
              break;
            }
        }
      } finally {
        he = !1, fe.current = b, ze(), Error.prepareStackTrace = h;
      }
      var Y = e ? e.displayName || e.name : "", L = Y ? se(Y) : "";
      return typeof e == "function" && oe.set(e, L), L;
    }
    function Ye(e, t, a) {
      return je(e, !1);
    }
    function Ue(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function le(e, t, a) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return je(e, Ue(e));
      if (typeof e == "string")
        return se(e);
      switch (e) {
        case x:
          return se("Suspense");
        case C:
          return se("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case g:
            return Ye(e.render);
          case l:
            return le(e.type, t, a);
          case N: {
            var o = e, h = o._payload, b = o._init;
            try {
              return le(b(h), t, a);
            } catch {
            }
          }
        }
      return "";
    }
    var J = Object.prototype.hasOwnProperty, _e = {}, Ce = T.ReactDebugCurrentFrame;
    function ce(e) {
      if (e) {
        var t = e._owner, a = le(e.type, e._source, t ? t.type : null);
        Ce.setExtraStackFrame(a);
      } else
        Ce.setExtraStackFrame(null);
    }
    function Ve(e, t, a, o, h) {
      {
        var b = Function.call.bind(J);
        for (var f in e)
          if (b(e, f)) {
            var d = void 0;
            try {
              if (typeof e[f] != "function") {
                var S = Error((o || "React class") + ": " + a + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw S.name = "Invariant Violation", S;
              }
              d = e[f](t, f, o, a, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (w) {
              d = w;
            }
            d && !(d instanceof Error) && (ce(h), j("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", o || "React class", a, f, typeof d), ce(null)), d instanceof Error && !(d.message in _e) && (_e[d.message] = !0, ce(h), j("Failed %s type: %s", a, d.message), ce(null));
          }
      }
    }
    var qe = Array.isArray;
    function pe(e) {
      return qe(e);
    }
    function Ke(e) {
      {
        var t = typeof Symbol == "function" && Symbol.toStringTag, a = t && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return a;
      }
    }
    function Je(e) {
      try {
        return Re(e), !1;
      } catch {
        return !0;
      }
    }
    function Re(e) {
      return "" + e;
    }
    function Ee(e) {
      if (Je(e))
        return j("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Ke(e)), Re(e);
    }
    var Se = T.ReactCurrentOwner, Ge = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Ne, ke;
    function He(e) {
      if (J.call(e, "ref")) {
        var t = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (t && t.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function Xe(e) {
      if (J.call(e, "key")) {
        var t = Object.getOwnPropertyDescriptor(e, "key").get;
        if (t && t.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function Ze(e, t) {
      typeof e.ref == "string" && Se.current;
    }
    function Qe(e, t) {
      {
        var a = function() {
          Ne || (Ne = !0, j("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
        };
        a.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: a,
          configurable: !0
        });
      }
    }
    function er(e, t) {
      {
        var a = function() {
          ke || (ke = !0, j("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
        };
        a.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: a,
          configurable: !0
        });
      }
    }
    var rr = function(e, t, a, o, h, b, f) {
      var d = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: s,
        // Built-in properties that belong on the element
        type: e,
        key: t,
        ref: a,
        props: f,
        // Record the component responsible for creating this element.
        _owner: b
      };
      return d._store = {}, Object.defineProperty(d._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(d, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: o
      }), Object.defineProperty(d, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: h
      }), Object.freeze && (Object.freeze(d.props), Object.freeze(d)), d;
    };
    function tr(e, t, a, o, h) {
      {
        var b, f = {}, d = null, S = null;
        a !== void 0 && (Ee(a), d = "" + a), Xe(t) && (Ee(t.key), d = "" + t.key), He(t) && (S = t.ref, Ze(t, h));
        for (b in t)
          J.call(t, b) && !Ge.hasOwnProperty(b) && (f[b] = t[b]);
        if (e && e.defaultProps) {
          var w = e.defaultProps;
          for (b in w)
            f[b] === void 0 && (f[b] = w[b]);
        }
        if (d || S) {
          var _ = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          d && Qe(f, _), S && er(f, _);
        }
        return rr(e, d, S, h, o, Se.current, f);
      }
    }
    var ge = T.ReactCurrentOwner, Te = T.ReactDebugCurrentFrame;
    function B(e) {
      if (e) {
        var t = e._owner, a = le(e.type, e._source, t ? t.type : null);
        Te.setExtraStackFrame(a);
      } else
        Te.setExtraStackFrame(null);
    }
    var ve;
    ve = !1;
    function be(e) {
      return typeof e == "object" && e !== null && e.$$typeof === s;
    }
    function Pe() {
      {
        if (ge.current) {
          var e = O(ge.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function ar(e) {
      return "";
    }
    var Fe = {};
    function nr(e) {
      {
        var t = Pe();
        if (!t) {
          var a = typeof e == "string" ? e : e.displayName || e.name;
          a && (t = `

Check the top-level render call using <` + a + ">.");
        }
        return t;
      }
    }
    function Oe(e, t) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var a = nr(t);
        if (Fe[a])
          return;
        Fe[a] = !0;
        var o = "";
        e && e._owner && e._owner !== ge.current && (o = " It was passed a child from " + O(e._owner.type) + "."), B(e), j('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', a, o), B(null);
      }
    }
    function De(e, t) {
      {
        if (typeof e != "object")
          return;
        if (pe(e))
          for (var a = 0; a < e.length; a++) {
            var o = e[a];
            be(o) && Oe(o, t);
          }
        else if (be(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var h = W(e);
          if (typeof h == "function" && h !== e.entries)
            for (var b = h.call(e), f; !(f = b.next()).done; )
              be(f.value) && Oe(f.value, t);
        }
      }
    }
    function ir(e) {
      {
        var t = e.type;
        if (t == null || typeof t == "string")
          return;
        var a;
        if (typeof t == "function")
          a = t.propTypes;
        else if (typeof t == "object" && (t.$$typeof === g || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        t.$$typeof === l))
          a = t.propTypes;
        else
          return;
        if (a) {
          var o = O(t);
          Ve(a, e.props, "prop", o, e);
        } else if (t.PropTypes !== void 0 && !ve) {
          ve = !0;
          var h = O(t);
          j("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", h || "Unknown");
        }
        typeof t.getDefaultProps == "function" && !t.getDefaultProps.isReactClassApproved && j("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function sr(e) {
      {
        for (var t = Object.keys(e.props), a = 0; a < t.length; a++) {
          var o = t[a];
          if (o !== "children" && o !== "key") {
            B(e), j("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", o), B(null);
            break;
          }
        }
        e.ref !== null && (B(e), j("Invalid attribute `ref` supplied to `React.Fragment`."), B(null));
      }
    }
    var $e = {};
    function Ie(e, t, a, o, h, b) {
      {
        var f = q(e);
        if (!f) {
          var d = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (d += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var S = ar();
          S ? d += S : d += Pe();
          var w;
          e === null ? w = "null" : pe(e) ? w = "array" : e !== void 0 && e.$$typeof === s ? (w = "<" + (O(e.type) || "Unknown") + " />", d = " Did you accidentally export a JSX literal instead of a component?") : w = typeof e, j("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", w, d);
        }
        var _ = tr(e, t, a, h, b);
        if (_ == null)
          return _;
        if (f) {
          var P = t.children;
          if (P !== void 0)
            if (o)
              if (pe(P)) {
                for (var Y = 0; Y < P.length; Y++)
                  De(P[Y], e);
                Object.freeze && Object.freeze(P);
              } else
                j("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              De(P, e);
        }
        if (J.call(t, "key")) {
          var L = O(e), k = Object.keys(t).filter(function(fr) {
            return fr !== "key";
          }), xe = k.length > 0 ? "{key: someKey, " + k.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!$e[L + xe]) {
            var ur = k.length > 0 ? "{" + k.join(": ..., ") + ": ...}" : "{}";
            j(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, xe, L, ur, L), $e[L + xe] = !0;
          }
        }
        return e === p ? sr(_) : ir(_), _;
      }
    }
    function or(e, t, a) {
      return Ie(e, t, a, !0);
    }
    function lr(e, t, a) {
      return Ie(e, t, a, !1);
    }
    var cr = lr, dr = or;
    H.Fragment = p, H.jsx = cr, H.jsxs = dr;
  }()), H;
}
process.env.NODE_ENV === "production" ? ye.exports = mr() : ye.exports = hr();
var r = ye.exports;
function $(i) {
  const s = {
    ...i,
    ts: Date.now()
  };
  typeof window < "u" && window.onRoomVibeEvent && window.onRoomVibeEvent(s);
}
function pr(i, s, y, p, E) {
  const R = E || i.checkout.template, m = p || i.checkout.type;
  let c = R.replace(/\{\{id\}\}/g, i.id).replace(/\{\{size\}\}/g, s).replace(/\{\{frame\}\}/g, y).replace(/\{\{price\}\}/g, i.price.toString()).replace(/\{\{variant\}\}/g, `${i.id}-${s}-${y}`);
  const g = new URL(c);
  return g.searchParams.set("utm_source", "roomvibe"), g.searchParams.set("utm_medium", "widget"), g.searchParams.set("utm_campaign", m), g.toString();
}
function gr(i) {
  const s = new URLSearchParams();
  return s.set("room", i.room), s.set("art", i.artId), s.set("size", i.size), s.set("frame", i.frame), s.set("wall", i.wallColor), i.width && s.set("width", i.width.toString()), `${window.location.origin + window.location.pathname}?${s.toString()}`;
}
function vr() {
  const i = new URLSearchParams(window.location.search);
  return !i.has("room") || !i.has("art") ? null : {
    room: i.get("room"),
    artId: i.get("art") || "",
    size: i.get("size") || "",
    frame: i.get("frame"),
    wallColor: i.get("wall") || "#FFFFFF",
    width: i.has("width") ? parseInt(i.get("width")) : void 0
  };
}
async function br(i, s, y, p, E) {
  const R = {
    email: i,
    tags: ["roomvibe", `art:${s.id}`, `theme:${y}`],
    fields: {
      artwork_title: s.title,
      artwork_id: s.id,
      theme: y
    }
  };
  return console.log("[MailerLite] Would submit:", R), !0;
}
const xr = ({
  room: i,
  artwork: s,
  size: y,
  frame: p,
  wallColor: E,
  designerWidth: R
}) => {
  const c = (() => {
    if (!s || !y) return { width: 0, height: 0 };
    const [F, M] = y.split("x"), v = parseInt(F), W = parseInt(M);
    return R ? {
      width: R,
      height: Math.round(R / s.ratio)
    } : { width: v, height: W };
  })(), x = Math.min(1, 600 / (c.width || 1)), C = c.width * x, l = c.height * x, N = {
    none: "transparent",
    black: "#000000",
    white: "#FFFFFF",
    oak: "#D4A574"
  };
  return /* @__PURE__ */ r.jsxs(
    "div",
    {
      className: "relative rounded-lg overflow-hidden shadow-lg",
      style: {
        backgroundColor: E,
        minHeight: "400px",
        backgroundImage: `url(/rooms/${i}.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      },
      children: [
        /* @__PURE__ */ r.jsx(
          "div",
          {
            className: "absolute inset-0",
            style: {
              backgroundColor: E,
              opacity: 0.7,
              mixBlendMode: "multiply"
            }
          }
        ),
        s && c.width > 0 && /* @__PURE__ */ r.jsx("div", { className: "relative z-10 flex items-center justify-center min-h-[400px] p-8", children: /* @__PURE__ */ r.jsxs(
          "div",
          {
            className: "relative shadow-2xl",
            style: {
              width: `${C}px`,
              height: `${l}px`
            },
            children: [
              p !== "none" && /* @__PURE__ */ r.jsx(
                "div",
                {
                  className: "absolute inset-0",
                  style: {
                    border: `${x * 10}px solid ${N[p]}`,
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)"
                  }
                }
              ),
              /* @__PURE__ */ r.jsx(
                "img",
                {
                  src: s.image,
                  alt: s.title,
                  className: "w-full h-full object-cover",
                  style: {
                    padding: p !== "none" ? `${x * 10}px` : "0"
                  }
                }
              )
            ]
          }
        ) }),
        R && c.width > 0 && /* @__PURE__ */ r.jsxs("div", { className: "absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow text-sm", children: [
          /* @__PURE__ */ r.jsx("strong", { children: "Dimensions:" }),
          " ",
          c.width,
          " × ",
          c.height,
          " cm"
        ] })
      ]
    }
  );
}, yr = ({
  artworks: i,
  selectedArt: s,
  onSelect: y
}) => /* @__PURE__ */ r.jsxs("div", { children: [
  /* @__PURE__ */ r.jsx("h2", { className: "text-2xl font-bold mb-6", children: "Browse Artworks" }),
  /* @__PURE__ */ r.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", children: i.map((p) => /* @__PURE__ */ r.jsxs(
    "button",
    {
      onClick: () => y(p),
      className: `group relative overflow-hidden rounded-lg transition-all ${(s == null ? void 0 : s.id) === p.id ? "ring-4 ring-primary shadow-lg" : "hover:shadow-md"}`,
      children: [
        /* @__PURE__ */ r.jsx("div", { className: "aspect-square bg-gray-200", children: /* @__PURE__ */ r.jsx(
          "img",
          {
            src: p.image,
            alt: p.title,
            className: "w-full h-full object-cover"
          }
        ) }),
        /* @__PURE__ */ r.jsxs("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3", children: [
          /* @__PURE__ */ r.jsx("p", { className: "text-white text-sm font-semibold truncate", children: p.title }),
          /* @__PURE__ */ r.jsxs("p", { className: "text-white/80 text-xs", children: [
            "€",
            p.price
          ] })
        ] }),
        (s == null ? void 0 : s.id) === p.id && /* @__PURE__ */ r.jsx("div", { className: "absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ r.jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ r.jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) })
      ]
    },
    p.id
  )) })
] }), wr = [
  { name: "White", color: "#FFFFFF" },
  { name: "Cream", color: "#F5F5DC" },
  { name: "Light Gray", color: "#D3D3D3" },
  { name: "Sage", color: "#9DC183" },
  { name: "Sky Blue", color: "#87CEEB" },
  { name: "Blush", color: "#FFB6C1" },
  { name: "Charcoal", color: "#36454F" }
], jr = ({
  artwork: i,
  selectedSize: s,
  selectedFrame: y,
  wallColor: p,
  designerMode: E,
  designerWidth: R,
  onSizeChange: m,
  onFrameChange: c,
  onWallColorChange: g,
  onDesignerWidthChange: x,
  onDesignerModeToggle: C
}) => /* @__PURE__ */ r.jsxs("div", { className: "space-y-6", children: [
  /* @__PURE__ */ r.jsxs("div", { className: "bg-surface rounded-lg p-4", children: [
    /* @__PURE__ */ r.jsx("h3", { className: "font-semibold mb-3", children: "Artwork Details" }),
    i ? /* @__PURE__ */ r.jsxs("div", { className: "space-y-2 text-sm", children: [
      /* @__PURE__ */ r.jsxs("p", { children: [
        /* @__PURE__ */ r.jsx("strong", { children: "Title:" }),
        " ",
        i.title
      ] }),
      /* @__PURE__ */ r.jsxs("p", { children: [
        /* @__PURE__ */ r.jsx("strong", { children: "Price:" }),
        " €",
        i.price
      ] }),
      /* @__PURE__ */ r.jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: i.tags.map((l) => /* @__PURE__ */ r.jsx("span", { className: "px-2 py-1 bg-gray-200 rounded text-xs", children: l }, l)) })
    ] }) : /* @__PURE__ */ r.jsx("p", { className: "text-sm text-gray-500", children: "Select an artwork" })
  ] }),
  /* @__PURE__ */ r.jsxs("div", { children: [
    /* @__PURE__ */ r.jsx("label", { className: "block text-sm font-semibold mb-2", children: "Size (cm)" }),
    /* @__PURE__ */ r.jsx("div", { className: "grid grid-cols-2 gap-2", children: i == null ? void 0 : i.sizes.map((l) => /* @__PURE__ */ r.jsx(
      "button",
      {
        onClick: () => m(l),
        className: `py-2 px-3 rounded text-sm ${s === l ? "bg-primary text-white" : "bg-surface border border-gray-300"}`,
        children: l
      },
      l
    )) })
  ] }),
  /* @__PURE__ */ r.jsxs("div", { children: [
    /* @__PURE__ */ r.jsx("label", { className: "block text-sm font-semibold mb-2", children: "Frame" }),
    /* @__PURE__ */ r.jsx("div", { className: "grid grid-cols-2 gap-2", children: i == null ? void 0 : i.frameOptions.map((l) => /* @__PURE__ */ r.jsx(
      "button",
      {
        onClick: () => c(l),
        className: `py-2 px-3 rounded text-sm capitalize ${y === l ? "bg-primary text-white" : "bg-surface border border-gray-300"}`,
        children: l
      },
      l
    )) })
  ] }),
  /* @__PURE__ */ r.jsxs("div", { children: [
    /* @__PURE__ */ r.jsx("label", { className: "block text-sm font-semibold mb-2", children: "Wall Color" }),
    /* @__PURE__ */ r.jsx("div", { className: "grid grid-cols-4 gap-2 mb-2", children: wr.map((l) => /* @__PURE__ */ r.jsx(
      "button",
      {
        onClick: () => g(l.color),
        className: `aspect-square rounded border-2 ${p === l.color ? "border-primary" : "border-gray-300"}`,
        style: { backgroundColor: l.color },
        title: l.name
      },
      l.color
    )) }),
    /* @__PURE__ */ r.jsx(
      "input",
      {
        type: "color",
        value: p,
        onChange: (l) => g(l.target.value),
        className: "w-full h-10 rounded cursor-pointer"
      }
    )
  ] }),
  /* @__PURE__ */ r.jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ r.jsxs("label", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ r.jsx("span", { className: "text-sm font-semibold", children: "Designer Mode" }),
      /* @__PURE__ */ r.jsx(
        "button",
        {
          onClick: C,
          className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${E ? "bg-primary" : "bg-gray-300"}`,
          children: /* @__PURE__ */ r.jsx(
            "span",
            {
              className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${E ? "translate-x-6" : "translate-x-1"}`
            }
          )
        }
      )
    ] }),
    E && /* @__PURE__ */ r.jsxs("div", { children: [
      /* @__PURE__ */ r.jsx("label", { className: "block text-sm mb-2", children: "Custom Width (cm)" }),
      /* @__PURE__ */ r.jsx(
        "input",
        {
          type: "number",
          min: "10",
          max: "300",
          value: R || "",
          onChange: (l) => {
            const N = l.target.value ? parseInt(l.target.value) : void 0;
            x(N);
          },
          placeholder: "e.g. 100",
          className: "w-full px-3 py-2 border border-gray-300 rounded"
        }
      )
    ] })
  ] })
] }), _r = () => {
  const i = [
    {
      name: "Free",
      price: "€0",
      period: "forever",
      features: [
        "3 room presets",
        "Basic artwork selection",
        "Share links",
        "Standard support"
      ],
      cta: "Current Plan",
      highlighted: !1
    },
    {
      name: "Designer Pro",
      price: "€29",
      period: "month",
      features: [
        "Everything in Free",
        "Custom room upload",
        "Scale calibration",
        "Client PDF exports",
        "Priority support",
        "No watermarks"
      ],
      cta: "Upgrade to Pro",
      highlighted: !0
    },
    {
      name: "Studio",
      price: "€99",
      period: "month",
      features: [
        "Everything in Pro",
        "White label widget",
        "Custom branding",
        "Analytics dashboard",
        "Affiliate program",
        "API access"
      ],
      cta: "Contact Sales",
      highlighted: !1
    }
  ];
  return /* @__PURE__ */ r.jsxs("div", { className: "py-12", children: [
    /* @__PURE__ */ r.jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ r.jsx("h2", { className: "text-3xl font-bold mb-3", children: "Simple, Transparent Pricing" }),
      /* @__PURE__ */ r.jsx("p", { className: "text-gray-600", children: "Choose the plan that fits your needs" })
    ] }),
    /* @__PURE__ */ r.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto", children: i.map((s) => /* @__PURE__ */ r.jsxs(
      "div",
      {
        className: `rounded-xl p-8 ${s.highlighted ? "bg-primary text-white shadow-2xl scale-105 border-4 border-primary" : "bg-surface border-2 border-gray-200"}`,
        children: [
          /* @__PURE__ */ r.jsx("h3", { className: "text-2xl font-bold mb-2", children: s.name }),
          /* @__PURE__ */ r.jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ r.jsx("span", { className: "text-4xl font-bold", children: s.price }),
            /* @__PURE__ */ r.jsxs("span", { className: `text-sm ${s.highlighted ? "text-white/80" : "text-gray-500"}`, children: [
              "/",
              s.period
            ] })
          ] }),
          /* @__PURE__ */ r.jsx("ul", { className: "space-y-3 mb-8", children: s.features.map((y, p) => /* @__PURE__ */ r.jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ r.jsx(
              "svg",
              {
                className: `w-5 h-5 mt-0.5 flex-shrink-0 ${s.highlighted ? "text-white" : "text-success"}`,
                fill: "currentColor",
                viewBox: "0 0 20 20",
                children: /* @__PURE__ */ r.jsx(
                  "path",
                  {
                    fillRule: "evenodd",
                    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                    clipRule: "evenodd"
                  }
                )
              }
            ),
            /* @__PURE__ */ r.jsx("span", { className: "text-sm", children: y })
          ] }, p)) }),
          /* @__PURE__ */ r.jsx(
            "button",
            {
              className: `w-full py-3 px-6 rounded-lg font-semibold transition-all ${s.highlighted ? "bg-white text-primary hover:bg-gray-100" : "bg-primary text-white hover:opacity-90"}`,
              children: s.cta
            }
          )
        ]
      },
      s.name
    )) })
  ] });
}, Rr = ({
  mode: i = "showcase",
  collection: s = "all",
  theme: y = "azure",
  oneClickBuy: p = !1,
  checkoutType: E,
  checkoutLinkTemplate: R,
  onEvent: m
}) => {
  const [c, g] = D(y), [x, C] = D(i), [l, N] = D("living"), [F, M] = D([]), [v, W] = D(null), [T, j] = D(""), [z, X] = D("none"), [U, Z] = D("#FFFFFF"), [V, Q] = D(), [ee, q] = D(!1);
  de(() => {
    fetch("/artworks.json").then((n) => n.json()).then((n) => {
      M(n), n.length > 0 && (W(n[0]), j(n[0].sizes[0]));
    }).catch((n) => console.error("Failed to load artworks:", n));
  }, []), de(() => {
    const n = vr();
    if (n && (n.room && N(n.room), n.wallColor && Z(n.wallColor), n.width && Q(n.width), n.artId)) {
      const u = F.find((ie) => ie.id === n.artId);
      u && (W(u), n.size && j(n.size), n.frame && X(n.frame));
    }
  }, [F]), de(() => {
    const n = { type: "rv_view", theme: c, mode: x };
    $(n), m && m({ ...n, ts: Date.now() });
  }, [c, x, m]), de(() => {
    document.documentElement.setAttribute("data-theme", c);
  }, [c]);
  const ue = (n) => {
    W(n), j(n.sizes[0]);
    const u = { type: "rv_art_select", artId: n.id, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() });
  }, re = (n) => {
    j(n);
    const u = { type: "rv_size_change", artId: v == null ? void 0 : v.id, size: n, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() });
  }, O = (n) => {
    X(n);
    const u = { type: "rv_frame_change", artId: v == null ? void 0 : v.id, frame: n, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() });
  }, I = (n) => {
    Z(n);
    const u = { type: "rv_wall_color_change", wallColor: n, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() });
  }, A = (n) => {
    N(n);
    const u = { type: "rv_room_change", room: n, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() });
  }, te = () => {
    if (!v) return;
    const n = pr(v, T, z, E, R), u = { type: "rv_buy_click", artId: v.id, size: T, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() }), window.open(n, "_blank");
  }, K = async (n) => {
    if (!v) return;
    await br(n, v, c);
    const u = { type: "rv_email_submit", artId: v.id, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() }), q(!1);
  }, ae = () => {
    if (!v) return;
    const n = gr({
      room: l,
      artId: v.id,
      size: T,
      frame: z,
      wallColor: U,
      width: V
    });
    navigator.clipboard.writeText(n);
    const u = { type: "rv_share_copy", artId: v.id, theme: c, mode: x };
    $(u), m && m({ ...u, ts: Date.now() }), alert("Link copied to clipboard!");
  }, ne = () => {
    const n = x === "showcase" ? "designer" : "showcase";
    C(n);
    const u = { type: "rv_designer_mode_toggle", mode: n, theme: c };
    $(u), m && m({ ...u, ts: Date.now() });
  };
  return /* @__PURE__ */ r.jsxs("div", { className: "min-h-screen bg-bg text-text", children: [
    /* @__PURE__ */ r.jsx("header", { className: "bg-surface border-b border-gray-200 py-4", children: /* @__PURE__ */ r.jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ r.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ r.jsx("h1", { className: "text-2xl font-bold", style: { color: "var(--primary)" }, children: "🎨 RoomVibe" }),
      /* @__PURE__ */ r.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ r.jsx(
          "button",
          {
            onClick: () => g("azure"),
            className: `px-3 py-1 rounded ${c === "azure" ? "bg-primary text-white" : "bg-gray-200"}`,
            children: "Azure"
          }
        ),
        /* @__PURE__ */ r.jsx(
          "button",
          {
            onClick: () => g("royal"),
            className: `px-3 py-1 rounded ${c === "royal" ? "bg-primary text-white" : "bg-gray-200"}`,
            children: "Royal"
          }
        ),
        /* @__PURE__ */ r.jsx(
          "button",
          {
            onClick: () => g("sunset"),
            className: `px-3 py-1 rounded ${c === "sunset" ? "bg-primary text-white" : "bg-gray-200"}`,
            children: "Sunset"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ r.jsxs("main", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ r.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ r.jsxs("div", { className: "lg:col-span-2", children: [
          /* @__PURE__ */ r.jsx(
            xr,
            {
              room: l,
              artwork: v,
              size: T,
              frame: z,
              wallColor: U,
              designerWidth: V
            }
          ),
          /* @__PURE__ */ r.jsxs("div", { className: "mt-4 flex gap-2", children: [
            /* @__PURE__ */ r.jsx(
              "button",
              {
                onClick: () => A("living"),
                className: `flex-1 py-2 px-4 rounded ${l === "living" ? "bg-primary text-white" : "bg-surface"}`,
                children: "Living Room"
              }
            ),
            /* @__PURE__ */ r.jsx(
              "button",
              {
                onClick: () => A("hallway"),
                className: `flex-1 py-2 px-4 rounded ${l === "hallway" ? "bg-primary text-white" : "bg-surface"}`,
                children: "Hallway"
              }
            ),
            /* @__PURE__ */ r.jsx(
              "button",
              {
                onClick: () => A("bedroom"),
                className: `flex-1 py-2 px-4 rounded ${l === "bedroom" ? "bg-primary text-white" : "bg-surface"}`,
                children: "Bedroom"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ r.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ r.jsx(
            jr,
            {
              artwork: v,
              selectedSize: T,
              selectedFrame: z,
              wallColor: U,
              designerMode: x === "designer",
              designerWidth: V,
              onSizeChange: re,
              onFrameChange: O,
              onWallColorChange: I,
              onDesignerWidthChange: Q,
              onDesignerModeToggle: ne
            }
          ),
          /* @__PURE__ */ r.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ r.jsxs(
              "button",
              {
                onClick: te,
                disabled: !v,
                className: "w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50",
                children: [
                  "Buy Now - €",
                  (v == null ? void 0 : v.price) || 0
                ]
              }
            ),
            /* @__PURE__ */ r.jsx(
              "button",
              {
                onClick: () => q(!0),
                disabled: !v,
                className: "w-full bg-surface text-text py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50",
                children: "Email me this"
              }
            ),
            /* @__PURE__ */ r.jsx(
              "button",
              {
                onClick: ae,
                disabled: !v,
                className: "w-full bg-surface text-text py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50",
                children: "Copy share link"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ r.jsx("div", { className: "mt-12", children: /* @__PURE__ */ r.jsx(
        yr,
        {
          artworks: F,
          selectedArt: v,
          onSelect: ue
        }
      ) }),
      /* @__PURE__ */ r.jsx("div", { className: "mt-16", children: /* @__PURE__ */ r.jsx(_r, {}) })
    ] }),
    ee && /* @__PURE__ */ r.jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ r.jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [
      /* @__PURE__ */ r.jsx("h3", { className: "text-xl font-bold mb-4", children: "Get this look via email" }),
      /* @__PURE__ */ r.jsx(
        "input",
        {
          type: "email",
          placeholder: "your@email.com",
          className: "w-full px-4 py-2 border border-gray-300 rounded mb-4",
          onKeyDown: (n) => {
            n.key === "Enter" && K(n.target.value);
          }
        }
      ),
      /* @__PURE__ */ r.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ r.jsx(
          "button",
          {
            onClick: (n) => {
              const u = n.currentTarget.previousElementSibling;
              K(u.value);
            },
            className: "flex-1 bg-primary text-white py-2 px-4 rounded hover:opacity-90",
            children: "Send"
          }
        ),
        /* @__PURE__ */ r.jsx(
          "button",
          {
            onClick: () => q(!1),
            className: "flex-1 bg-gray-200 py-2 px-4 rounded hover:bg-gray-300",
            children: "Cancel"
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  Rr as RoomVibe
};
//# sourceMappingURL=roomvibe.widget.es.js.map
