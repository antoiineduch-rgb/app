(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
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

  // node_modules/polygon-clipping/dist/polygon-clipping.umd.js
  var require_polygon_clipping_umd = __commonJS({
    "node_modules/polygon-clipping/dist/polygon-clipping.umd.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.polygonClipping = factory());
      })(exports, (function() {
        "use strict";
        function __generator(thisArg, body) {
          var _ = {
            label: 0,
            sent: function() {
              if (t[0] & 1) throw t[1];
              return t[1];
            },
            trys: [],
            ops: []
          }, f, y, t, g;
          return g = {
            next: verb(0),
            "throw": verb(1),
            "return": verb(2)
          }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
          }), g;
          function verb(n) {
            return function(v) {
              return step([n, v]);
            };
          }
          function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                case 0:
                case 1:
                  t = op;
                  break;
                case 4:
                  _.label++;
                  return {
                    value: op[1],
                    done: false
                  };
                case 5:
                  _.label++;
                  y = op[1];
                  op = [0];
                  continue;
                case 7:
                  op = _.ops.pop();
                  _.trys.pop();
                  continue;
                default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                    _ = 0;
                    continue;
                  }
                  if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                    _.label = op[1];
                    break;
                  }
                  if (op[0] === 6 && _.label < t[1]) {
                    _.label = t[1];
                    t = op;
                    break;
                  }
                  if (t && _.label < t[2]) {
                    _.label = t[2];
                    _.ops.push(op);
                    break;
                  }
                  if (t[2]) _.ops.pop();
                  _.trys.pop();
                  continue;
              }
              op = body.call(thisArg, _);
            } catch (e) {
              op = [6, e];
              y = 0;
            } finally {
              f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
              value: op[0] ? op[1] : void 0,
              done: true
            };
          }
        }
        var Node2 = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Node3(key, data) {
              this.next = null;
              this.key = key;
              this.data = data;
              this.left = null;
              this.right = null;
            }
            return Node3;
          })()
        );
        function DEFAULT_COMPARE(a, b) {
          return a > b ? 1 : a < b ? -1 : 0;
        }
        function splay(i2, t, comparator) {
          var N = new Node2(null, null);
          var l = N;
          var r = N;
          while (true) {
            var cmp2 = comparator(i2, t.key);
            if (cmp2 < 0) {
              if (t.left === null) break;
              if (comparator(i2, t.left.key) < 0) {
                var y = t.left;
                t.left = y.right;
                y.right = t;
                t = y;
                if (t.left === null) break;
              }
              r.left = t;
              r = t;
              t = t.left;
            } else if (cmp2 > 0) {
              if (t.right === null) break;
              if (comparator(i2, t.right.key) > 0) {
                var y = t.right;
                t.right = y.left;
                y.left = t;
                t = y;
                if (t.right === null) break;
              }
              l.right = t;
              l = t;
              t = t.right;
            } else break;
          }
          l.right = t.left;
          r.left = t.right;
          t.left = N.right;
          t.right = N.left;
          return t;
        }
        function insert(i2, data, t, comparator) {
          var node = new Node2(i2, data);
          if (t === null) {
            node.left = node.right = null;
            return node;
          }
          t = splay(i2, t, comparator);
          var cmp2 = comparator(i2, t.key);
          if (cmp2 < 0) {
            node.left = t.left;
            node.right = t;
            t.left = null;
          } else if (cmp2 >= 0) {
            node.right = t.right;
            node.left = t;
            t.right = null;
          }
          return node;
        }
        function split(key, v, comparator) {
          var left = null;
          var right = null;
          if (v) {
            v = splay(key, v, comparator);
            var cmp2 = comparator(v.key, key);
            if (cmp2 === 0) {
              left = v.left;
              right = v.right;
            } else if (cmp2 < 0) {
              right = v.right;
              v.right = null;
              left = v;
            } else {
              left = v.left;
              v.left = null;
              right = v;
            }
          }
          return {
            left,
            right
          };
        }
        function merge(left, right, comparator) {
          if (right === null) return left;
          if (left === null) return right;
          right = splay(left.key, right, comparator);
          right.left = left;
          return right;
        }
        function printRow(root, prefix, isTail, out, printNode) {
          if (root) {
            out("" + prefix + (isTail ? "└── " : "├── ") + printNode(root) + "\n");
            var indent = prefix + (isTail ? "    " : "│   ");
            if (root.left) printRow(root.left, indent, false, out, printNode);
            if (root.right) printRow(root.right, indent, true, out, printNode);
          }
        }
        var Tree = (
          /** @class */
          (function() {
            function Tree2(comparator) {
              if (comparator === void 0) {
                comparator = DEFAULT_COMPARE;
              }
              this._root = null;
              this._size = 0;
              this._comparator = comparator;
            }
            Tree2.prototype.insert = function(key, data) {
              this._size++;
              return this._root = insert(key, data, this._root, this._comparator);
            };
            Tree2.prototype.add = function(key, data) {
              var node = new Node2(key, data);
              if (this._root === null) {
                node.left = node.right = null;
                this._size++;
                this._root = node;
              }
              var comparator = this._comparator;
              var t = splay(key, this._root, comparator);
              var cmp2 = comparator(key, t.key);
              if (cmp2 === 0) this._root = t;
              else {
                if (cmp2 < 0) {
                  node.left = t.left;
                  node.right = t;
                  t.left = null;
                } else if (cmp2 > 0) {
                  node.right = t.right;
                  node.left = t;
                  t.right = null;
                }
                this._size++;
                this._root = node;
              }
              return this._root;
            };
            Tree2.prototype.remove = function(key) {
              this._root = this._remove(key, this._root, this._comparator);
            };
            Tree2.prototype._remove = function(i2, t, comparator) {
              var x2;
              if (t === null) return null;
              t = splay(i2, t, comparator);
              var cmp2 = comparator(i2, t.key);
              if (cmp2 === 0) {
                if (t.left === null) {
                  x2 = t.right;
                } else {
                  x2 = splay(i2, t.left, comparator);
                  x2.right = t.right;
                }
                this._size--;
                return x2;
              }
              return t;
            };
            Tree2.prototype.pop = function() {
              var node = this._root;
              if (node) {
                while (node.left) node = node.left;
                this._root = splay(node.key, this._root, this._comparator);
                this._root = this._remove(node.key, this._root, this._comparator);
                return {
                  key: node.key,
                  data: node.data
                };
              }
              return null;
            };
            Tree2.prototype.findStatic = function(key) {
              var current = this._root;
              var compare = this._comparator;
              while (current) {
                var cmp2 = compare(key, current.key);
                if (cmp2 === 0) return current;
                else if (cmp2 < 0) current = current.left;
                else current = current.right;
              }
              return null;
            };
            Tree2.prototype.find = function(key) {
              if (this._root) {
                this._root = splay(key, this._root, this._comparator);
                if (this._comparator(key, this._root.key) !== 0) return null;
              }
              return this._root;
            };
            Tree2.prototype.contains = function(key) {
              var current = this._root;
              var compare = this._comparator;
              while (current) {
                var cmp2 = compare(key, current.key);
                if (cmp2 === 0) return true;
                else if (cmp2 < 0) current = current.left;
                else current = current.right;
              }
              return false;
            };
            Tree2.prototype.forEach = function(visitor, ctx) {
              var current = this._root;
              var Q = [];
              var done = false;
              while (!done) {
                if (current !== null) {
                  Q.push(current);
                  current = current.left;
                } else {
                  if (Q.length !== 0) {
                    current = Q.pop();
                    visitor.call(ctx, current);
                    current = current.right;
                  } else done = true;
                }
              }
              return this;
            };
            Tree2.prototype.range = function(low, high, fn, ctx) {
              var Q = [];
              var compare = this._comparator;
              var node = this._root;
              var cmp2;
              while (Q.length !== 0 || node) {
                if (node) {
                  Q.push(node);
                  node = node.left;
                } else {
                  node = Q.pop();
                  cmp2 = compare(node.key, high);
                  if (cmp2 > 0) {
                    break;
                  } else if (compare(node.key, low) >= 0) {
                    if (fn.call(ctx, node)) return this;
                  }
                  node = node.right;
                }
              }
              return this;
            };
            Tree2.prototype.keys = function() {
              var keys = [];
              this.forEach(function(_a2) {
                var key = _a2.key;
                return keys.push(key);
              });
              return keys;
            };
            Tree2.prototype.values = function() {
              var values = [];
              this.forEach(function(_a2) {
                var data = _a2.data;
                return values.push(data);
              });
              return values;
            };
            Tree2.prototype.min = function() {
              if (this._root) return this.minNode(this._root).key;
              return null;
            };
            Tree2.prototype.max = function() {
              if (this._root) return this.maxNode(this._root).key;
              return null;
            };
            Tree2.prototype.minNode = function(t) {
              if (t === void 0) {
                t = this._root;
              }
              if (t) while (t.left) t = t.left;
              return t;
            };
            Tree2.prototype.maxNode = function(t) {
              if (t === void 0) {
                t = this._root;
              }
              if (t) while (t.right) t = t.right;
              return t;
            };
            Tree2.prototype.at = function(index2) {
              var current = this._root;
              var done = false;
              var i2 = 0;
              var Q = [];
              while (!done) {
                if (current) {
                  Q.push(current);
                  current = current.left;
                } else {
                  if (Q.length > 0) {
                    current = Q.pop();
                    if (i2 === index2) return current;
                    i2++;
                    current = current.right;
                  } else done = true;
                }
              }
              return null;
            };
            Tree2.prototype.next = function(d) {
              var root = this._root;
              var successor = null;
              if (d.right) {
                successor = d.right;
                while (successor.left) successor = successor.left;
                return successor;
              }
              var comparator = this._comparator;
              while (root) {
                var cmp2 = comparator(d.key, root.key);
                if (cmp2 === 0) break;
                else if (cmp2 < 0) {
                  successor = root;
                  root = root.left;
                } else root = root.right;
              }
              return successor;
            };
            Tree2.prototype.prev = function(d) {
              var root = this._root;
              var predecessor = null;
              if (d.left !== null) {
                predecessor = d.left;
                while (predecessor.right) predecessor = predecessor.right;
                return predecessor;
              }
              var comparator = this._comparator;
              while (root) {
                var cmp2 = comparator(d.key, root.key);
                if (cmp2 === 0) break;
                else if (cmp2 < 0) root = root.left;
                else {
                  predecessor = root;
                  root = root.right;
                }
              }
              return predecessor;
            };
            Tree2.prototype.clear = function() {
              this._root = null;
              this._size = 0;
              return this;
            };
            Tree2.prototype.toList = function() {
              return toList(this._root);
            };
            Tree2.prototype.load = function(keys, values, presort) {
              if (values === void 0) {
                values = [];
              }
              if (presort === void 0) {
                presort = false;
              }
              var size = keys.length;
              var comparator = this._comparator;
              if (presort) sort(keys, values, 0, size - 1, comparator);
              if (this._root === null) {
                this._root = loadRecursive(keys, values, 0, size);
                this._size = size;
              } else {
                var mergedList = mergeLists(this.toList(), createList(keys, values), comparator);
                size = this._size + size;
                this._root = sortedListToBST({
                  head: mergedList
                }, 0, size);
              }
              return this;
            };
            Tree2.prototype.isEmpty = function() {
              return this._root === null;
            };
            Object.defineProperty(Tree2.prototype, "size", {
              get: function() {
                return this._size;
              },
              enumerable: true,
              configurable: true
            });
            Object.defineProperty(Tree2.prototype, "root", {
              get: function() {
                return this._root;
              },
              enumerable: true,
              configurable: true
            });
            Tree2.prototype.toString = function(printNode) {
              if (printNode === void 0) {
                printNode = function(n) {
                  return String(n.key);
                };
              }
              var out = [];
              printRow(this._root, "", true, function(v) {
                return out.push(v);
              }, printNode);
              return out.join("");
            };
            Tree2.prototype.update = function(key, newKey, newData) {
              var comparator = this._comparator;
              var _a2 = split(key, this._root, comparator), left = _a2.left, right = _a2.right;
              if (comparator(key, newKey) < 0) {
                right = insert(newKey, newData, right, comparator);
              } else {
                left = insert(newKey, newData, left, comparator);
              }
              this._root = merge(left, right, comparator);
            };
            Tree2.prototype.split = function(key) {
              return split(key, this._root, this._comparator);
            };
            Tree2.prototype[Symbol.iterator] = function() {
              var current, Q, done;
              return __generator(this, function(_a2) {
                switch (_a2.label) {
                  case 0:
                    current = this._root;
                    Q = [];
                    done = false;
                    _a2.label = 1;
                  case 1:
                    if (!!done) return [3, 6];
                    if (!(current !== null)) return [3, 2];
                    Q.push(current);
                    current = current.left;
                    return [3, 5];
                  case 2:
                    if (!(Q.length !== 0)) return [3, 4];
                    current = Q.pop();
                    return [4, current];
                  case 3:
                    _a2.sent();
                    current = current.right;
                    return [3, 5];
                  case 4:
                    done = true;
                    _a2.label = 5;
                  case 5:
                    return [3, 1];
                  case 6:
                    return [
                      2
                      /*return*/
                    ];
                }
              });
            };
            return Tree2;
          })()
        );
        function loadRecursive(keys, values, start, end) {
          var size = end - start;
          if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var key = keys[middle];
            var data = values[middle];
            var node = new Node2(key, data);
            node.left = loadRecursive(keys, values, start, middle);
            node.right = loadRecursive(keys, values, middle + 1, end);
            return node;
          }
          return null;
        }
        function createList(keys, values) {
          var head = new Node2(null, null);
          var p = head;
          for (var i2 = 0; i2 < keys.length; i2++) {
            p = p.next = new Node2(keys[i2], values[i2]);
          }
          p.next = null;
          return head.next;
        }
        function toList(root) {
          var current = root;
          var Q = [];
          var done = false;
          var head = new Node2(null, null);
          var p = head;
          while (!done) {
            if (current) {
              Q.push(current);
              current = current.left;
            } else {
              if (Q.length > 0) {
                current = p = p.next = Q.pop();
                current = current.right;
              } else done = true;
            }
          }
          p.next = null;
          return head.next;
        }
        function sortedListToBST(list, start, end) {
          var size = end - start;
          if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var left = sortedListToBST(list, start, middle);
            var root = list.head;
            root.left = left;
            list.head = list.head.next;
            root.right = sortedListToBST(list, middle + 1, end);
            return root;
          }
          return null;
        }
        function mergeLists(l1, l2, compare) {
          var head = new Node2(null, null);
          var p = head;
          var p1 = l1;
          var p2 = l2;
          while (p1 !== null && p2 !== null) {
            if (compare(p1.key, p2.key) < 0) {
              p.next = p1;
              p1 = p1.next;
            } else {
              p.next = p2;
              p2 = p2.next;
            }
            p = p.next;
          }
          if (p1 !== null) {
            p.next = p1;
          } else if (p2 !== null) {
            p.next = p2;
          }
          return head.next;
        }
        function sort(keys, values, left, right, compare) {
          if (left >= right) return;
          var pivot = keys[left + right >> 1];
          var i2 = left - 1;
          var j = right + 1;
          while (true) {
            do
              i2++;
            while (compare(keys[i2], pivot) < 0);
            do
              j--;
            while (compare(keys[j], pivot) > 0);
            if (i2 >= j) break;
            var tmp = keys[i2];
            keys[i2] = keys[j];
            keys[j] = tmp;
            tmp = values[i2];
            values[i2] = values[j];
            values[j] = tmp;
          }
          sort(keys, values, left, j, compare);
          sort(keys, values, j + 1, right, compare);
        }
        const isInBbox = (bbox, point) => {
          return bbox.ll.x <= point.x && point.x <= bbox.ur.x && bbox.ll.y <= point.y && point.y <= bbox.ur.y;
        };
        const getBboxOverlap = (b1, b2) => {
          if (b2.ur.x < b1.ll.x || b1.ur.x < b2.ll.x || b2.ur.y < b1.ll.y || b1.ur.y < b2.ll.y) return null;
          const lowerX = b1.ll.x < b2.ll.x ? b2.ll.x : b1.ll.x;
          const upperX = b1.ur.x < b2.ur.x ? b1.ur.x : b2.ur.x;
          const lowerY = b1.ll.y < b2.ll.y ? b2.ll.y : b1.ll.y;
          const upperY = b1.ur.y < b2.ur.y ? b1.ur.y : b2.ur.y;
          return {
            ll: {
              x: lowerX,
              y: lowerY
            },
            ur: {
              x: upperX,
              y: upperY
            }
          };
        };
        let epsilon$1 = Number.EPSILON;
        if (epsilon$1 === void 0) epsilon$1 = Math.pow(2, -52);
        const EPSILON_SQ = epsilon$1 * epsilon$1;
        const cmp = (a, b) => {
          if (-epsilon$1 < a && a < epsilon$1) {
            if (-epsilon$1 < b && b < epsilon$1) {
              return 0;
            }
          }
          const ab = a - b;
          if (ab * ab < EPSILON_SQ * a * b) {
            return 0;
          }
          return a < b ? -1 : 1;
        };
        class PtRounder {
          constructor() {
            this.reset();
          }
          reset() {
            this.xRounder = new CoordRounder();
            this.yRounder = new CoordRounder();
          }
          round(x2, y) {
            return {
              x: this.xRounder.round(x2),
              y: this.yRounder.round(y)
            };
          }
        }
        class CoordRounder {
          constructor() {
            this.tree = new Tree();
            this.round(0);
          }
          // Note: this can rounds input values backwards or forwards.
          //       You might ask, why not restrict this to just rounding
          //       forwards? Wouldn't that allow left endpoints to always
          //       remain left endpoints during splitting (never change to
          //       right). No - it wouldn't, because we snap intersections
          //       to endpoints (to establish independence from the segment
          //       angle for t-intersections).
          round(coord) {
            const node = this.tree.add(coord);
            const prevNode = this.tree.prev(node);
            if (prevNode !== null && cmp(node.key, prevNode.key) === 0) {
              this.tree.remove(coord);
              return prevNode.key;
            }
            const nextNode = this.tree.next(node);
            if (nextNode !== null && cmp(node.key, nextNode.key) === 0) {
              this.tree.remove(coord);
              return nextNode.key;
            }
            return coord;
          }
        }
        const rounder = new PtRounder();
        const epsilon = 11102230246251565e-32;
        const splitter = 134217729;
        const resulterrbound = (3 + 8 * epsilon) * epsilon;
        function sum(elen, e, flen, f, h) {
          let Q, Qnew, hh, bvirt;
          let enow = e[0];
          let fnow = f[0];
          let eindex = 0;
          let findex = 0;
          if (fnow > enow === fnow > -enow) {
            Q = enow;
            enow = e[++eindex];
          } else {
            Q = fnow;
            fnow = f[++findex];
          }
          let hindex = 0;
          if (eindex < elen && findex < flen) {
            if (fnow > enow === fnow > -enow) {
              Qnew = enow + Q;
              hh = Q - (Qnew - enow);
              enow = e[++eindex];
            } else {
              Qnew = fnow + Q;
              hh = Q - (Qnew - fnow);
              fnow = f[++findex];
            }
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
            while (eindex < elen && findex < flen) {
              if (fnow > enow === fnow > -enow) {
                Qnew = Q + enow;
                bvirt = Qnew - Q;
                hh = Q - (Qnew - bvirt) + (enow - bvirt);
                enow = e[++eindex];
              } else {
                Qnew = Q + fnow;
                bvirt = Qnew - Q;
                hh = Q - (Qnew - bvirt) + (fnow - bvirt);
                fnow = f[++findex];
              }
              Q = Qnew;
              if (hh !== 0) {
                h[hindex++] = hh;
              }
            }
          }
          while (eindex < elen) {
            Qnew = Q + enow;
            bvirt = Qnew - Q;
            hh = Q - (Qnew - bvirt) + (enow - bvirt);
            enow = e[++eindex];
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
          }
          while (findex < flen) {
            Qnew = Q + fnow;
            bvirt = Qnew - Q;
            hh = Q - (Qnew - bvirt) + (fnow - bvirt);
            fnow = f[++findex];
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
          }
          if (Q !== 0 || hindex === 0) {
            h[hindex++] = Q;
          }
          return hindex;
        }
        function estimate(elen, e) {
          let Q = e[0];
          for (let i2 = 1; i2 < elen; i2++) Q += e[i2];
          return Q;
        }
        function vec(n) {
          return new Float64Array(n);
        }
        const ccwerrboundA = (3 + 16 * epsilon) * epsilon;
        const ccwerrboundB = (2 + 12 * epsilon) * epsilon;
        const ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;
        const B = vec(4);
        const C1 = vec(8);
        const C2 = vec(12);
        const D = vec(16);
        const u = vec(4);
        function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
          let acxtail, acytail, bcxtail, bcytail;
          let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u3;
          const acx = ax - cx;
          const bcx = bx - cx;
          const acy = ay - cy;
          const bcy = by - cy;
          s1 = acx * bcy;
          c = splitter * acx;
          ahi = c - (c - acx);
          alo = acx - ahi;
          c = splitter * bcy;
          bhi = c - (c - bcy);
          blo = bcy - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acy * bcx;
          c = splitter * acy;
          ahi = c - (c - acy);
          alo = acy - ahi;
          c = splitter * bcx;
          bhi = c - (c - bcx);
          blo = bcx - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          B[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          B[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          B[2] = _j - (u3 - bvirt) + (_i - bvirt);
          B[3] = u3;
          let det = estimate(4, B);
          let errbound = ccwerrboundB * detsum;
          if (det >= errbound || -det >= errbound) {
            return det;
          }
          bvirt = ax - acx;
          acxtail = ax - (acx + bvirt) + (bvirt - cx);
          bvirt = bx - bcx;
          bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
          bvirt = ay - acy;
          acytail = ay - (acy + bvirt) + (bvirt - cy);
          bvirt = by - bcy;
          bcytail = by - (bcy + bvirt) + (bvirt - cy);
          if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
            return det;
          }
          errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
          det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
          if (det >= errbound || -det >= errbound) return det;
          s1 = acxtail * bcy;
          c = splitter * acxtail;
          ahi = c - (c - acxtail);
          alo = acxtail - ahi;
          c = splitter * bcy;
          bhi = c - (c - bcy);
          blo = bcy - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acytail * bcx;
          c = splitter * acytail;
          ahi = c - (c - acytail);
          alo = acytail - ahi;
          c = splitter * bcx;
          bhi = c - (c - bcx);
          blo = bcx - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const C1len = sum(4, B, 4, u, C1);
          s1 = acx * bcytail;
          c = splitter * acx;
          ahi = c - (c - acx);
          alo = acx - ahi;
          c = splitter * bcytail;
          bhi = c - (c - bcytail);
          blo = bcytail - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acy * bcxtail;
          c = splitter * acy;
          ahi = c - (c - acy);
          alo = acy - ahi;
          c = splitter * bcxtail;
          bhi = c - (c - bcxtail);
          blo = bcxtail - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const C2len = sum(C1len, C1, 4, u, C2);
          s1 = acxtail * bcytail;
          c = splitter * acxtail;
          ahi = c - (c - acxtail);
          alo = acxtail - ahi;
          c = splitter * bcytail;
          bhi = c - (c - bcytail);
          blo = bcytail - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acytail * bcxtail;
          c = splitter * acytail;
          ahi = c - (c - acytail);
          alo = acytail - ahi;
          c = splitter * bcxtail;
          bhi = c - (c - bcxtail);
          blo = bcxtail - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const Dlen = sum(C2len, C2, 4, u, D);
          return D[Dlen - 1];
        }
        function orient2d(ax, ay, bx, by, cx, cy) {
          const detleft = (ay - cy) * (bx - cx);
          const detright = (ax - cx) * (by - cy);
          const det = detleft - detright;
          const detsum = Math.abs(detleft + detright);
          if (Math.abs(det) >= ccwerrboundA * detsum) return det;
          return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
        }
        const crossProduct = (a, b) => a.x * b.y - a.y * b.x;
        const dotProduct = (a, b) => a.x * b.x + a.y * b.y;
        const compareVectorAngles = (basePt, endPt1, endPt2) => {
          const res = orient2d(basePt.x, basePt.y, endPt1.x, endPt1.y, endPt2.x, endPt2.y);
          if (res > 0) return -1;
          if (res < 0) return 1;
          return 0;
        };
        const length = (v) => Math.sqrt(dotProduct(v, v));
        const sineOfAngle = (pShared, pBase, pAngle) => {
          const vBase = {
            x: pBase.x - pShared.x,
            y: pBase.y - pShared.y
          };
          const vAngle = {
            x: pAngle.x - pShared.x,
            y: pAngle.y - pShared.y
          };
          return crossProduct(vAngle, vBase) / length(vAngle) / length(vBase);
        };
        const cosineOfAngle = (pShared, pBase, pAngle) => {
          const vBase = {
            x: pBase.x - pShared.x,
            y: pBase.y - pShared.y
          };
          const vAngle = {
            x: pAngle.x - pShared.x,
            y: pAngle.y - pShared.y
          };
          return dotProduct(vAngle, vBase) / length(vAngle) / length(vBase);
        };
        const horizontalIntersection = (pt, v, y) => {
          if (v.y === 0) return null;
          return {
            x: pt.x + v.x / v.y * (y - pt.y),
            y
          };
        };
        const verticalIntersection = (pt, v, x2) => {
          if (v.x === 0) return null;
          return {
            x: x2,
            y: pt.y + v.y / v.x * (x2 - pt.x)
          };
        };
        const intersection$1 = (pt1, v1, pt2, v2) => {
          if (v1.x === 0) return verticalIntersection(pt2, v2, pt1.x);
          if (v2.x === 0) return verticalIntersection(pt1, v1, pt2.x);
          if (v1.y === 0) return horizontalIntersection(pt2, v2, pt1.y);
          if (v2.y === 0) return horizontalIntersection(pt1, v1, pt2.y);
          const kross = crossProduct(v1, v2);
          if (kross == 0) return null;
          const ve = {
            x: pt2.x - pt1.x,
            y: pt2.y - pt1.y
          };
          const d1 = crossProduct(ve, v1) / kross;
          const d2 = crossProduct(ve, v2) / kross;
          const x1 = pt1.x + d2 * v1.x, x2 = pt2.x + d1 * v2.x;
          const y1 = pt1.y + d2 * v1.y, y2 = pt2.y + d1 * v2.y;
          const x3 = (x1 + x2) / 2;
          const y = (y1 + y2) / 2;
          return {
            x: x3,
            y
          };
        };
        class SweepEvent {
          // for ordering sweep events in the sweep event queue
          static compare(a, b) {
            const ptCmp = SweepEvent.comparePoints(a.point, b.point);
            if (ptCmp !== 0) return ptCmp;
            if (a.point !== b.point) a.link(b);
            if (a.isLeft !== b.isLeft) return a.isLeft ? 1 : -1;
            return Segment.compare(a.segment, b.segment);
          }
          // for ordering points in sweep line order
          static comparePoints(aPt, bPt) {
            if (aPt.x < bPt.x) return -1;
            if (aPt.x > bPt.x) return 1;
            if (aPt.y < bPt.y) return -1;
            if (aPt.y > bPt.y) return 1;
            return 0;
          }
          // Warning: 'point' input will be modified and re-used (for performance)
          constructor(point, isLeft) {
            if (point.events === void 0) point.events = [this];
            else point.events.push(this);
            this.point = point;
            this.isLeft = isLeft;
          }
          link(other) {
            if (other.point === this.point) {
              throw new Error("Tried to link already linked events");
            }
            const otherEvents = other.point.events;
            for (let i2 = 0, iMax = otherEvents.length; i2 < iMax; i2++) {
              const evt = otherEvents[i2];
              this.point.events.push(evt);
              evt.point = this.point;
            }
            this.checkForConsuming();
          }
          /* Do a pass over our linked events and check to see if any pair
           * of segments match, and should be consumed. */
          checkForConsuming() {
            const numEvents = this.point.events.length;
            for (let i2 = 0; i2 < numEvents; i2++) {
              const evt1 = this.point.events[i2];
              if (evt1.segment.consumedBy !== void 0) continue;
              for (let j = i2 + 1; j < numEvents; j++) {
                const evt2 = this.point.events[j];
                if (evt2.consumedBy !== void 0) continue;
                if (evt1.otherSE.point.events !== evt2.otherSE.point.events) continue;
                evt1.segment.consume(evt2.segment);
              }
            }
          }
          getAvailableLinkedEvents() {
            const events = [];
            for (let i2 = 0, iMax = this.point.events.length; i2 < iMax; i2++) {
              const evt = this.point.events[i2];
              if (evt !== this && !evt.segment.ringOut && evt.segment.isInResult()) {
                events.push(evt);
              }
            }
            return events;
          }
          /**
           * Returns a comparator function for sorting linked events that will
           * favor the event that will give us the smallest left-side angle.
           * All ring construction starts as low as possible heading to the right,
           * so by always turning left as sharp as possible we'll get polygons
           * without uncessary loops & holes.
           *
           * The comparator function has a compute cache such that it avoids
           * re-computing already-computed values.
           */
          getLeftmostComparator(baseEvent) {
            const cache = /* @__PURE__ */ new Map();
            const fillCache = (linkedEvent) => {
              const nextEvent = linkedEvent.otherSE;
              cache.set(linkedEvent, {
                sine: sineOfAngle(this.point, baseEvent.point, nextEvent.point),
                cosine: cosineOfAngle(this.point, baseEvent.point, nextEvent.point)
              });
            };
            return (a, b) => {
              if (!cache.has(a)) fillCache(a);
              if (!cache.has(b)) fillCache(b);
              const {
                sine: asine,
                cosine: acosine
              } = cache.get(a);
              const {
                sine: bsine,
                cosine: bcosine
              } = cache.get(b);
              if (asine >= 0 && bsine >= 0) {
                if (acosine < bcosine) return 1;
                if (acosine > bcosine) return -1;
                return 0;
              }
              if (asine < 0 && bsine < 0) {
                if (acosine < bcosine) return -1;
                if (acosine > bcosine) return 1;
                return 0;
              }
              if (bsine < asine) return -1;
              if (bsine > asine) return 1;
              return 0;
            };
          }
        }
        let segmentId = 0;
        class Segment {
          /* This compare() function is for ordering segments in the sweep
           * line tree, and does so according to the following criteria:
           *
           * Consider the vertical line that lies an infinestimal step to the
           * right of the right-more of the two left endpoints of the input
           * segments. Imagine slowly moving a point up from negative infinity
           * in the increasing y direction. Which of the two segments will that
           * point intersect first? That segment comes 'before' the other one.
           *
           * If neither segment would be intersected by such a line, (if one
           * or more of the segments are vertical) then the line to be considered
           * is directly on the right-more of the two left inputs.
           */
          static compare(a, b) {
            const alx = a.leftSE.point.x;
            const blx = b.leftSE.point.x;
            const arx = a.rightSE.point.x;
            const brx = b.rightSE.point.x;
            if (brx < alx) return 1;
            if (arx < blx) return -1;
            const aly = a.leftSE.point.y;
            const bly = b.leftSE.point.y;
            const ary = a.rightSE.point.y;
            const bry = b.rightSE.point.y;
            if (alx < blx) {
              if (bly < aly && bly < ary) return 1;
              if (bly > aly && bly > ary) return -1;
              const aCmpBLeft = a.comparePoint(b.leftSE.point);
              if (aCmpBLeft < 0) return 1;
              if (aCmpBLeft > 0) return -1;
              const bCmpARight = b.comparePoint(a.rightSE.point);
              if (bCmpARight !== 0) return bCmpARight;
              return -1;
            }
            if (alx > blx) {
              if (aly < bly && aly < bry) return -1;
              if (aly > bly && aly > bry) return 1;
              const bCmpALeft = b.comparePoint(a.leftSE.point);
              if (bCmpALeft !== 0) return bCmpALeft;
              const aCmpBRight = a.comparePoint(b.rightSE.point);
              if (aCmpBRight < 0) return 1;
              if (aCmpBRight > 0) return -1;
              return 1;
            }
            if (aly < bly) return -1;
            if (aly > bly) return 1;
            if (arx < brx) {
              const bCmpARight = b.comparePoint(a.rightSE.point);
              if (bCmpARight !== 0) return bCmpARight;
            }
            if (arx > brx) {
              const aCmpBRight = a.comparePoint(b.rightSE.point);
              if (aCmpBRight < 0) return 1;
              if (aCmpBRight > 0) return -1;
            }
            if (arx !== brx) {
              const ay = ary - aly;
              const ax = arx - alx;
              const by = bry - bly;
              const bx = brx - blx;
              if (ay > ax && by < bx) return 1;
              if (ay < ax && by > bx) return -1;
            }
            if (arx > brx) return 1;
            if (arx < brx) return -1;
            if (ary < bry) return -1;
            if (ary > bry) return 1;
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
          }
          /* Warning: a reference to ringWindings input will be stored,
           *  and possibly will be later modified */
          constructor(leftSE, rightSE, rings, windings) {
            this.id = ++segmentId;
            this.leftSE = leftSE;
            leftSE.segment = this;
            leftSE.otherSE = rightSE;
            this.rightSE = rightSE;
            rightSE.segment = this;
            rightSE.otherSE = leftSE;
            this.rings = rings;
            this.windings = windings;
          }
          static fromRing(pt1, pt2, ring) {
            let leftPt, rightPt, winding;
            const cmpPts = SweepEvent.comparePoints(pt1, pt2);
            if (cmpPts < 0) {
              leftPt = pt1;
              rightPt = pt2;
              winding = 1;
            } else if (cmpPts > 0) {
              leftPt = pt2;
              rightPt = pt1;
              winding = -1;
            } else throw new Error(`Tried to create degenerate segment at [${pt1.x}, ${pt1.y}]`);
            const leftSE = new SweepEvent(leftPt, true);
            const rightSE = new SweepEvent(rightPt, false);
            return new Segment(leftSE, rightSE, [ring], [winding]);
          }
          /* When a segment is split, the rightSE is replaced with a new sweep event */
          replaceRightSE(newRightSE) {
            this.rightSE = newRightSE;
            this.rightSE.segment = this;
            this.rightSE.otherSE = this.leftSE;
            this.leftSE.otherSE = this.rightSE;
          }
          bbox() {
            const y1 = this.leftSE.point.y;
            const y2 = this.rightSE.point.y;
            return {
              ll: {
                x: this.leftSE.point.x,
                y: y1 < y2 ? y1 : y2
              },
              ur: {
                x: this.rightSE.point.x,
                y: y1 > y2 ? y1 : y2
              }
            };
          }
          /* A vector from the left point to the right */
          vector() {
            return {
              x: this.rightSE.point.x - this.leftSE.point.x,
              y: this.rightSE.point.y - this.leftSE.point.y
            };
          }
          isAnEndpoint(pt) {
            return pt.x === this.leftSE.point.x && pt.y === this.leftSE.point.y || pt.x === this.rightSE.point.x && pt.y === this.rightSE.point.y;
          }
          /* Compare this segment with a point.
           *
           * A point P is considered to be colinear to a segment if there
           * exists a distance D such that if we travel along the segment
           * from one * endpoint towards the other a distance D, we find
           * ourselves at point P.
           *
           * Return value indicates:
           *
           *   1: point lies above the segment (to the left of vertical)
           *   0: point is colinear to segment
           *  -1: point lies below the segment (to the right of vertical)
           */
          comparePoint(point) {
            if (this.isAnEndpoint(point)) return 0;
            const lPt = this.leftSE.point;
            const rPt = this.rightSE.point;
            const v = this.vector();
            if (lPt.x === rPt.x) {
              if (point.x === lPt.x) return 0;
              return point.x < lPt.x ? 1 : -1;
            }
            const yDist = (point.y - lPt.y) / v.y;
            const xFromYDist = lPt.x + yDist * v.x;
            if (point.x === xFromYDist) return 0;
            const xDist = (point.x - lPt.x) / v.x;
            const yFromXDist = lPt.y + xDist * v.y;
            if (point.y === yFromXDist) return 0;
            return point.y < yFromXDist ? -1 : 1;
          }
          /**
           * Given another segment, returns the first non-trivial intersection
           * between the two segments (in terms of sweep line ordering), if it exists.
           *
           * A 'non-trivial' intersection is one that will cause one or both of the
           * segments to be split(). As such, 'trivial' vs. 'non-trivial' intersection:
           *
           *   * endpoint of segA with endpoint of segB --> trivial
           *   * endpoint of segA with point along segB --> non-trivial
           *   * endpoint of segB with point along segA --> non-trivial
           *   * point along segA with point along segB --> non-trivial
           *
           * If no non-trivial intersection exists, return null
           * Else, return null.
           */
          getIntersection(other) {
            const tBbox = this.bbox();
            const oBbox = other.bbox();
            const bboxOverlap = getBboxOverlap(tBbox, oBbox);
            if (bboxOverlap === null) return null;
            const tlp = this.leftSE.point;
            const trp = this.rightSE.point;
            const olp = other.leftSE.point;
            const orp = other.rightSE.point;
            const touchesOtherLSE = isInBbox(tBbox, olp) && this.comparePoint(olp) === 0;
            const touchesThisLSE = isInBbox(oBbox, tlp) && other.comparePoint(tlp) === 0;
            const touchesOtherRSE = isInBbox(tBbox, orp) && this.comparePoint(orp) === 0;
            const touchesThisRSE = isInBbox(oBbox, trp) && other.comparePoint(trp) === 0;
            if (touchesThisLSE && touchesOtherLSE) {
              if (touchesThisRSE && !touchesOtherRSE) return trp;
              if (!touchesThisRSE && touchesOtherRSE) return orp;
              return null;
            }
            if (touchesThisLSE) {
              if (touchesOtherRSE) {
                if (tlp.x === orp.x && tlp.y === orp.y) return null;
              }
              return tlp;
            }
            if (touchesOtherLSE) {
              if (touchesThisRSE) {
                if (trp.x === olp.x && trp.y === olp.y) return null;
              }
              return olp;
            }
            if (touchesThisRSE && touchesOtherRSE) return null;
            if (touchesThisRSE) return trp;
            if (touchesOtherRSE) return orp;
            const pt = intersection$1(tlp, this.vector(), olp, other.vector());
            if (pt === null) return null;
            if (!isInBbox(bboxOverlap, pt)) return null;
            return rounder.round(pt.x, pt.y);
          }
          /**
           * Split the given segment into multiple segments on the given points.
           *  * Each existing segment will retain its leftSE and a new rightSE will be
           *    generated for it.
           *  * A new segment will be generated which will adopt the original segment's
           *    rightSE, and a new leftSE will be generated for it.
           *  * If there are more than two points given to split on, new segments
           *    in the middle will be generated with new leftSE and rightSE's.
           *  * An array of the newly generated SweepEvents will be returned.
           *
           * Warning: input array of points is modified
           */
          split(point) {
            const newEvents = [];
            const alreadyLinked = point.events !== void 0;
            const newLeftSE = new SweepEvent(point, true);
            const newRightSE = new SweepEvent(point, false);
            const oldRightSE = this.rightSE;
            this.replaceRightSE(newRightSE);
            newEvents.push(newRightSE);
            newEvents.push(newLeftSE);
            const newSeg = new Segment(newLeftSE, oldRightSE, this.rings.slice(), this.windings.slice());
            if (SweepEvent.comparePoints(newSeg.leftSE.point, newSeg.rightSE.point) > 0) {
              newSeg.swapEvents();
            }
            if (SweepEvent.comparePoints(this.leftSE.point, this.rightSE.point) > 0) {
              this.swapEvents();
            }
            if (alreadyLinked) {
              newLeftSE.checkForConsuming();
              newRightSE.checkForConsuming();
            }
            return newEvents;
          }
          /* Swap which event is left and right */
          swapEvents() {
            const tmpEvt = this.rightSE;
            this.rightSE = this.leftSE;
            this.leftSE = tmpEvt;
            this.leftSE.isLeft = true;
            this.rightSE.isLeft = false;
            for (let i2 = 0, iMax = this.windings.length; i2 < iMax; i2++) {
              this.windings[i2] *= -1;
            }
          }
          /* Consume another segment. We take their rings under our wing
           * and mark them as consumed. Use for perfectly overlapping segments */
          consume(other) {
            let consumer = this;
            let consumee = other;
            while (consumer.consumedBy) consumer = consumer.consumedBy;
            while (consumee.consumedBy) consumee = consumee.consumedBy;
            const cmp2 = Segment.compare(consumer, consumee);
            if (cmp2 === 0) return;
            if (cmp2 > 0) {
              const tmp = consumer;
              consumer = consumee;
              consumee = tmp;
            }
            if (consumer.prev === consumee) {
              const tmp = consumer;
              consumer = consumee;
              consumee = tmp;
            }
            for (let i2 = 0, iMax = consumee.rings.length; i2 < iMax; i2++) {
              const ring = consumee.rings[i2];
              const winding = consumee.windings[i2];
              const index2 = consumer.rings.indexOf(ring);
              if (index2 === -1) {
                consumer.rings.push(ring);
                consumer.windings.push(winding);
              } else consumer.windings[index2] += winding;
            }
            consumee.rings = null;
            consumee.windings = null;
            consumee.consumedBy = consumer;
            consumee.leftSE.consumedBy = consumer.leftSE;
            consumee.rightSE.consumedBy = consumer.rightSE;
          }
          /* The first segment previous segment chain that is in the result */
          prevInResult() {
            if (this._prevInResult !== void 0) return this._prevInResult;
            if (!this.prev) this._prevInResult = null;
            else if (this.prev.isInResult()) this._prevInResult = this.prev;
            else this._prevInResult = this.prev.prevInResult();
            return this._prevInResult;
          }
          beforeState() {
            if (this._beforeState !== void 0) return this._beforeState;
            if (!this.prev) this._beforeState = {
              rings: [],
              windings: [],
              multiPolys: []
            };
            else {
              const seg = this.prev.consumedBy || this.prev;
              this._beforeState = seg.afterState();
            }
            return this._beforeState;
          }
          afterState() {
            if (this._afterState !== void 0) return this._afterState;
            const beforeState = this.beforeState();
            this._afterState = {
              rings: beforeState.rings.slice(0),
              windings: beforeState.windings.slice(0),
              multiPolys: []
            };
            const ringsAfter = this._afterState.rings;
            const windingsAfter = this._afterState.windings;
            const mpsAfter = this._afterState.multiPolys;
            for (let i2 = 0, iMax = this.rings.length; i2 < iMax; i2++) {
              const ring = this.rings[i2];
              const winding = this.windings[i2];
              const index2 = ringsAfter.indexOf(ring);
              if (index2 === -1) {
                ringsAfter.push(ring);
                windingsAfter.push(winding);
              } else windingsAfter[index2] += winding;
            }
            const polysAfter = [];
            const polysExclude = [];
            for (let i2 = 0, iMax = ringsAfter.length; i2 < iMax; i2++) {
              if (windingsAfter[i2] === 0) continue;
              const ring = ringsAfter[i2];
              const poly = ring.poly;
              if (polysExclude.indexOf(poly) !== -1) continue;
              if (ring.isExterior) polysAfter.push(poly);
              else {
                if (polysExclude.indexOf(poly) === -1) polysExclude.push(poly);
                const index2 = polysAfter.indexOf(ring.poly);
                if (index2 !== -1) polysAfter.splice(index2, 1);
              }
            }
            for (let i2 = 0, iMax = polysAfter.length; i2 < iMax; i2++) {
              const mp = polysAfter[i2].multiPoly;
              if (mpsAfter.indexOf(mp) === -1) mpsAfter.push(mp);
            }
            return this._afterState;
          }
          /* Is this segment part of the final result? */
          isInResult() {
            if (this.consumedBy) return false;
            if (this._isInResult !== void 0) return this._isInResult;
            const mpsBefore = this.beforeState().multiPolys;
            const mpsAfter = this.afterState().multiPolys;
            switch (operation.type) {
              case "union": {
                const noBefores = mpsBefore.length === 0;
                const noAfters = mpsAfter.length === 0;
                this._isInResult = noBefores !== noAfters;
                break;
              }
              case "intersection": {
                let least;
                let most;
                if (mpsBefore.length < mpsAfter.length) {
                  least = mpsBefore.length;
                  most = mpsAfter.length;
                } else {
                  least = mpsAfter.length;
                  most = mpsBefore.length;
                }
                this._isInResult = most === operation.numMultiPolys && least < most;
                break;
              }
              case "xor": {
                const diff = Math.abs(mpsBefore.length - mpsAfter.length);
                this._isInResult = diff % 2 === 1;
                break;
              }
              case "difference": {
                const isJustSubject = (mps) => mps.length === 1 && mps[0].isSubject;
                this._isInResult = isJustSubject(mpsBefore) !== isJustSubject(mpsAfter);
                break;
              }
              default:
                throw new Error(`Unrecognized operation type found ${operation.type}`);
            }
            return this._isInResult;
          }
        }
        class RingIn {
          constructor(geomRing, poly, isExterior) {
            if (!Array.isArray(geomRing) || geomRing.length === 0) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            this.poly = poly;
            this.isExterior = isExterior;
            this.segments = [];
            if (typeof geomRing[0][0] !== "number" || typeof geomRing[0][1] !== "number") {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            const firstPoint = rounder.round(geomRing[0][0], geomRing[0][1]);
            this.bbox = {
              ll: {
                x: firstPoint.x,
                y: firstPoint.y
              },
              ur: {
                x: firstPoint.x,
                y: firstPoint.y
              }
            };
            let prevPoint = firstPoint;
            for (let i2 = 1, iMax = geomRing.length; i2 < iMax; i2++) {
              if (typeof geomRing[i2][0] !== "number" || typeof geomRing[i2][1] !== "number") {
                throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
              }
              let point = rounder.round(geomRing[i2][0], geomRing[i2][1]);
              if (point.x === prevPoint.x && point.y === prevPoint.y) continue;
              this.segments.push(Segment.fromRing(prevPoint, point, this));
              if (point.x < this.bbox.ll.x) this.bbox.ll.x = point.x;
              if (point.y < this.bbox.ll.y) this.bbox.ll.y = point.y;
              if (point.x > this.bbox.ur.x) this.bbox.ur.x = point.x;
              if (point.y > this.bbox.ur.y) this.bbox.ur.y = point.y;
              prevPoint = point;
            }
            if (firstPoint.x !== prevPoint.x || firstPoint.y !== prevPoint.y) {
              this.segments.push(Segment.fromRing(prevPoint, firstPoint, this));
            }
          }
          getSweepEvents() {
            const sweepEvents = [];
            for (let i2 = 0, iMax = this.segments.length; i2 < iMax; i2++) {
              const segment = this.segments[i2];
              sweepEvents.push(segment.leftSE);
              sweepEvents.push(segment.rightSE);
            }
            return sweepEvents;
          }
        }
        class PolyIn {
          constructor(geomPoly, multiPoly) {
            if (!Array.isArray(geomPoly)) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            this.exteriorRing = new RingIn(geomPoly[0], this, true);
            this.bbox = {
              ll: {
                x: this.exteriorRing.bbox.ll.x,
                y: this.exteriorRing.bbox.ll.y
              },
              ur: {
                x: this.exteriorRing.bbox.ur.x,
                y: this.exteriorRing.bbox.ur.y
              }
            };
            this.interiorRings = [];
            for (let i2 = 1, iMax = geomPoly.length; i2 < iMax; i2++) {
              const ring = new RingIn(geomPoly[i2], this, false);
              if (ring.bbox.ll.x < this.bbox.ll.x) this.bbox.ll.x = ring.bbox.ll.x;
              if (ring.bbox.ll.y < this.bbox.ll.y) this.bbox.ll.y = ring.bbox.ll.y;
              if (ring.bbox.ur.x > this.bbox.ur.x) this.bbox.ur.x = ring.bbox.ur.x;
              if (ring.bbox.ur.y > this.bbox.ur.y) this.bbox.ur.y = ring.bbox.ur.y;
              this.interiorRings.push(ring);
            }
            this.multiPoly = multiPoly;
          }
          getSweepEvents() {
            const sweepEvents = this.exteriorRing.getSweepEvents();
            for (let i2 = 0, iMax = this.interiorRings.length; i2 < iMax; i2++) {
              const ringSweepEvents = this.interiorRings[i2].getSweepEvents();
              for (let j = 0, jMax = ringSweepEvents.length; j < jMax; j++) {
                sweepEvents.push(ringSweepEvents[j]);
              }
            }
            return sweepEvents;
          }
        }
        class MultiPolyIn {
          constructor(geom, isSubject) {
            if (!Array.isArray(geom)) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            try {
              if (typeof geom[0][0][0] === "number") geom = [geom];
            } catch (ex) {
            }
            this.polys = [];
            this.bbox = {
              ll: {
                x: Number.POSITIVE_INFINITY,
                y: Number.POSITIVE_INFINITY
              },
              ur: {
                x: Number.NEGATIVE_INFINITY,
                y: Number.NEGATIVE_INFINITY
              }
            };
            for (let i2 = 0, iMax = geom.length; i2 < iMax; i2++) {
              const poly = new PolyIn(geom[i2], this);
              if (poly.bbox.ll.x < this.bbox.ll.x) this.bbox.ll.x = poly.bbox.ll.x;
              if (poly.bbox.ll.y < this.bbox.ll.y) this.bbox.ll.y = poly.bbox.ll.y;
              if (poly.bbox.ur.x > this.bbox.ur.x) this.bbox.ur.x = poly.bbox.ur.x;
              if (poly.bbox.ur.y > this.bbox.ur.y) this.bbox.ur.y = poly.bbox.ur.y;
              this.polys.push(poly);
            }
            this.isSubject = isSubject;
          }
          getSweepEvents() {
            const sweepEvents = [];
            for (let i2 = 0, iMax = this.polys.length; i2 < iMax; i2++) {
              const polySweepEvents = this.polys[i2].getSweepEvents();
              for (let j = 0, jMax = polySweepEvents.length; j < jMax; j++) {
                sweepEvents.push(polySweepEvents[j]);
              }
            }
            return sweepEvents;
          }
        }
        class RingOut {
          /* Given the segments from the sweep line pass, compute & return a series
           * of closed rings from all the segments marked to be part of the result */
          static factory(allSegments) {
            const ringsOut = [];
            for (let i2 = 0, iMax = allSegments.length; i2 < iMax; i2++) {
              const segment = allSegments[i2];
              if (!segment.isInResult() || segment.ringOut) continue;
              let prevEvent = null;
              let event = segment.leftSE;
              let nextEvent = segment.rightSE;
              const events = [event];
              const startingPoint = event.point;
              const intersectionLEs = [];
              while (true) {
                prevEvent = event;
                event = nextEvent;
                events.push(event);
                if (event.point === startingPoint) break;
                while (true) {
                  const availableLEs = event.getAvailableLinkedEvents();
                  if (availableLEs.length === 0) {
                    const firstPt = events[0].point;
                    const lastPt = events[events.length - 1].point;
                    throw new Error(`Unable to complete output ring starting at [${firstPt.x}, ${firstPt.y}]. Last matching segment found ends at [${lastPt.x}, ${lastPt.y}].`);
                  }
                  if (availableLEs.length === 1) {
                    nextEvent = availableLEs[0].otherSE;
                    break;
                  }
                  let indexLE = null;
                  for (let j = 0, jMax = intersectionLEs.length; j < jMax; j++) {
                    if (intersectionLEs[j].point === event.point) {
                      indexLE = j;
                      break;
                    }
                  }
                  if (indexLE !== null) {
                    const intersectionLE = intersectionLEs.splice(indexLE)[0];
                    const ringEvents = events.splice(intersectionLE.index);
                    ringEvents.unshift(ringEvents[0].otherSE);
                    ringsOut.push(new RingOut(ringEvents.reverse()));
                    continue;
                  }
                  intersectionLEs.push({
                    index: events.length,
                    point: event.point
                  });
                  const comparator = event.getLeftmostComparator(prevEvent);
                  nextEvent = availableLEs.sort(comparator)[0].otherSE;
                  break;
                }
              }
              ringsOut.push(new RingOut(events));
            }
            return ringsOut;
          }
          constructor(events) {
            this.events = events;
            for (let i2 = 0, iMax = events.length; i2 < iMax; i2++) {
              events[i2].segment.ringOut = this;
            }
            this.poly = null;
          }
          getGeom() {
            let prevPt = this.events[0].point;
            const points = [prevPt];
            for (let i2 = 1, iMax = this.events.length - 1; i2 < iMax; i2++) {
              const pt2 = this.events[i2].point;
              const nextPt2 = this.events[i2 + 1].point;
              if (compareVectorAngles(pt2, prevPt, nextPt2) === 0) continue;
              points.push(pt2);
              prevPt = pt2;
            }
            if (points.length === 1) return null;
            const pt = points[0];
            const nextPt = points[1];
            if (compareVectorAngles(pt, prevPt, nextPt) === 0) points.shift();
            points.push(points[0]);
            const step = this.isExteriorRing() ? 1 : -1;
            const iStart = this.isExteriorRing() ? 0 : points.length - 1;
            const iEnd = this.isExteriorRing() ? points.length : -1;
            const orderedPoints = [];
            for (let i2 = iStart; i2 != iEnd; i2 += step) orderedPoints.push([points[i2].x, points[i2].y]);
            return orderedPoints;
          }
          isExteriorRing() {
            if (this._isExteriorRing === void 0) {
              const enclosing = this.enclosingRing();
              this._isExteriorRing = enclosing ? !enclosing.isExteriorRing() : true;
            }
            return this._isExteriorRing;
          }
          enclosingRing() {
            if (this._enclosingRing === void 0) {
              this._enclosingRing = this._calcEnclosingRing();
            }
            return this._enclosingRing;
          }
          /* Returns the ring that encloses this one, if any */
          _calcEnclosingRing() {
            let leftMostEvt = this.events[0];
            for (let i2 = 1, iMax = this.events.length; i2 < iMax; i2++) {
              const evt = this.events[i2];
              if (SweepEvent.compare(leftMostEvt, evt) > 0) leftMostEvt = evt;
            }
            let prevSeg = leftMostEvt.segment.prevInResult();
            let prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null;
            while (true) {
              if (!prevSeg) return null;
              if (!prevPrevSeg) return prevSeg.ringOut;
              if (prevPrevSeg.ringOut !== prevSeg.ringOut) {
                if (prevPrevSeg.ringOut.enclosingRing() !== prevSeg.ringOut) {
                  return prevSeg.ringOut;
                } else return prevSeg.ringOut.enclosingRing();
              }
              prevSeg = prevPrevSeg.prevInResult();
              prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null;
            }
          }
        }
        class PolyOut {
          constructor(exteriorRing) {
            this.exteriorRing = exteriorRing;
            exteriorRing.poly = this;
            this.interiorRings = [];
          }
          addInterior(ring) {
            this.interiorRings.push(ring);
            ring.poly = this;
          }
          getGeom() {
            const geom = [this.exteriorRing.getGeom()];
            if (geom[0] === null) return null;
            for (let i2 = 0, iMax = this.interiorRings.length; i2 < iMax; i2++) {
              const ringGeom = this.interiorRings[i2].getGeom();
              if (ringGeom === null) continue;
              geom.push(ringGeom);
            }
            return geom;
          }
        }
        class MultiPolyOut {
          constructor(rings) {
            this.rings = rings;
            this.polys = this._composePolys(rings);
          }
          getGeom() {
            const geom = [];
            for (let i2 = 0, iMax = this.polys.length; i2 < iMax; i2++) {
              const polyGeom = this.polys[i2].getGeom();
              if (polyGeom === null) continue;
              geom.push(polyGeom);
            }
            return geom;
          }
          _composePolys(rings) {
            const polys = [];
            for (let i2 = 0, iMax = rings.length; i2 < iMax; i2++) {
              const ring = rings[i2];
              if (ring.poly) continue;
              if (ring.isExteriorRing()) polys.push(new PolyOut(ring));
              else {
                const enclosingRing = ring.enclosingRing();
                if (!enclosingRing.poly) polys.push(new PolyOut(enclosingRing));
                enclosingRing.poly.addInterior(ring);
              }
            }
            return polys;
          }
        }
        class SweepLine {
          constructor(queue) {
            let comparator = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Segment.compare;
            this.queue = queue;
            this.tree = new Tree(comparator);
            this.segments = [];
          }
          process(event) {
            const segment = event.segment;
            const newEvents = [];
            if (event.consumedBy) {
              if (event.isLeft) this.queue.remove(event.otherSE);
              else this.tree.remove(segment);
              return newEvents;
            }
            const node = event.isLeft ? this.tree.add(segment) : this.tree.find(segment);
            if (!node) throw new Error(`Unable to find segment #${segment.id} [${segment.leftSE.point.x}, ${segment.leftSE.point.y}] -> [${segment.rightSE.point.x}, ${segment.rightSE.point.y}] in SweepLine tree.`);
            let prevNode = node;
            let nextNode = node;
            let prevSeg = void 0;
            let nextSeg = void 0;
            while (prevSeg === void 0) {
              prevNode = this.tree.prev(prevNode);
              if (prevNode === null) prevSeg = null;
              else if (prevNode.key.consumedBy === void 0) prevSeg = prevNode.key;
            }
            while (nextSeg === void 0) {
              nextNode = this.tree.next(nextNode);
              if (nextNode === null) nextSeg = null;
              else if (nextNode.key.consumedBy === void 0) nextSeg = nextNode.key;
            }
            if (event.isLeft) {
              let prevMySplitter = null;
              if (prevSeg) {
                const prevInter = prevSeg.getIntersection(segment);
                if (prevInter !== null) {
                  if (!segment.isAnEndpoint(prevInter)) prevMySplitter = prevInter;
                  if (!prevSeg.isAnEndpoint(prevInter)) {
                    const newEventsFromSplit = this._splitSafely(prevSeg, prevInter);
                    for (let i2 = 0, iMax = newEventsFromSplit.length; i2 < iMax; i2++) {
                      newEvents.push(newEventsFromSplit[i2]);
                    }
                  }
                }
              }
              let nextMySplitter = null;
              if (nextSeg) {
                const nextInter = nextSeg.getIntersection(segment);
                if (nextInter !== null) {
                  if (!segment.isAnEndpoint(nextInter)) nextMySplitter = nextInter;
                  if (!nextSeg.isAnEndpoint(nextInter)) {
                    const newEventsFromSplit = this._splitSafely(nextSeg, nextInter);
                    for (let i2 = 0, iMax = newEventsFromSplit.length; i2 < iMax; i2++) {
                      newEvents.push(newEventsFromSplit[i2]);
                    }
                  }
                }
              }
              if (prevMySplitter !== null || nextMySplitter !== null) {
                let mySplitter = null;
                if (prevMySplitter === null) mySplitter = nextMySplitter;
                else if (nextMySplitter === null) mySplitter = prevMySplitter;
                else {
                  const cmpSplitters = SweepEvent.comparePoints(prevMySplitter, nextMySplitter);
                  mySplitter = cmpSplitters <= 0 ? prevMySplitter : nextMySplitter;
                }
                this.queue.remove(segment.rightSE);
                newEvents.push(segment.rightSE);
                const newEventsFromSplit = segment.split(mySplitter);
                for (let i2 = 0, iMax = newEventsFromSplit.length; i2 < iMax; i2++) {
                  newEvents.push(newEventsFromSplit[i2]);
                }
              }
              if (newEvents.length > 0) {
                this.tree.remove(segment);
                newEvents.push(event);
              } else {
                this.segments.push(segment);
                segment.prev = prevSeg;
              }
            } else {
              if (prevSeg && nextSeg) {
                const inter = prevSeg.getIntersection(nextSeg);
                if (inter !== null) {
                  if (!prevSeg.isAnEndpoint(inter)) {
                    const newEventsFromSplit = this._splitSafely(prevSeg, inter);
                    for (let i2 = 0, iMax = newEventsFromSplit.length; i2 < iMax; i2++) {
                      newEvents.push(newEventsFromSplit[i2]);
                    }
                  }
                  if (!nextSeg.isAnEndpoint(inter)) {
                    const newEventsFromSplit = this._splitSafely(nextSeg, inter);
                    for (let i2 = 0, iMax = newEventsFromSplit.length; i2 < iMax; i2++) {
                      newEvents.push(newEventsFromSplit[i2]);
                    }
                  }
                }
              }
              this.tree.remove(segment);
            }
            return newEvents;
          }
          /* Safely split a segment that is currently in the datastructures
           * IE - a segment other than the one that is currently being processed. */
          _splitSafely(seg, pt) {
            this.tree.remove(seg);
            const rightSE = seg.rightSE;
            this.queue.remove(rightSE);
            const newEvents = seg.split(pt);
            newEvents.push(rightSE);
            if (seg.consumedBy === void 0) this.tree.add(seg);
            return newEvents;
          }
        }
        const POLYGON_CLIPPING_MAX_QUEUE_SIZE = typeof process !== "undefined" && process.env.POLYGON_CLIPPING_MAX_QUEUE_SIZE || 1e6;
        const POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS = typeof process !== "undefined" && process.env.POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS || 1e6;
        class Operation {
          run(type, geom, moreGeoms) {
            operation.type = type;
            rounder.reset();
            const multipolys = [new MultiPolyIn(geom, true)];
            for (let i2 = 0, iMax = moreGeoms.length; i2 < iMax; i2++) {
              multipolys.push(new MultiPolyIn(moreGeoms[i2], false));
            }
            operation.numMultiPolys = multipolys.length;
            if (operation.type === "difference") {
              const subject = multipolys[0];
              let i2 = 1;
              while (i2 < multipolys.length) {
                if (getBboxOverlap(multipolys[i2].bbox, subject.bbox) !== null) i2++;
                else multipolys.splice(i2, 1);
              }
            }
            if (operation.type === "intersection") {
              for (let i2 = 0, iMax = multipolys.length; i2 < iMax; i2++) {
                const mpA = multipolys[i2];
                for (let j = i2 + 1, jMax = multipolys.length; j < jMax; j++) {
                  if (getBboxOverlap(mpA.bbox, multipolys[j].bbox) === null) return [];
                }
              }
            }
            const queue = new Tree(SweepEvent.compare);
            for (let i2 = 0, iMax = multipolys.length; i2 < iMax; i2++) {
              const sweepEvents = multipolys[i2].getSweepEvents();
              for (let j = 0, jMax = sweepEvents.length; j < jMax; j++) {
                queue.insert(sweepEvents[j]);
                if (queue.size > POLYGON_CLIPPING_MAX_QUEUE_SIZE) {
                  throw new Error("Infinite loop when putting segment endpoints in a priority queue (queue size too big).");
                }
              }
            }
            const sweepLine = new SweepLine(queue);
            let prevQueueSize = queue.size;
            let node = queue.pop();
            while (node) {
              const evt = node.key;
              if (queue.size === prevQueueSize) {
                const seg = evt.segment;
                throw new Error(`Unable to pop() ${evt.isLeft ? "left" : "right"} SweepEvent [${evt.point.x}, ${evt.point.y}] from segment #${seg.id} [${seg.leftSE.point.x}, ${seg.leftSE.point.y}] -> [${seg.rightSE.point.x}, ${seg.rightSE.point.y}] from queue.`);
              }
              if (queue.size > POLYGON_CLIPPING_MAX_QUEUE_SIZE) {
                throw new Error("Infinite loop when passing sweep line over endpoints (queue size too big).");
              }
              if (sweepLine.segments.length > POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS) {
                throw new Error("Infinite loop when passing sweep line over endpoints (too many sweep line segments).");
              }
              const newEvents = sweepLine.process(evt);
              for (let i2 = 0, iMax = newEvents.length; i2 < iMax; i2++) {
                const evt2 = newEvents[i2];
                if (evt2.consumedBy === void 0) queue.insert(evt2);
              }
              prevQueueSize = queue.size;
              node = queue.pop();
            }
            rounder.reset();
            const ringsOut = RingOut.factory(sweepLine.segments);
            const result = new MultiPolyOut(ringsOut);
            return result.getGeom();
          }
        }
        const operation = new Operation();
        const union = function(geom) {
          for (var _len = arguments.length, moreGeoms = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            moreGeoms[_key - 1] = arguments[_key];
          }
          return operation.run("union", geom, moreGeoms);
        };
        const intersection = function(geom) {
          for (var _len2 = arguments.length, moreGeoms = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            moreGeoms[_key2 - 1] = arguments[_key2];
          }
          return operation.run("intersection", geom, moreGeoms);
        };
        const xor = function(geom) {
          for (var _len3 = arguments.length, moreGeoms = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            moreGeoms[_key3 - 1] = arguments[_key3];
          }
          return operation.run("xor", geom, moreGeoms);
        };
        const difference = function(subjectGeom) {
          for (var _len4 = arguments.length, clippingGeoms = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
            clippingGeoms[_key4 - 1] = arguments[_key4];
          }
          return operation.run("difference", subjectGeom, clippingGeoms);
        };
        var index = {
          union,
          intersection,
          xor,
          difference
        };
        return index;
      }));
    }
  });

  // geometry.js
  var designs = [
    { id: "petal", name: "Petal", description: "Soft curves. Warm tones. A sunny disposition." },
    { id: "round", name: "Essential", description: "A clean silhouette. A timeless kind of simple." },
    { id: "arch", name: "Arch", description: "An architectural little moment for your wall." },
    { id: "wave", name: "Wave", description: "Easy rhythms. A playful change of pace." },
    { id: "squircle", name: "Soft square", description: "Rounded edges. A fresh perspective on time." },
    { id: "sun", name: "Sunburst", description: "A little sunshine, whatever the hour." }
  ];
  function shapePath(id) {
    if (id === "arch") return "M65 330V175 A135 135 0 0 1 335 175V330Q335 350 315 350H85Q65 350 65 330Z";
    if (id === "squircle") return "M105 35H295Q365 35 365 105V295Q365 365 295 365H105Q35 365 35 295V105Q35 35 105 35Z";
    const points = [];
    for (let i2 = 0; i2 < 720; i2++) {
      const a = i2 / 720 * Math.PI * 2;
      const r = id === "round" ? 168 : id === "petal" ? 155 + 17 * Math.cos(12 * a) : id === "wave" ? 151 + 20 * Math.sin(6 * a) : 153 + 18 * Math.cos(24 * a);
      points.push(`${i2 ? "L" : "M"}${(200 + r * Math.cos(a)).toFixed(2)} ${(200 + r * Math.sin(a)).toFixed(2)}`);
    }
    return points.join("") + "Z";
  }

  // svg-import.js
  var SVG_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
  var SVG_RASTER_SIZE = 2048;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SVG_ELEMENTS = /* @__PURE__ */ new Set(["svg", "g", "path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "defs", "symbol", "use", "clipPath", "mask", "linearGradient", "radialGradient", "stop", "pattern", "text", "tspan", "textPath", "image", "filter", "feGaussianBlur", "feOffset", "feColorMatrix", "feBlend", "feComposite", "feFlood", "feMerge", "feMergeNode", "feComponentTransfer", "feFuncR", "feFuncG", "feFuncB", "feFuncA", "feDropShadow"]);
  var SVG_ATTRIBUTES = /* @__PURE__ */ new Set(["id", "class", "d", "x", "y", "width", "height", "cx", "cy", "r", "rx", "ry", "fx", "fy", "fr", "x1", "x2", "y1", "y2", "points", "transform", "viewBox", "preserveAspectRatio", "maskUnits", "maskContentUnits", "clipPathUnits", "gradientUnits", "gradientTransform", "patternUnits", "patternContentUnits", "patternTransform", "offset", "spreadMethod", "lengthAdjust", "textLength", "startOffset", "dx", "dy", "rotate", "pathLength", "filterUnits", "primitiveUnits", "in", "in2", "result", "stdDeviation", "type", "values", "mode", "operator", "k1", "k2", "k3", "k4", "tableValues", "slope", "intercept", "amplitude", "exponent"]);
  var SVG_STYLES = /* @__PURE__ */ new Set(["fill", "fill-opacity", "fill-rule", "stroke", "stroke-opacity", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "opacity", "clip-path", "clip-rule", "mask", "mask-type", "display", "visibility", "color", "font-family", "font-size", "font-style", "font-weight", "font-variant", "letter-spacing", "word-spacing", "text-anchor", "dominant-baseline", "paint-order", "vector-effect", "transform", "transform-origin", "transform-box", "stop-color", "stop-opacity", "filter", "flood-color", "flood-opacity", "color-interpolation-filters"]);
  function safePaint(value) {
    if (/\\|(?:https?:|file:|data:|\/\/|@|expression\s*\(|var\s*\()/i.test(value)) return false;
    for (const match of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      if (!/^#[^\s<>"']+$/.test(match[2])) return false;
    }
    return true;
  }
  function cleanStyle(source) {
    const result = [];
    for (const property of source) {
      const value = source.getPropertyValue(property);
      if (SVG_STYLES.has(property) && safePaint(value)) result.push(`${property}:${value}${source.getPropertyPriority(property) ? "!important" : ""}`);
    }
    return result.join(";");
  }
  function sanitizedSVG(source) {
    if (typeof source !== "string" || source.length > SVG_IMPORT_MAX_BYTES || new TextEncoder().encode(source).byteLength > SVG_IMPORT_MAX_BYTES) throw Error("Please choose an SVG smaller than 5 MB.");
    const doc = new DOMParser().parseFromString(source, "image/svg+xml");
    if (doc.querySelector("parsererror") || doc.documentElement.localName !== "svg") throw Error("This file isn’t a valid SVG.");
    const output = document.createElementNS(SVG_NS, "svg");
    let nodes = 0;
    const copy = (input, parent) => {
      if (++nodes > 1e4) throw Error("This SVG has too many shapes. Simplify it in your SVG editor, then try again.");
      if (input.nodeType === Node.TEXT_NODE) {
        if (["text", "tspan", "textPath"].includes(parent.localName)) parent.append(document.createTextNode(input.textContent));
        return;
      }
      if (input.nodeType !== Node.ELEMENT_NODE) return;
      if (input.localName === "style") {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(input.textContent);
        const rules = [...sheet.cssRules].filter((rule) => rule.type === CSSRule.STYLE_RULE).map((rule) => {
          const declarations = cleanStyle(rule.style);
          return declarations ? `${rule.selectorText}{${declarations}}` : "";
        }).join("\n");
        if (rules) {
          const style = document.createElementNS(SVG_NS, "style");
          style.textContent = rules;
          parent.append(style);
        }
        return;
      }
      if (!SVG_ELEMENTS.has(input.localName)) return;
      const element = input === doc.documentElement ? output : document.createElementNS(SVG_NS, input.localName);
      for (const attribute of input.attributes) {
        const name = attribute.localName, value = attribute.value;
        if (SVG_ATTRIBUTES.has(name)) element.setAttribute(name, value);
        else if (SVG_STYLES.has(name) && safePaint(value)) element.setAttribute(name, value);
        else if (name === "style") {
          const parsed = document.createElement("span").style;
          parsed.cssText = value;
          const safe = cleanStyle(parsed);
          if (safe) element.setAttribute("style", safe);
        } else if (name === "href") {
          if (/^#[^\s<>"']+$/.test(value) && ["use", "textPath"].includes(input.localName)) element.setAttribute("href", value);
          else if (input.localName === "image" && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) element.setAttribute("href", value);
        }
      }
      if (element !== output) parent.append(element);
      for (const child of input.childNodes) copy(child, element);
    };
    copy(doc.documentElement, output);
    const ids = new Map([...output.querySelectorAll("[id]")].map((element) => [element.id, element]));
    const costs = /* @__PURE__ */ new Map();
    function cost(element, active = /* @__PURE__ */ new Set(), depth = 0) {
      if (active.has(element) || depth > 32) throw Error("This SVG has circular or deeply nested shapes. Expand its symbols and try again.");
      if (costs.has(element)) return costs.get(element);
      active.add(element);
      let total = 1;
      for (const child of element.children) total += cost(child, active, depth + 1);
      const reference = element.localName === "use" && ids.get(element.getAttribute("href")?.slice(1));
      if (reference) total += cost(reference, active, depth + 1);
      active.delete(element);
      if (total > 5e4) throw Error("This SVG repeats too many shapes. Expand or simplify its symbols and try again.");
      costs.set(element, total);
      return total;
    }
    cost(output);
    return output;
  }
  async function svgImage(svg) {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      image.src = url;
      await image.decode();
      return image;
    } catch {
      throw Error("The SVG could not be drawn. Try exporting a plain SVG from your editor.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function prepareSVG(source) {
    const svg = sanitizedSVG(source);
    svg.setAttribute("width", String(SVG_RASTER_SIZE));
    svg.setAttribute("height", String(SVG_RASTER_SIZE));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-100000px;top:0;opacity:0;pointer-events:none;width:${SVG_RASTER_SIZE}px;height:${SVG_RASTER_SIZE}px;`;
    host.attachShadow({ mode: "closed" }).append(svg);
    document.body.append(host);
    try {
      for (const element of svg.querySelectorAll("*")) {
        if (element.closest("symbol[viewBox]") || element.parentElement?.closest('pattern[viewBox],pattern[patternContentUnits="objectBoundingBox"],clipPath[clipPathUnits="objectBoundingBox"],mask[maskContentUnits="objectBoundingBox"],filter[primitiveUnits="objectBoundingBox"]')) continue;
        const units = { linearGradient: "gradientUnits", radialGradient: "gradientUnits", pattern: "patternUnits", mask: "maskUnits", filter: "filterUnits" }[element.localName];
        const objectBounds = units && element.getAttribute(units) !== "userSpaceOnUse";
        for (const name of ["x", "y", "width", "height", "cx", "cy", "r", "rx", "ry", "fx", "fy", "fr", "x1", "x2", "y1", "y2", "dx", "dy"]) {
          if (objectBounds) continue;
          if (!element.getAttribute(name)?.includes("%")) continue;
          const value = element[name]?.baseVal;
          if (value && Number.isFinite(value.value)) element.setAttribute(name, String(value.value));
          else if (value && Number.isInteger(value.numberOfItems)) {
            const values = Array.from({ length: value.numberOfItems }, (_, i2) => value.getItem(i2).value);
            if (values.every(Number.isFinite)) element.setAttribute(name, values.join(" "));
          }
        }
        const style = getComputedStyle(element);
        const viewport = element.nearestViewportElement || svg;
        const width2 = viewport.viewBox?.baseVal.width || viewport.width?.baseVal.value || 1024;
        const height2 = viewport.viewBox?.baseVal.height || viewport.height?.baseVal.value || 1024;
        const diagonal = Math.hypot(width2, height2) / Math.SQRT2;
        for (const property of ["stroke-width", "stroke-dasharray", "stroke-dashoffset"]) {
          const value = style.getPropertyValue(property);
          if (value.includes("%")) element.style.setProperty(property, value.replace(/(-?(?:\d*\.)?\d+)%/g, (_match, number) => String(Number(number) * diagonal / 100)), "important");
        }
      }
      const outerTransform = getComputedStyle(svg).transform;
      if (outerTransform && outerTransform !== "none") {
        const group = document.createElementNS(SVG_NS, "g");
        for (const property of ["fill", "fill-opacity", "fill-rule", "stroke", "stroke-opacity", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "color", "font-family", "font-size", "font-style", "font-weight", "letter-spacing", "text-anchor", "dominant-baseline", "paint-order"]) group.style.setProperty(property, "inherit", "important");
        for (const [property, value] of [["opacity", "1"], ["clip-path", "none"], ["mask", "none"], ["display", "inline"], ["visibility", "inherit"], ["transform", outerTransform], ["transform-origin", "0 0"]]) group.style.setProperty(property, value, "important");
        group.append(...svg.childNodes);
        svg.append(group);
        svg.removeAttribute("transform");
        svg.style.setProperty("transform", "none", "important");
      }
      const box = svg.getBBox();
      let padding = 0;
      const rootMatrix = svg.getScreenCTM()?.inverse();
      for (const element of svg.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line,text,use")) {
        const style = getComputedStyle(element);
        if (style.stroke === "none" || style.display === "none") continue;
        const matrix = rootMatrix && element.getScreenCTM();
        const relative = matrix && rootMatrix.multiply(matrix);
        const scale2 = relative ? Math.max(Math.hypot(relative.a, relative.b), Math.hypot(relative.c, relative.d)) : 1;
        padding = Math.max(padding, (parseFloat(style.strokeWidth) || 0) * scale2 * 2);
      }
      if (![box.x, box.y, box.width, box.height, padding].every(Number.isFinite) || box.width <= 0 && box.height <= 0 && padding <= 0) throw Error("This SVG has no visible shapes. Export your drawing as paths or filled shapes, then try again.");
      padding += Math.max(box.width, box.height, 1) * (svg.querySelector("filter") ? 0.2 : 0.02);
      svg.setAttribute("viewBox", `${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`);
    } finally {
      host.remove();
    }
    const svgText = new XMLSerializer().serializeToString(svg);
    const decoded = await svgImage(svgText);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SVG_RASTER_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(decoded, 0, 0, SVG_RASTER_SIZE, SVG_RASTER_SIZE);
    const pixels = ctx.getImageData(0, 0, SVG_RASTER_SIZE, SVG_RASTER_SIZE).data;
    let minX = SVG_RASTER_SIZE, minY = SVG_RASTER_SIZE, maxX = -1, maxY = -1;
    for (let y = 0; y < SVG_RASTER_SIZE; y++) for (let x2 = 0; x2 < SVG_RASTER_SIZE; x2++) if (pixels[(y * SVG_RASTER_SIZE + x2) * 4 + 3] >= 16) {
      minX = Math.min(minX, x2);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y);
    }
    if (maxX < 0) throw Error("This SVG has no visible artwork. Embedded links and hidden layers aren’t imported; export visible paths and try again.");
    const fitted = document.createElement("canvas");
    fitted.width = fitted.height = SVG_RASTER_SIZE;
    const fit = fitted.getContext("2d");
    const width = maxX - minX + 1, height = maxY - minY + 1, scale = SVG_RASTER_SIZE * 860 / 1024 / Math.max(width, height);
    fit.drawImage(canvas, minX, minY, width, height, (SVG_RASTER_SIZE - width * scale) / 2, (SVG_RASTER_SIZE - height * scale) / 2, width * scale, height * scale);
    const artworkURL = fitted.toDataURL("image/png");
    const image = new Image();
    image.src = artworkURL;
    await image.decode();
    fit.globalCompositeOperation = "source-in";
    fit.fillStyle = "#fff";
    fit.fillRect(0, 0, SVG_RASTER_SIZE, SVG_RASTER_SIZE);
    const maskURL = fitted.toDataURL("image/png");
    return {
      markup: `<image x="0" y="0" width="400" height="400" href="${maskURL}"/>`,
      artworkMarkup: `<image x="0" y="0" width="400" height="400" href="${artworkURL}"/>`,
      image,
      svgText
    };
  }

  // svg-library.js
  var DATABASE_NAME = "clock-factory-artwork";
  var STORE_NAME = "svgs";
  var MAX_SAVED_SVGS = 8;
  var MAX_SOURCE_BYTES = 5 * 1024 * 1024;
  var MAX_THUMBNAIL_BYTES = 512 * 1024;
  var databasePromise = null;
  var fallbackId = 0;
  function storageError(error, action = "open") {
    if (error?.name === "QuotaExceededError") return new Error("There isn’t enough storage on this device to save your SVG. Your current design is still available in this session.");
    if (error?.name === "SecurityError" || error?.name === "InvalidStateError") return new Error("Saved artwork is unavailable in this browser. Your current design is still available in this session.");
    return new Error(action === "delete" ? "The saved SVG couldn’t be removed. Please try again." : "Saved artwork couldn’t be opened or updated. Your current design is still available in this session.");
  }
  function openDatabase() {
    if (databasePromise) return databasePromise;
    let indexedDB;
    try {
      indexedDB = globalThis.indexedDB;
    } catch (error) {
      return Promise.reject(storageError(error));
    }
    if (!indexedDB) return Promise.reject(new Error("This browser cannot save SVG files locally. Your current design is still available in this session."));
    const pending = new Promise((resolve, reject) => {
      let settled = false, request;
      try {
        request = indexedDB.open(DATABASE_NAME, 1);
      } catch (error) {
        reject(storageError(error));
        return;
      }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onblocked = () => {
        settled = true;
        reject(new Error("Close any older Clock Factory windows, then try saving your SVG again."));
      };
      request.onerror = () => {
        settled = true;
        reject(storageError(request.error));
      };
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        database.onversionchange = () => {
          database.close();
          if (databasePromise === pending) databasePromise = null;
        };
        database.onclose = () => {
          if (databasePromise === pending) databasePromise = null;
        };
        settled = true;
        resolve(database);
      };
    });
    databasePromise = pending;
    pending.catch(() => {
      if (databasePromise === pending) databasePromise = null;
    });
    return pending;
  }
  function cleanName(name) {
    const basename = typeof name === "string" ? name.split(/[\\/]/).at(-1) : "";
    const text = basename.replace(/[\u0000-\u001f\u007f<>]/g, "").trim();
    let result = "", length = 0;
    for (const character of text) {
      if (length++ === 255) break;
      result += character;
    }
    return result || "Imported SVG.svg";
  }
  function validThumbnail(value) {
    if (typeof value !== "string" || value.length > Math.ceil(MAX_THUMBNAIL_BYTES / 3) * 4 + 22 || !/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
    const base64 = value.slice("data:image/png;base64,".length);
    const bytes2 = base64.length * 3 / 4 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    return base64.length % 4 === 0 && bytes2 <= MAX_THUMBNAIL_BYTES;
  }
  function checkedInput(input) {
    if (!input || typeof input.source !== "string" || !input.source.trim()) throw new TypeError("Choose an SVG file before saving it.");
    if (input.source.length > MAX_SOURCE_BYTES) throw new RangeError("Please choose an SVG smaller than 5 MB.");
    const bytes2 = new TextEncoder().encode(input.source).byteLength;
    if (bytes2 > MAX_SOURCE_BYTES) throw new RangeError("Please choose an SVG smaller than 5 MB.");
    const size = input.size == null ? bytes2 : input.size;
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_SOURCE_BYTES) throw new RangeError("The SVG file size must be between 1 byte and 5 MB.");
    if (!validThumbnail(input.thumbnail)) throw new TypeError("The SVG thumbnail must be a PNG image smaller than 512 KB.");
    return { name: cleanName(input.name), source: input.source, thumbnail: input.thumbnail, size };
  }
  function validRecord(record3) {
    return record3 && typeof record3.id === "string" && record3.id.length > 0 && record3.id.length <= 128 && typeof record3.source === "string" && record3.source.length <= MAX_SOURCE_BYTES && typeof record3.name === "string" && validThumbnail(record3.thumbnail) && Number.isSafeInteger(record3.size) && record3.size > 0 && record3.size <= MAX_SOURCE_BYTES && Number.isSafeInteger(record3.updatedAt) && record3.updatedAt > 0;
  }
  function metadata(record3) {
    return { id: record3.id, name: cleanName(record3.name), size: record3.size, updatedAt: record3.updatedAt, thumbnail: record3.thumbnail };
  }
  function fullRecord(record3) {
    return { ...metadata(record3), source: record3.source };
  }
  async function transaction(mode, action, run) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      let tx, result, failure;
      try {
        tx = database.transaction(STORE_NAME, mode);
      } catch (error) {
        reject(storageError(error, action));
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(storageError(failure || tx.error, action));
      tx.onerror = () => {
      };
      const setResult = (value) => {
        result = value;
      };
      const abort = (error) => {
        failure = error;
        try {
          tx.abort();
        } catch {
          reject(storageError(error, action));
        }
      };
      try {
        run(tx.objectStore(STORE_NAME), setResult, abort);
      } catch (error) {
        abort(error);
      }
    });
  }
  async function listSavedSVGs() {
    return transaction("readonly", "open", (store, result, abort) => {
      const request = store.getAll();
      request.onsuccess = () => {
        try {
          result(request.result.filter(validRecord).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SAVED_SVGS).map(metadata));
        } catch (error) {
          abort(error);
        }
      };
    });
  }
  async function getSavedSVG(id) {
    if (typeof id !== "string" || !id || id.length > 128) return null;
    return transaction("readonly", "open", (store, result, abort) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          result(validRecord(request.result) ? fullRecord(request.result) : null);
        } catch (error) {
          abort(error);
        }
      };
    });
  }
  async function saveSVG(input) {
    const entry = checkedInput(input);
    return transaction("readwrite", "save", (store, result, abort) => {
      const request = store.getAll();
      request.onsuccess = () => {
        try {
          const records = request.result.filter(validRecord);
          const matching = records.find((record3) => record3.source === entry.source);
          const ids = new Set(request.result.map((record3) => record3.id));
          let id = matching?.id;
          while (!id || !matching && ids.has(id)) id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${fallbackId++}`;
          const lastTime = Math.max(0, ...records.map((record3) => record3.updatedAt));
          const updatedAt = Math.max(Date.now(), lastTime < Number.MAX_SAFE_INTEGER ? lastTime + 1 : 0);
          const saved = { id, ...entry, updatedAt };
          store.put(saved);
          const retained = [saved, ...records.filter((record3) => record3.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt);
          const keep = new Set(retained.slice(0, MAX_SAVED_SVGS).map((record3) => record3.id));
          for (const record3 of request.result) if (!keep.has(record3.id)) store.delete(record3.id);
          result(fullRecord(saved));
        } catch (error) {
          abort(error);
        }
      };
    });
  }
  async function deleteSavedSVG(id) {
    if (typeof id !== "string" || !id || id.length > 128) return false;
    return transaction("readwrite", "delete", (store, result) => {
      const request = store.getKey(id);
      request.onsuccess = () => {
        result(request.result !== void 0);
        store.delete(id);
      };
    });
  }

  // svg-placement.js
  var IDENTITY = [1, 0, 0, 1];
  var OPERATIONS = {
    left: [0, -1, 1, 0],
    right: [0, 1, -1, 0],
    mirrorX: [-1, 0, 0, 1],
    mirrorY: [1, 0, 0, -1]
  };
  function normalizeOrientation(value) {
    if (!Array.isArray(value) || value.length !== 4 || !value.every((number) => Number.isInteger(number) && Math.abs(number) <= 1)) return [...IDENTITY];
    const [a, b, c, d] = value;
    if (a * a + b * b !== 1 || c * c + d * d !== 1 || a * c + b * d !== 0) return [...IDENTITY];
    return value.map((number) => number === 0 ? 0 : number);
  }
  function transformOrientation(current, action) {
    if (action === "reset") return [...IDENTITY];
    const operation = OPERATIONS[action];
    if (!operation) throw new RangeError("Unknown artwork orientation action.");
    const [a, b, c, d] = normalizeOrientation(current), [oa, ob, oc, od] = operation;
    return normalizeOrientation([
      oa * a + oc * b,
      ob * a + od * b,
      oa * c + oc * d,
      ob * c + od * d
    ]);
  }
  function placementTransform(matrix) {
    return `translate(200 200) matrix(${normalizeOrientation(matrix).join(" ")} 0 0) translate(-200 -200)`;
  }
  function drawPlacedArtwork(context, image, matrix) {
    const [a, b, c, d] = normalizeOrientation(matrix);
    context.save();
    try {
      context.translate(200, 200);
      context.transform(a, b, c, d, 0, 0);
      context.translate(-200, -200);
      context.drawImage(image, 0, 0, 400, 400);
    } finally {
      context.restore();
    }
  }

  // mesh.js
  var import_polygon_clipping3 = __toESM(require_polygon_clipping_umd(), 1);

  // contours.js
  var CONTOUR_SEGMENTS = [
    [],
    [[0, 3]],
    [[1, 0]],
    [[1, 3]],
    [[2, 1]],
    [[0, 3], [2, 1]],
    [[2, 0]],
    [[2, 3]],
    [[3, 2]],
    [[0, 2]],
    [[1, 0], [3, 2]],
    [[1, 2]],
    [[3, 1]],
    [[0, 1]],
    [[3, 0]],
    []
  ];
  function traceContours(alpha, n, threshold = 127.5) {
    if (!Number.isInteger(n) || n < 1 || n > 8192 || !alpha || alpha.length !== n * n || !(alpha instanceof Uint8Array || alpha instanceof Uint8ClampedArray)) {
      throw new RangeError("Alpha samples must be an n × n byte grid (up to 8192 pixels across).");
    }
    if (!Number.isFinite(threshold) || threshold <= 0 || threshold >= 255) throw new RangeError("The contour threshold must be between 0 and 255.");
    const iso = Number.isInteger(threshold) ? threshold - 1e-7 : threshold;
    const stride = n + 2;
    const samples = new Uint8Array(stride * stride);
    for (let y = 0; y < n; y++) samples.set(alpha.subarray(y * n, (y + 1) * n), (y + 1) * stride + 1);
    const next = /* @__PURE__ */ new Map(), points = /* @__PURE__ */ new Map();
    function vertex(edge, index, x2, y, a, b, c, d) {
      const key = edge === 0 ? index * 2 : edge === 1 ? (index + 1) * 2 + 1 : edge === 2 ? (index + stride) * 2 : index * 2 + 1;
      if (!points.has(key)) {
        const point = edge === 0 ? [x2 - 0.5 + (iso - a) / (b - a), y - 0.5] : edge === 1 ? [x2 + 0.5, y - 0.5 + (iso - b) / (c - b)] : edge === 2 ? [x2 - 0.5 + (iso - d) / (c - d), y + 0.5] : [x2 - 0.5, y - 0.5 + (iso - a) / (d - a)];
        points.set(key, point);
        if (points.size > 1e6) throw new RangeError("This outline has too much detail. Simplify the SVG before exporting.");
      }
      return key;
    }
    for (let y = 0; y <= n; y++) {
      let index = y * stride;
      for (let x2 = 0; x2 <= n; x2++, index++) {
        const a = samples[index], b = samples[index + 1], c = samples[index + stride + 1], d = samples[index + stride];
        const code = (a >= iso ? 1 : 0) | (b >= iso ? 2 : 0) | (c >= iso ? 4 : 0) | (d >= iso ? 8 : 0);
        for (const [from, to] of CONTOUR_SEGMENTS[code]) {
          next.set(vertex(from, index, x2, y, a, b, c, d), vertex(to, index, x2, y, a, b, c, d));
        }
      }
    }
    const rings = [];
    for (const start of next.keys()) {
      if (!next.has(start)) continue;
      const ring = [];
      let current = start;
      do {
        const following = next.get(current);
        if (following === void 0) throw new Error("The SVG outline could not be closed. Try simplifying its smallest details.");
        ring.push(points.get(current));
        next.delete(current);
        current = following;
      } while (current !== start);
      if (ring.length >= 3) rings.push(ring);
    }
    return rings;
  }
  function contourArea(ring) {
    let area3 = 0;
    for (let i2 = 0, j = ring.length - 1; i2 < ring.length; j = i2++) area3 += ring[j][0] * ring[i2][1] - ring[i2][0] * ring[j][1];
    return area3 / 2;
  }
  function pointSegmentDistanceSquared(point, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length)) : 0;
    const x2 = point[0] - a[0] - t * dx, y = point[1] - a[1] - t * dy;
    return x2 * x2 + y * y;
  }
  function simplifyRing(ring, tolerance) {
    if (!Array.isArray(ring) || ring.length < 3 || ring.some((point) => !Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
      throw new RangeError("A contour must contain at least three finite points.");
    }
    if (!Number.isFinite(tolerance) || tolerance < 0) throw new RangeError("Contour tolerance must be nonnegative.");
    if (!tolerance || ring.length === 3) return ring.map((point) => [point[0], point[1]]);
    let anchor = 0;
    for (let i2 = 1; i2 < ring.length; i2++) if (ring[i2][0] < ring[anchor][0] || ring[i2][0] === ring[anchor][0] && ring[i2][1] < ring[anchor][1]) anchor = i2;
    const ordered = Array.from({ length: ring.length + 1 }, (_, i2) => ring[(anchor + i2) % ring.length]);
    let opposite = 1, distance2 = 0;
    for (let i2 = 1; i2 < ring.length; i2++) {
      const dx = ordered[i2][0] - ordered[0][0], dy = ordered[i2][1] - ordered[0][1], candidate = dx * dx + dy * dy;
      if (candidate > distance2) {
        distance2 = candidate;
        opposite = i2;
      }
    }
    const keep = new Uint8Array(ordered.length);
    keep[0] = keep[opposite] = keep[ring.length] = 1;
    const stack = [0, opposite, opposite, ring.length], limit = tolerance * tolerance;
    while (stack.length) {
      const end = stack.pop(), start = stack.pop();
      let maximum = limit, farthest = -1;
      for (let i2 = start + 1; i2 < end; i2++) {
        const candidate = pointSegmentDistanceSquared(ordered[i2], ordered[start], ordered[end]);
        if (candidate > maximum) {
          maximum = candidate;
          farthest = i2;
        }
      }
      if (farthest >= 0) {
        keep[farthest] = 1;
        stack.push(start, farthest, farthest, end);
      }
    }
    const simplified = [];
    for (let i2 = 0; i2 < ring.length; i2++) if (keep[i2]) simplified.push([ordered[i2][0], ordered[i2][1]]);
    if (simplified.length < 3 || contourArea(simplified) * contourArea(ring) <= 0) return ring.map((point) => [point[0], point[1]]);
    return simplified;
  }

  // node_modules/earcut/src/earcut.js
  var steiners = /* @__PURE__ */ new Set();
  var filteredOut = false;
  function earcut(data, holeIndices, dim = 2) {
    const hasHoles = holeIndices && holeIndices.length;
    const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
    if (steiners.size) steiners.clear();
    let outerNode = linkedList(data, 0, outerLen, dim, true);
    const triangles = [];
    if (!outerNode || outerNode.next === outerNode.prev) return triangles;
    let minX = 0, minY = 0, invSize = 0;
    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
    if (data.length > 80 * dim) {
      minX = data[0];
      minY = data[1];
      let maxX = minX;
      let maxY = minY;
      for (let i2 = dim; i2 < outerLen; i2 += dim) {
        const x2 = data[i2];
        const y = data[i2 + 1];
        if (x2 < minX) minX = x2;
        if (y < minY) minY = y;
        if (x2 > maxX) maxX = x2;
        if (y > maxY) maxY = y;
      }
      invSize = Math.max(maxX - minX, maxY - minY);
      invSize = invSize !== 0 ? 32767 / invSize : 0;
    }
    earcutLinked(outerNode, triangles, minX, minY, invSize);
    return triangles;
  }
  function linkedList(data, start, end, dim, clockwise) {
    let last = null;
    if (clockwise === signedArea(data, start, end, dim) > 0) {
      for (let i2 = start; i2 < end; i2 += dim) last = insertNode(i2 / dim | 0, data[i2], data[i2 + 1], last);
    } else {
      for (let i2 = end - dim; i2 >= start; i2 -= dim) last = insertNode(i2 / dim | 0, data[i2], data[i2 + 1], last);
    }
    if (last && equals(last, last.next)) {
      removeNode(last);
      last = last.next;
    }
    return last;
  }
  function filterPoints(start, end = start) {
    const full = end === start;
    let p = start, again;
    do {
      again = false;
      if (p !== p.next && (steiners.size === 0 || !steiners.has(p)) && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
        if (full || p === end) end = p.prev;
        filteredOut = true;
        removeNode(p);
        p = p.prev;
        again = true;
      } else if (full || p !== end) {
        p = p.next;
        again = !full;
      }
    } while (again || p !== end);
    return end;
  }
  function earcutLinked(ear, triangles, minX, minY, invSize) {
    if (invSize) indexCurve(ear, minX, minY, invSize);
    let stop = ear, cured = false;
    while (ear.prev !== ear.next) {
      const prev = ear.prev;
      const next = ear.next;
      if (area(prev, ear, next) < 0 && (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear))) {
        triangles.push(prev.i, ear.i, next.i);
        removeNode(ear);
        ear = next;
        stop = next;
        continue;
      }
      ear = next;
      if (ear === stop) {
        filteredOut = false;
        ear = filterPoints(ear);
        if (filteredOut) {
          stop = ear;
          continue;
        }
        if (!cured) {
          ear = cureLocalIntersections(ear, triangles);
          stop = ear;
          cured = true;
          continue;
        }
        splitEarcut(ear, triangles, minX, minY, invSize);
        break;
      }
    }
  }
  function isEar(ear) {
    const a = ear.prev, b = ear, c = ear.next, ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y, x0 = Math.min(ax, bx, cx), y0 = Math.min(ay, by, cy), x1 = Math.max(ax, bx, cx), y1 = Math.max(ay, by, cy);
    let p = c.next;
    while (p !== a) {
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && !(ax === p.x && ay === p.y) && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
      p = p.next;
    }
    return true;
  }
  function isEarHashed(ear, minX, minY, invSize) {
    const a = ear.prev, b = ear, c = ear.next, ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y, x0 = Math.min(ax, bx, cx), y0 = Math.min(ay, by, cy), x1 = Math.max(ax, bx, cx), y1 = Math.max(ay, by, cy), minZ = zOrder(x0, y0, minX, minY, invSize), maxZ = zOrder(x1, y1, minX, minY, invSize);
    let p = ear.prevZ;
    while (p && p.z >= minZ) {
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== c && !(ax === p.x && ay === p.y) && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
      p = p.prevZ;
    }
    let n = ear.nextZ;
    while (n && n.z <= maxZ) {
      if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== c && !(ax === n.x && ay === n.y) && pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
      n = n.nextZ;
    }
    return true;
  }
  function cureLocalIntersections(start, triangles) {
    let p = start;
    let cured = false;
    do {
      const a = p.prev, b = p.next.next;
      if (intersects(a, p, p.next, b, false) && locallyInside(a, b) && locallyInside(b, a)) {
        triangles.push(a.i, p.i, b.i);
        removeNode(p);
        removeNode(p.next);
        p = start = b;
        cured = true;
      }
      p = p.next;
    } while (p !== start);
    return cured ? filterPoints(p) : p;
  }
  function splitEarcut(start, triangles, minX, minY, invSize) {
    let a = start;
    do {
      let b = a.next.next;
      while (b !== a.prev) {
        if (a.i !== b.i && isValidDiagonal(a, b)) {
          let c = splitPolygon(a, b);
          a = filterPoints(a, a.next);
          c = filterPoints(c, c.next);
          earcutLinked(a, triangles, minX, minY, invSize);
          earcutLinked(c, triangles, minX, minY, invSize);
          return;
        }
        b = b.next;
      }
      a = a.next;
    } while (a !== start);
  }
  var indexActive = false;
  function eliminateHoles(data, holeIndices, outerNode, dim) {
    const queue = [];
    for (let i2 = 0, len = holeIndices.length; i2 < len; i2++) {
      const start = holeIndices[i2] * dim;
      const end = i2 < len - 1 ? holeIndices[i2 + 1] * dim : data.length;
      const list = (
        /** @type {Node} */
        linkedList(data, start, end, dim, false)
      );
      if (list === list.next) steiners.add(list);
      queue.push(getLeftmost(list));
    }
    queue.sort(compareXYSlope);
    buildBlockIndex(data.length / dim, holeIndices.length);
    indexSegment(outerNode, outerNode);
    indexActive = true;
    for (let i2 = 0; i2 < queue.length; i2++) {
      outerNode = eliminateHole(queue[i2], outerNode);
    }
    indexActive = false;
    return filterPoints(outerNode);
  }
  function compareXYSlope(a, b) {
    return a.x - b.x || a.y - b.y || (a.next.y - a.y) / (a.next.x - a.x) - (b.next.y - b.y) / (b.next.x - b.x);
  }
  function eliminateHole(hole, outerNode) {
    const bridge = findHoleBridge(hole, outerNode);
    if (!bridge) {
      return outerNode;
    }
    const bridgeReverse = splitPolygon(bridge, hole);
    const bridge2 = bridgeReverse.next;
    indexSegment(bridge, bridge2.next);
    filterPoints(bridgeReverse, bridgeReverse.next);
    return filterPoints(bridge, bridge.next);
  }
  var K = 16;
  var blockBBox = new Float64Array(0);
  var numBlocks = 0;
  var blockHead = [];
  var blockStop = [];
  function buildBlockIndex(maxNodes, numHoles) {
    const maxBlocks = Math.ceil((maxNodes + 2 * numHoles) / K) + numHoles + 2;
    if (blockBBox.length < maxBlocks * 4) blockBBox = new Float64Array(maxBlocks * 4);
    numBlocks = 0;
  }
  function indexSegment(head, stop) {
    let p = head;
    do {
      const b = numBlocks++;
      blockHead[b] = p;
      let minX = p.x, minY = p.y, maxX = p.x, maxY = p.y;
      let k = 0;
      do {
        const c = p.next;
        p.z = b;
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
        p = c;
      } while (++k < K && p !== stop);
      blockStop[b] = p;
      const g = b * 4;
      blockBBox[g] = minX;
      blockBBox[g + 1] = minY;
      blockBBox[g + 2] = maxX;
      blockBBox[g + 3] = maxY;
    } while (p !== stop);
  }
  function growBlock(head, tail) {
    const g = head.z * 4;
    if (tail.x < blockBBox[g]) blockBBox[g] = tail.x;
    if (tail.y < blockBBox[g + 1]) blockBBox[g + 1] = tail.y;
    if (tail.x > blockBBox[g + 2]) blockBBox[g + 2] = tail.x;
    if (tail.y > blockBBox[g + 3]) blockBBox[g + 3] = tail.y;
  }
  function liveBlockStop(b) {
    let stop = blockStop[b];
    while (stop.prev.next !== stop) stop = stop.next;
    blockStop[b] = stop;
    return stop;
  }
  function liveBlockHead(b) {
    let head = blockHead[b];
    while (head.prev.next !== head) head = head.next;
    blockHead[b] = head;
    return head;
  }
  function findHoleBridge(hole, outerNode) {
    let p = outerNode;
    const hx = hole.x;
    const hy = hole.y;
    let qx = -Infinity;
    let m;
    if (equals(hole, p)) return p;
    for (let b = 0, g = 0; b < numBlocks; b++, g += 4) {
      if (hy < blockBBox[g + 1] || hy > blockBBox[g + 3] || blockBBox[g] > hx || blockBBox[g + 2] <= qx) continue;
      const stop = liveBlockStop(b);
      p = liveBlockHead(b);
      do {
        if (p.prev.next === p) {
          if (equals(hole, p.next)) return p.next;
          else if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            const x2 = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x2 <= hx && x2 > qx) {
              qx = x2;
              m = p.x < p.next.x ? p : p.next;
              if (x2 === hx) return m;
            }
          }
        }
        p = p.next;
      } while (p !== stop);
    }
    if (!m) return null;
    const mx = m.x;
    const my = m.y;
    const tminY = Math.min(hy, my);
    const tmaxY = Math.max(hy, my);
    let tanMin = Infinity;
    for (let b = 0, g = 0; b < numBlocks; b++, g += 4) {
      if (blockBBox[g + 2] < mx || blockBBox[g] > hx || blockBBox[g + 3] < tminY || blockBBox[g + 1] > tmaxY) continue;
      const stop = liveBlockStop(b);
      p = liveBlockHead(b);
      do {
        if (p.prev.next === p && hx >= p.x && p.x >= mx && hx !== p.x && // skip dead nodes
        pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
          const tan = Math.abs(hy - p.y) / (hx - p.x);
          if ((locallyInside(p, hole) || p.y === hy && p.next.y === hy && p.next.x > hx) && (tan < tanMin || tan === tanMin && (p.x > m.x || p.x === m.x && sectorContainsSector(m, p)))) {
            m = p;
            tanMin = tan;
          }
        }
        p = p.next;
      } while (p !== stop);
    }
    return m;
  }
  function sectorContainsSector(m, p) {
    return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
  }
  var sortArr = [];
  var sortBuf = [];
  var zArr = new Uint32Array(0);
  var zBuf = new Uint32Array(0);
  var counts = new Uint32Array(256);
  function indexCurve(start, minX, minY, invSize) {
    let p = start;
    let n = 0;
    do {
      p.z = zOrder(p.x, p.y, minX, minY, invSize);
      sortArr[n++] = p;
      p = p.next;
    } while (p !== start);
    sortNodes(n);
    let prev = null;
    for (let i2 = 0; i2 < n; i2++) {
      const node = sortArr[i2];
      node.prevZ = prev;
      if (prev) prev.nextZ = node;
      prev = node;
    }
    prev.nextZ = null;
    sortArr.fill(
      /** @type {Node} */
      /** @type {unknown} */
      null,
      0,
      n
    );
    sortBuf.fill(
      /** @type {Node} */
      /** @type {unknown} */
      null,
      0,
      n
    );
  }
  function sortNodes(n) {
    if (n <= 32) {
      for (let i2 = 1; i2 < n; i2++) {
        const node = sortArr[i2], z = node.z;
        let j = i2 - 1;
        while (j >= 0 && sortArr[j].z > z) {
          sortArr[j + 1] = sortArr[j];
          j--;
        }
        sortArr[j + 1] = node;
      }
      return;
    }
    if (zArr.length < n) {
      zArr = new Uint32Array(n);
      zBuf = new Uint32Array(n);
      sortBuf = new Array(n);
    }
    for (let i2 = 0; i2 < n; i2++) zArr[i2] = sortArr[i2].z;
    radixPass(n, sortArr, zArr, sortBuf, zBuf, 0);
    radixPass(n, sortBuf, zBuf, sortArr, zArr, 8);
    radixPass(n, sortArr, zArr, sortBuf, zBuf, 16);
    radixPass(n, sortBuf, zBuf, sortArr, zArr, 24);
  }
  function radixPass(n, src, srcZ, dst, dstZ, shift) {
    counts.fill(0);
    for (let i2 = 0; i2 < n; i2++) counts[srcZ[i2] >>> shift & 255]++;
    let sum = 0;
    for (let b = 0; b < 256; b++) {
      const c = counts[b];
      counts[b] = sum;
      sum += c;
    }
    for (let i2 = 0; i2 < n; i2++) {
      const z = srcZ[i2];
      const pos = counts[z >>> shift & 255]++;
      dst[pos] = src[i2];
      dstZ[pos] = z;
    }
  }
  function zOrder(x2, y, minX, minY, invSize) {
    x2 = (x2 - minX) * invSize | 0;
    y = (y - minY) * invSize | 0;
    x2 = (x2 | x2 << 8) & 16711935;
    x2 = (x2 | x2 << 4) & 252645135;
    x2 = (x2 | x2 << 2) & 858993459;
    x2 = (x2 | x2 << 1) & 1431655765;
    y = (y | y << 8) & 16711935;
    y = (y | y << 4) & 252645135;
    y = (y | y << 2) & 858993459;
    y = (y | y << 1) & 1431655765;
    return x2 | y << 1;
  }
  function getLeftmost(start) {
    let p = start, leftmost = start;
    do {
      if (p.x < leftmost.x || p.x === leftmost.x && p.y < leftmost.y) leftmost = p;
      p = p.next;
    } while (p !== start);
    return leftmost;
  }
  function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) >= (ax - px) * (cy - py) && (ax - px) * (by - py) >= (bx - px) * (ay - py) && (bx - px) * (cy - py) >= (cx - px) * (by - py);
  }
  function isValidDiagonal(a, b) {
    const zeroLength = equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0;
    return a.next.i !== b.i && (zeroLength || locallyInside(a, b) && locallyInside(b, a) && // // locally visible
    (area(a.prev, a, b.prev) !== 0 || area(a, b.prev, b) !== 0)) && // no opposite-facing sectors
    !intersectsPolygon(a, b) && (zeroLength || middleInside(a, b));
  }
  function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }
  function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
  }
  function intersects(p1, q1, p2, q2, includeBoundary = true) {
    const o1 = area(p1, q1, p2);
    const o2 = area(p1, q1, q2);
    const o3 = area(p2, q2, p1);
    const o4 = area(p2, q2, q1);
    if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) && (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) return true;
    if (!includeBoundary) return false;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
  }
  function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
  }
  function intersectsPolygon(a, b) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    let p = a;
    do {
      const n = p.next;
      if (p.x > maxX && n.x > maxX || p.x < minX && n.x < minX || p.y > maxY && n.y > maxY || p.y < minY && n.y < minY) {
        p = n;
        continue;
      }
      if (p.i !== a.i && n.i !== a.i && p.i !== b.i && n.i !== b.i && intersects(p, n, a, b)) return true;
      p = n;
    } while (p !== a);
    return false;
  }
  function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
  }
  function middleInside(a, b) {
    let p = a;
    let inside = false;
    const px = (a.x + b.x) / 2;
    const py = (a.y + b.y) / 2;
    do {
      const n = p.next;
      if (p.y > py !== n.y > py && px < (n.x - p.x) * (py - p.y) / (n.y - p.y) + p.x)
        inside = !inside;
      p = n;
    } while (p !== a);
    return inside;
  }
  function splitPolygon(a, b) {
    const a2 = createNode(a.i, a.x, a.y), b2 = createNode(b.i, b.x, b.y), an = a.next, bp = b.prev;
    a.next = b;
    b.prev = a;
    a2.next = an;
    an.prev = a2;
    b2.next = a2;
    a2.prev = b2;
    bp.next = b2;
    b2.prev = bp;
    return b2;
  }
  function insertNode(i2, x2, y, last) {
    const p = createNode(i2, x2, y);
    if (!last) {
      p.prev = p;
      p.next = p;
    } else {
      p.next = last.next;
      p.prev = last;
      last.next.prev = p;
      last.next = p;
    }
    return p;
  }
  function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;
    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    if (indexActive) growBlock(p.prev, p.next);
  }
  function createNode(i2, x2, y) {
    return (
      /** @type {Node} */
      /** @type {unknown} */
      {
        i: i2,
        // vertex index in coordinates array
        x: x2,
        y,
        // vertex coordinates
        prev: null,
        // previous and next vertex nodes in a polygon ring
        next: null,
        z: 0,
        // z-order curve value; doubles as owning block in the hole-bridge index during eliminateHoles
        prevZ: null,
        // previous and next nodes in z-order
        nextZ: null
      }
    );
  }
  function signedArea(data, start, end, dim) {
    let sum = 0;
    for (let i2 = start, j = end - dim; i2 < end; i2 += dim) {
      sum += (data[j] - data[i2]) * (data[i2 + 1] + data[j + 1]);
      j = i2;
    }
    return sum;
  }

  // mesh-extrusion.js
  var import_polygon_clipping = __toESM(require_polygon_clipping_umd(), 1);
  var SNAP = 1e5;
  var SEAM_EPSILON = 5e-5;
  var coordinate = (value) => Math.fround(Math.round(value * SNAP) / SNAP);
  var ringArea = (ring) => ring.reduce((sum, p, i2) => {
    const q = ring[(i2 + 1) % ring.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;
  function normalize(polygons) {
    if (!Array.isArray(polygons)) throw new TypeError("Layer geometry must be a MultiPolygon.");
    const result = [];
    for (const polygon of polygons) {
      if (!Array.isArray(polygon)) throw new TypeError("Invalid polygon.");
      const rings = [];
      for (let r = 0; r < polygon.length; r++) {
        if (!Array.isArray(polygon[r])) throw new TypeError("Invalid polygon ring.");
        const ring = [];
        for (const point of polygon[r]) {
          if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) throw new RangeError("Polygon coordinates must be finite.");
          const p = [coordinate(point[0]), coordinate(point[1])], last = ring.at(-1);
          if (!last || last[0] !== p[0] || last[1] !== p[1]) ring.push(p);
        }
        if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
        if (ring.length < 3 || Math.abs(ringArea(ring)) < 1e-10) {
          if (r === 0) break;
          continue;
        }
        if (ringArea(ring) > 0 !== (r === 0)) ring.reverse();
        rings.push(ring);
      }
      if (rings.length) result.push(rings);
    }
    return result;
  }
  function pointTree(points, depth = 0) {
    if (!points.length) return null;
    const axis = depth % 2;
    points.sort((a, b) => a[axis] - b[axis]);
    const middle = points.length >> 1, point = points[middle];
    const left = pointTree(points.slice(0, middle), depth + 1), right = pointTree(points.slice(middle + 1), depth + 1);
    return {
      point,
      left,
      right,
      minX: Math.min(point[0], left?.minX ?? Infinity, right?.minX ?? Infinity),
      minY: Math.min(point[1], left?.minY ?? Infinity, right?.minY ?? Infinity),
      maxX: Math.max(point[0], left?.maxX ?? -Infinity, right?.maxX ?? -Infinity),
      maxY: Math.max(point[1], left?.maxY ?? -Infinity, right?.maxY ?? -Infinity)
    };
  }
  function segmentInBox(a, b, node) {
    let low = 0, high = 1;
    for (let axis = 0; axis < 2; axis++) {
      const min = (axis ? node.minY : node.minX) - SEAM_EPSILON, max = (axis ? node.maxY : node.maxX) + SEAM_EPSILON;
      const direction = b[axis] - a[axis];
      if (Math.abs(direction) < 1e-15) {
        if (a[axis] < min || a[axis] > max) return false;
      } else {
        const t1 = (min - a[axis]) / direction, t2 = (max - a[axis]) / direction;
        low = Math.max(low, Math.min(t1, t2));
        high = Math.min(high, Math.max(t1, t2));
        if (low > high) return false;
      }
    }
    return true;
  }
  function pointsOnSegment(tree, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], length2 = dx * dx + dy * dy, result = [];
    if (length2 < SEAM_EPSILON * SEAM_EPSILON) return result;
    function visit(node) {
      if (!node || !segmentInBox(a, b, node)) return;
      const p = node.point, t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2;
      if (t > 1e-9 && t < 1 - 1e-9) {
        const cross2 = dx * (p[1] - a[1]) - dy * (p[0] - a[0]);
        if (cross2 * cross2 <= SEAM_EPSILON * SEAM_EPSILON * length2) result.push([t, p]);
      }
      visit(node.left);
      visit(node.right);
    }
    visit(tree);
    result.sort((a2, b2) => a2[0] - b2[0]);
    return result.map((item) => item[1]);
  }
  function cross(a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  }
  function extrudeLayers(input) {
    if (!Array.isArray(input) || !input.length) throw new RangeError("At least one mesh layer is required.");
    let previous = 0;
    const layers = input.map((layer) => {
      if (!Number.isFinite(layer.height) || layer.height <= previous) throw new RangeError("Layer heights must be positive and increasing.");
      previous = layer.height;
      return { height: Math.fround(layer.height), polygons: normalize(layer.polygons) };
    });
    if (!layers[0].polygons.length) throw new RangeError("The clock face has no printable area.");
    const vertices = [], vertexIds = /* @__PURE__ */ new Map(), xyPoints = /* @__PURE__ */ new Map(), xyCells = /* @__PURE__ */ new Map(), triangles = [];
    function canonicalXY(x2, y) {
      x2 = coordinate(x2);
      y = coordinate(y);
      const cellX = Math.floor(x2 / SEAM_EPSILON), cellY = Math.floor(y / SEAM_EPSILON);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const point2 of xyCells.get(`${cellX + dx},${cellY + dy}`) || []) {
        if (Math.hypot(point2[0] - x2, point2[1] - y) <= SEAM_EPSILON) return point2;
      }
      const point = [x2, y], key = `${cellX},${cellY}`;
      if (!xyCells.has(key)) xyCells.set(key, []);
      xyCells.get(key).push(point);
      xyPoints.set(`${x2},${y}`, point);
      return point;
    }
    function vertex(x2, y, z) {
      [x2, y] = canonicalXY(x2, y);
      z = Math.fround(z);
      const key = `${x2},${y},${z}`;
      if (vertexIds.has(key)) return vertexIds.get(key);
      const id = vertices.length;
      vertices.push([x2, y, z]);
      vertexIds.set(key, id);
      return id;
    }
    function triangle(a, b, c) {
      if (a === b || b === c || c === a) return;
      const n = cross(vertices[a], vertices[b], vertices[c]);
      if (Math.hypot(...n) > 1e-12) triangles.push(a, b, c);
    }
    function cap(polygons, z, up) {
      for (const polygon of polygons) {
        const flat = [], holes = [], ids = [];
        polygon.forEach((ring, index) => {
          const ringIds = [];
          for (const p of ring) {
            const id = vertex(p[0], p[1], z);
            if (ringIds.at(-1) !== id) ringIds.push(id);
          }
          if (ringIds.length > 1 && ringIds[0] === ringIds.at(-1)) ringIds.pop();
          if (ringIds.length < 3) return;
          if (index) holes.push(ids.length);
          for (const id of ringIds) {
            const p = vertices[id];
            flat.push(p[0], p[1]);
            ids.push(id);
          }
        });
        const indices = earcut(flat, holes, 2);
        for (let i2 = 0; i2 < indices.length; i2 += 3) {
          let a = ids[indices[i2]], b = ids[indices[i2 + 1]], c = ids[indices[i2 + 2]];
          if (cross(vertices[a], vertices[b], vertices[c])[2] > 0 !== up) [b, c] = [c, b];
          triangle(a, b, c);
        }
      }
    }
    cap(layers[0].polygons, 0, false);
    for (let i2 = 0; i2 < layers.length; i2++) {
      const { polygons, height } = layers[i2], low = i2 ? layers[i2 - 1].height : 0, next = layers[i2 + 1]?.polygons;
      const exposed = next?.length ? normalize(import_polygon_clipping.default.difference(polygons, next)) : polygons;
      cap(exposed, height, true);
      for (const polygon of polygons) for (const ring of polygon) for (let j = 0; j < ring.length; j++) {
        const a = ring[j], b = ring[(j + 1) % ring.length];
        const al = vertex(a[0], a[1], low), bl = vertex(b[0], b[1], low), ah = vertex(a[0], a[1], height), bh = vertex(b[0], b[1], height);
        triangle(al, bl, bh);
        triangle(al, bh, ah);
      }
    }
    const tree = pointTree([...xyPoints.values()]), splitCache = /* @__PURE__ */ new Map(), repaired = [];
    function splits(a, b) {
      const pa = vertices[a], pb = vertices[b];
      if (pa[2] !== pb[2]) return [];
      const aKey = `${pa[0]},${pa[1]}`, bKey = `${pb[0]},${pb[1]}`, forward = aKey < bKey;
      const key = forward ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
      if (!splitCache.has(key)) splitCache.set(key, pointsOnSegment(tree, forward ? pa : pb, forward ? pb : pa));
      const points = splitCache.get(key), ordered = forward ? points : [...points].reverse();
      return ordered.map((p) => vertex(p[0], p[1], pa[2]));
    }
    function repairedTriangle(a, b, c) {
      if (a === b || b === c || c === a) return;
      const n = cross(vertices[a], vertices[b], vertices[c]);
      if (Math.hypot(...n) > 1e-12) repaired.push(a, b, c);
    }
    for (let i2 = 0; i2 < triangles.length; i2 += 3) {
      const a = triangles[i2], b = triangles[i2 + 1], c = triangles[i2 + 2], ab = splits(a, b), bc = splits(b, c), ca = splits(c, a);
      const changed = Number(ab.length > 0) + Number(bc.length > 0) + Number(ca.length > 0);
      if (!changed) {
        repairedTriangle(a, b, c);
        continue;
      }
      if (changed === 1) {
        const edge = ab.length ? [a, ...ab, b] : bc.length ? [b, ...bc, c] : [c, ...ca, a];
        const opposite = ab.length ? c : bc.length ? a : b;
        for (let j = 0; j < edge.length - 1; j++) repairedTriangle(opposite, edge[j], edge[j + 1]);
      } else {
        const p = vertices[a], q = vertices[b], r = vertices[c];
        const center = vertex((p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3, (p[2] + q[2] + r[2]) / 3);
        const boundary = [a, ...ab, b, ...bc, c, ...ca];
        for (let j = 0; j < boundary.length; j++) repairedTriangle(center, boundary[j], boundary[(j + 1) % boundary.length]);
      }
    }
    const triangleBuckets = /* @__PURE__ */ new Map(), removed = /* @__PURE__ */ new Set();
    for (let i2 = 0; i2 < repaired.length; i2 += 3) {
      const ids = repaired.slice(i2, i2 + 3), sorted = [...ids].sort((a, b) => a - b), key = sorted.join(",");
      const parity = (Number(ids[0] > ids[1]) + Number(ids[0] > ids[2]) + Number(ids[1] > ids[2])) % 2;
      if (!triangleBuckets.has(key)) triangleBuckets.set(key, [[], []]);
      const bucket = triangleBuckets.get(key);
      if (bucket[1 - parity].length) {
        removed.add(bucket[1 - parity].pop());
        removed.add(i2);
      } else bucket[parity].push(i2);
    }
    if (removed.size) {
      let target = 0;
      for (let i2 = 0; i2 < repaired.length; i2 += 3) if (!removed.has(i2)) {
        repaired[target++] = repaired[i2];
        repaired[target++] = repaired[i2 + 1];
        repaired[target++] = repaired[i2 + 2];
      }
      repaired.length = target;
    }
    const incidence = /* @__PURE__ */ new Map();
    const edgeKey = (a, b) => a < b ? `${a},${b}` : `${b},${a}`;
    function edgeIncidence(a, b) {
      const key = edgeKey(a, b);
      if (!incidence.has(key)) incidence.set(key, { forward: 0, reverse: 0 });
      return incidence.get(key);
    }
    for (let i2 = 0; i2 < repaired.length; i2 += 3) for (let j = 0; j < 3; j++) {
      const a = repaired[i2 + j], b = repaired[i2 + (j + 1) % 3], edge = edgeIncidence(a, b);
      edge[a < b ? "forward" : "reverse"]++;
    }
    const flaps = /* @__PURE__ */ new Set();
    for (let i2 = 0; i2 < repaired.length; i2 += 3) {
      const ids = repaired.slice(i2, i2 + 3), points = ids.map((id) => vertices[id]);
      if (points[0][2] !== points[1][2] || points[0][2] !== points[2][2]) continue;
      const normal = cross(...points), maxEdge = Math.max(...points.map((p, j) => Math.hypot(...p.map((value, k) => value - points[(j + 1) % 3][k]))));
      if (Math.hypot(...normal) / maxEdge > 0.02) continue;
      const edges = ids.map((a, j) => {
        const b = ids[(j + 1) % 3], edge = edgeIncidence(a, b), direction = a < b ? "forward" : "reverse";
        return { edge, direction, forward: edge.forward - (direction === "forward" ? 1 : 0), reverse: edge.reverse - (direction === "reverse" ? 1 : 0) };
      });
      if (!edges.every(({ forward, reverse }) => forward === 0 && reverse === 0 || forward === 1 && reverse === 1)) continue;
      flaps.add(i2);
      for (const { edge, direction } of edges) edge[direction]--;
    }
    if (flaps.size) {
      let target = 0;
      for (let i2 = 0; i2 < repaired.length; i2 += 3) if (!flaps.has(i2)) {
        repaired[target++] = repaired[i2];
        repaired[target++] = repaired[i2 + 1];
        repaired[target++] = repaired[i2 + 2];
      }
      repaired.length = target;
    }
    for (const edge of incidence.values()) if ((edge.forward !== 0 || edge.reverse !== 0) && (edge.forward !== 1 || edge.reverse !== 1)) {
      throw new Error("The artwork produced an unclosed surface. Try a simpler outline or a smooth texture.");
    }
    const count = repaired.length / 3, buffer = new ArrayBuffer(84 + count * 50), view2 = new DataView(buffer);
    new Uint8Array(buffer, 0, 80).set(new TextEncoder().encode("Clock Factory | smooth contour mesh | millimeters | flat side down"));
    view2.setUint32(80, count, true);
    for (let i2 = 0; i2 < count; i2++) {
      const a = vertices[repaired[i2 * 3]], b = vertices[repaired[i2 * 3 + 1]], c = vertices[repaired[i2 * 3 + 2]], n = cross(a, b, c), length = Math.hypot(...n);
      let offset = 84 + i2 * 50;
      for (const value of [n[0] / length, n[1] / length, n[2] / length, ...a, ...b, ...c]) {
        view2.setFloat32(offset, value, true);
        offset += 4;
      }
    }
    return buffer;
  }

  // hour-numerals.js
  var import_polygon_clipping2 = __toESM(require_polygon_clipping_umd(), 1);
  var snap = (value) => {
    const result = Math.round(value * 1e6) / 1e6;
    return result === 0 ? 0 : result;
  };
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  var geometryCache = /* @__PURE__ */ new Map();
  var wordCache = /* @__PURE__ */ new Map();
  function path(start, commands) {
    const points = [start];
    for (const command of commands) {
      if (command.length === 2) points.push(command);
      else {
        const [cx, cy, x2, y] = command, [ax, ay] = points.at(-1);
        for (let i2 = 1; i2 <= 10; i2++) {
          const t = i2 / 10, s = 1 - t;
          points.push([s * s * ax + 2 * s * t * cx + t * t * x2, s * s * ay + 2 * s * t * cy + t * t * y]);
        }
      }
    }
    return points;
  }
  function ellipse(cx, cy, rx2, ry2) {
    return Array.from({ length: 41 }, (_, i2) => {
      const angle = i2 / 40 * Math.PI * 2;
      return [cx + rx2 * Math.cos(angle), cy + ry2 * Math.sin(angle)];
    });
  }
  var SIX = path([5.1, 9.5], [[3.9, 10.7, 2.1, 9.5], [0.4, 8.2, 0.4, 4.1], [0.4, 0, 3, 0], [5.6, 0, 5.6, 3.1], [5.6, 6, 3, 6], [0.6, 6, 0.6, 3.1]]);
  var GLYPHS = {
    "0": { width: 6, paths: [ellipse(3, 5, 2.5, 5)] },
    "1": { width: 4, paths: [[[0.5, 8.4], [2, 10], [2, 0]], [[0.5, 0], [3.5, 0]]] },
    "2": { width: 6, paths: [path([0.5, 8], [[0.6, 10, 3, 10], [5.5, 10, 5.5, 7.8], [5.5, 6.3, 3.2, 4.3], [0.5, 0], [5.7, 0]])] },
    "3": { width: 6, paths: [path([0.6, 9], [[1.6, 10, 3.1, 10], [5.5, 10, 5.5, 7.6], [5.5, 5.2, 3, 5], [5.6, 5, 5.6, 2.5], [5.6, 0, 3.1, 0], [1.5, 0, 0.5, 1]])] },
    "4": { width: 6, paths: [[[4.7, 0], [4.7, 10], [0.4, 3.7], [5.9, 3.7]]] },
    "5": { width: 6, paths: [path([5.5, 10], [[0.6, 10], [0.6, 5.5], [3.3, 6.6, 4.9, 5], [6, 3.6, 5.3, 1.8], [4.5, -0.9, 2.2, 0.1], [1.2, 0.4, 0.5, 1.1]])] },
    "6": { width: 6, paths: [SIX] },
    "7": { width: 6, paths: [[[0.3, 10], [5.7, 10], [1.5, 0]]] },
    "8": { width: 6, paths: [ellipse(3, 7.5, 2.3, 2.5), ellipse(3, 2.5, 2.6, 2.5)] },
    "9": { width: 6, paths: [SIX.map(([x2, y]) => [6 - x2, 10 - y])] },
    I: { width: 1.4, paths: [[[0.7, 0], [0.7, 10]]] },
    V: { width: 6, paths: [[[0.2, 10], [3, 0], [5.8, 10]]] },
    X: { width: 6, paths: [[[0.2, 10], [5.8, 0]], [[0.2, 0], [5.8, 10]]] }
  };
  function bounded(value, min, max, fallback) {
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }
  function configuration(settings) {
    const diameter = bounded(settings?.diameter, 20, 1e3, 200);
    const style = settings?.hourStyle === "roman" ? "roman" : settings?.hourStyle === "arabic" ? "arabic" : null;
    return { diameter, style, size: bounded(settings?.numberSize, 70, 130, 100), position: bounded(settings?.numberPosition, 80, 120, 100) };
  }
  function capsule(a, b, radius) {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]), ring = [];
    for (let i2 = 0; i2 <= 12; i2++) {
      const t = angle - Math.PI / 2 + i2 * Math.PI / 12;
      ring.push([snap(b[0] + radius * Math.cos(t)), snap(b[1] + radius * Math.sin(t))]);
    }
    for (let i2 = 0; i2 <= 12; i2++) {
      const t = angle + Math.PI / 2 + i2 * Math.PI / 12;
      ring.push([snap(a[0] + radius * Math.cos(t)), snap(a[1] + radius * Math.sin(t))]);
    }
    ring.push(ring[0]);
    return [ring];
  }
  function strokeWordPolygons(text, height, centerX, centerY, padding) {
    const stroke = 1.4, scale = height / (10 + stroke), radius = stroke * scale / 2 + padding;
    const advance = 1.25;
    const width = [...text].reduce((sum, letter) => sum + GLYPHS[letter].width + advance, 0) - advance;
    let offset = -width / 2;
    const strokes = [];
    for (const letter of text) {
      const glyph = GLYPHS[letter];
      for (const points of glyph.paths) for (let i2 = 1; i2 < points.length; i2++) {
        const a = [centerX + (points[i2 - 1][0] + offset) * scale, centerY + (points[i2 - 1][1] - 5) * scale];
        const b = [centerX + (points[i2][0] + offset) * scale, centerY + (points[i2][1] - 5) * scale];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-9) strokes.push(capsule(a, b, radius));
      }
      offset += glyph.width + advance;
    }
    return import_polygon_clipping2.default.union(...strokes);
  }
  function numberPolygons(text, height, centerX, centerY, padding) {
    if (padding) return strokeWordPolygons(text, height, centerX, centerY, padding);
    if (!wordCache.has(text)) wordCache.set(text, strokeWordPolygons(text, 11.4, 0, 0, 0));
    const scale = height / 11.4;
    return wordCache.get(text).map((polygon) => polygon.map((ring) => ring.map(([x2, y]) => [snap(centerX + x2 * scale), snap(centerY + y * scale)])));
  }
  function hourNumeralLabels(settings, padding = 0) {
    const { diameter, style, size, position } = configuration(settings);
    if (!style) return [];
    if (!Number.isFinite(padding) || padding < 0 || padding > 5) throw new RangeError("Hour numeral padding must be between 0 and 5 mm.");
    const key = JSON.stringify([diameter, style, size, position, padding]);
    if (geometryCache.has(key)) return geometryCache.get(key);
    const labels = [], radius = diameter * 0.3 * position / 100, height = diameter * 0.065 * size / 100;
    for (let hour = 1; hour <= 12; hour++) {
      const angle = hour / 12 * Math.PI * 2, x2 = snap(Math.sin(angle) * radius), y = snap(Math.cos(angle) * radius), text = style === "roman" ? ROMAN[hour - 1] : String(hour);
      labels.push({ hour, text, x: x2, y, height, polygons: numberPolygons(text, height, x2, y, padding) });
    }
    geometryCache.set(key, labels);
    if (geometryCache.size > 16) geometryCache.delete(geometryCache.keys().next().value);
    return labels;
  }
  function hourNumeralPolygons(settings, padding = 0) {
    const labels = hourNumeralLabels(settings, padding);
    return labels.length ? import_polygon_clipping2.default.union(...labels.map((label) => label.polygons)) : [];
  }
  function hourNumeralMarkup(settings, padding = 0) {
    const diameter = configuration(settings).diameter, scale = 400 / diameter;
    return hourNumeralLabels(settings, padding).map(({ hour, text, polygons }) => {
      const d = polygons.map((polygon) => polygon.map((ring) => ring.map(([x2, y], i2) => `${i2 ? "L" : "M"}${(200 + x2 * scale).toFixed(5)} ${(200 - y * scale).toFixed(5)}`).join("") + "Z").join("")).join("");
      return `<path data-hour="${hour}" aria-label="${text}" d="${d}" fill-rule="evenodd"/>`;
    }).join("");
  }

  // svg-details.js
  function usesSVGBacking(settings) {
    return settings?.design === "custom" && settings.svgBacking === true;
  }
  function backingDepth(settings) {
    if (!usesSVGBacking(settings)) return 0;
    const value = settings.svgBackingThickness ?? 1.2;
    if (!Number.isFinite(value) || value < 1 || value > 3) throw Error("Choose a backing thickness from 1 to 3 mm.");
    return value;
  }
  function artworkSurfaceHeight(settings) {
    return settings.thickness + backingDepth(settings);
  }
  function artworkFrame(alpha, n, diameter, settings = null) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const contours = traceContours(alpha, n);
    for (const ring of contours) for (const [x2, y] of ring) {
      minX = Math.min(minX, x2);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y);
    }
    const span = Math.max(maxX - minX, maxY - minY);
    if (!Number.isFinite(span) || span <= 0) throw Error("The SVG has no printable artwork.");
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    let scale = diameter / span;
    if (usesSVGBacking(settings)) {
      const margin = settings.svgBackingMargin ?? 3;
      if (!Number.isFinite(margin) || margin < 1 || margin > 12 || diameter <= margin * 2) throw Error("Choose a backing border from 1 to 12 mm.");
      let radius = 0;
      for (const ring of contours) for (const [x2, y] of ring) radius = Math.max(radius, Math.hypot(x2 - cx, y - cy));
      scale = (diameter / 2 - margin) / radius;
    }
    return { scale, cx, cy, n };
  }
  var luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  function artworkRelief(rgba, alpha, n, mode = "contrast") {
    if (!ArrayBuffer.isView(rgba) || rgba.length !== n * n * 4 || alpha?.length !== n * n) throw Error("The SVG detail image is incomplete.");
    if (!["contrast", "dark", "light"].includes(mode)) throw Error("Choose a valid SVG relief style.");
    const histogram = new Uint32Array(32768);
    let dominant = 0, dominantCount = 0, minLight = 255, maxLight = 0, count = 0;
    for (let i2 = 0; i2 < alpha.length; i2++) if (alpha[i2] >= 240) {
      const p = i2 * 4, r = rgba[p], g = rgba[p + 1], b = rgba[p + 2], key = (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
      if (++histogram[key] > dominantCount) {
        dominant = key;
        dominantCount = histogram[key];
      }
      const light = luminance(r, g, b);
      minLight = Math.min(minLight, light);
      maxLight = Math.max(maxLight, light);
      count++;
    }
    const opaque = count > 0, cutoff = opaque ? 240 : 128;
    if (!opaque) {
      for (let i2 = 0; i2 < alpha.length; i2++) if (alpha[i2] >= cutoff) {
        const p = i2 * 4, r = rgba[p], g = rgba[p + 1], b = rgba[p + 2], key = (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
        if (++histogram[key] > dominantCount) {
          dominant = key;
          dominantCount = histogram[key];
        }
        const light = luminance(r, g, b);
        minLight = Math.min(minLight, light);
        maxLight = Math.max(maxLight, light);
      }
    }
    let red = 0, green = 0, blue = 0, samples = 0;
    for (let i2 = 0; i2 < alpha.length; i2++) if (alpha[i2] >= cutoff) {
      const p = i2 * 4, r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
      if ((r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3) === dominant) {
        red += r;
        green += g;
        blue += b;
        samples++;
      }
    }
    if (!samples) return null;
    red /= samples;
    green /= samples;
    blue /= samples;
    const distance2 = (r, g, b) => Math.sqrt(0.2126 * (r - red) ** 2 + 0.7152 * (g - green) ** 2 + 0.0722 * (b - blue) ** 2);
    let maxDistance = 0;
    if (mode === "contrast") {
      for (let i2 = 0; i2 < alpha.length; i2++) if (alpha[i2] >= cutoff) {
        const p = i2 * 4;
        maxDistance = Math.max(maxDistance, distance2(rgba[p], rgba[p + 1], rgba[p + 2]));
      }
    }
    const range = maxLight - minLight;
    if ((mode === "contrast" ? maxDistance : range) < 4) return null;
    const relief = new Uint8Array(n * n);
    for (let i2 = 0; i2 < alpha.length; i2++) if (alpha[i2] >= 128) {
      const p = i2 * 4, r = rgba[p], g = rgba[p + 1], b = rgba[p + 2], light = luminance(r, g, b);
      const value = mode === "contrast" ? distance2(r, g, b) / maxDistance : mode === "dark" ? (maxLight - light) / range : (light - minLight) / range;
      relief[i2] = Math.min(255, Math.max(0, Math.round(value * 255)), alpha[i2]);
    }
    return relief;
  }

  // mesh.js
  var CURVE_ERROR = 0.02;
  var snap2 = (value) => Math.round(value * 1e6) / 1e6;
  function area2(ring) {
    let sum = 0;
    for (let i2 = 0, j = ring.length - 1; i2 < ring.length; j = i2++) sum += ring[j][0] * ring[i2][1] - ring[i2][0] * ring[j][1];
    return sum / 2;
  }
  function contains(point, ring) {
    let inside = false;
    for (let i2 = 0, j = ring.length - 1; i2 < ring.length; j = i2++) {
      const a = ring[i2], b = ring[j];
      if (a[1] > point[1] !== b[1] > point[1] && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function closed(ring, positive = true) {
    if (area2(ring) > 0 !== positive) ring.reverse();
    const points = ring.map(([x2, y]) => [snap2(x2), snap2(y)]);
    return [...points, points[0]];
  }
  function silhouette(alpha, n, diameter, frame = null, threshold = 127.5) {
    const source = traceContours(alpha, n, threshold);
    if (!source.length) {
      if (frame) return { polygons: [], frame };
      throw Error("This shape has no printable filled area. Try another SVG.");
    }
    if (source.length > 4096) throw Error("This SVG has too many separate details. Simplify its smallest shapes before exporting.");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ring of source) for (const [x2, y] of ring) {
      minX = Math.min(minX, x2);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y);
    }
    const span = Math.max(maxX - minX, maxY - minY);
    frame ||= { scale: diameter / span, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    const { scale, cx, cy } = frame;
    if (!Number.isFinite(scale) || span <= 0) throw Error("The SVG outline could not be measured.");
    const rings = source.map((ring) => simplifyRing(ring, CURVE_ERROR / scale).map(([x2, y]) => [(x2 - cx) * scale, (cy - y) * scale])).filter((ring) => ring.length >= 3 && Math.abs(area2(ring)) > 1e-6).map((ring) => ({ ring, size: Math.abs(area2(ring)), depth: 0, parent: null, polygon: null })).sort((a, b) => b.size - a.size);
    const result = [];
    for (let i2 = 0; i2 < rings.length; i2++) {
      const entry = rings[i2];
      for (let j = i2 - 1; j >= 0; j--) if (contains(entry.ring[0], rings[j].ring)) {
        entry.parent = rings[j];
        entry.depth = rings[j].depth + 1;
        break;
      }
      if (entry.depth % 2 === 0) {
        entry.polygon = [closed(entry.ring)];
        result.push(entry.polygon);
      } else entry.parent.polygon.push(closed(entry.ring, false));
    }
    return { polygons: result, frame };
  }
  function insetAlpha(alpha, n, radius) {
    const output = new Uint8Array(alpha.length), offsets = [];
    for (let y = -radius; y <= radius; y++) for (let x2 = -radius; x2 <= radius; x2++) if (x2 * x2 + y * y <= radius * radius) offsets.push(y * n + x2);
    for (let y = radius; y < n - radius; y++) for (let x2 = radius; x2 < n - radius; x2++) {
      const index = y * n + x2;
      if (alpha[index] < 128) continue;
      let value = 255;
      for (const offset of offsets) {
        value = Math.min(value, alpha[index + offset]);
        if (!value) break;
      }
      output[index] = value;
    }
    return output;
  }
  function circle(radius, error = CURVE_ERROR, minimum = 32) {
    const count = Math.ceil(Math.max(minimum, Math.ceil(Math.PI / Math.acos(Math.max(-1, 1 - error / radius)))) / 4) * 4;
    return Array.from({ length: count + 1 }, (_, i2) => {
      const a = i2 % count / count * Math.PI * 2;
      return [snap2(radius * Math.cos(a)), snap2(radius * Math.sin(a))];
    });
  }
  function markerPolygons(diameter, padding = 0) {
    const result = [];
    for (let i2 = 0; i2 < 12; i2++) {
      const originalLength = diameter * (i2 % 3 === 0 ? 17 : 10) / 400;
      const width = diameter * 5 / 400 + padding * 2, length = originalLength + padding * 2, radius = Math.min(width * 0.35, length * 0.15), y = diameter * 0.31 - originalLength / 2;
      const ring = [];
      for (const [cx, cy, start] of [[width / 2 - radius, y + length / 2 - radius, 0], [-width / 2 + radius, y + length / 2 - radius, 90], [-width / 2 + radius, y - length / 2 + radius, 180], [width / 2 - radius, y - length / 2 + radius, 270]]) {
        for (let j = 0; j <= 5; j++) {
          const a2 = (start + j * 18) * Math.PI / 180;
          ring.push([cx + radius * Math.cos(a2), cy + radius * Math.sin(a2)]);
        }
      }
      const a = i2 * Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
      result.push([closed(ring.map(([x2, y2]) => [x2 * c - y2 * s, x2 * s + y2 * c]))]);
    }
    return result;
  }
  function ripplePolygons(diameter) {
    const result = [];
    for (let radius = 2; radius < diameter * 0.72; radius += 2) {
      const outer = circle(radius + 0.4), inner = circle(Math.max(0.1, radius - 0.4));
      result.push([outer, inner.reverse()]);
    }
    return result;
  }
  function hatchPolygons(diameter) {
    const strips = [], reach = diameter * 0.75, halfWidth = 0.25;
    for (const angle of [Math.PI / 4, -Math.PI / 4]) {
      const ux = Math.cos(angle), uy = Math.sin(angle), nx = -uy, ny = ux;
      for (let offset = -reach; offset <= reach; offset += 4) {
        const ring = [[-reach, offset - halfWidth], [reach, offset - halfWidth], [reach, offset + halfWidth], [-reach, offset + halfWidth]].map(([t, u]) => [t * ux + u * nx, t * uy + u * ny]);
        strips.push([closed(ring)]);
      }
    }
    return import_polygon_clipping3.default.union(...strips);
  }
  function buildClockLayers(alpha, n, settings, progress = () => {
  }, artwork = null) {
    if (!Number.isInteger(n) || n < 2 || !alpha || alpha.length !== n * n) throw Error("The outline image must be a square pixel grid.");
    const { diameter, hole, texture, markers } = settings, thickness = artworkSurfaceHeight(settings), backed = usesSVGBacking(settings);
    if (![diameter, settings.thickness, thickness, hole].every((value) => Number.isFinite(value) && value > 0) || !["smooth", "ripple", "grain"].includes(texture)) throw Error("The clock dimensions or texture are invalid.");
    progress("outline");
    const { polygons: outline, frame } = silhouette(alpha, n, diameter, backed ? artworkFrame(alpha, n, diameter, settings) : null);
    const base = import_polygon_clipping3.default.difference(outline, [[circle(hole / 2, 1e-3, 128)]]);
    if (!base.length) throw Error("The center opening covers the entire clock face.");
    const layers = backed ? [
      { height: backingDepth(settings), polygons: import_polygon_clipping3.default.difference([[circle(diameter / 2, CURVE_ERROR, 128)]], [[circle(hole / 2, 1e-3, 128)]]) },
      { height: thickness, polygons: base }
    ] : [{ height: thickness, polygons: base }];
    progress("details");
    const detailed = !!artwork?.rgba && settings.design === "custom" && settings.svgDetail !== "silhouette";
    if (texture === "smooth" && !markers && !detailed) return layers;
    const rimPixels = Math.max(1, Math.ceil(0.3 / frame.scale));
    const detailOutline = silhouette(insetAlpha(alpha, n, rimPixels), n, diameter, frame).polygons;
    const detailRegion = detailOutline.length ? import_polygon_clipping3.default.difference(detailOutline, [[circle(hole / 2 + 0.3, 1e-3, 128)]]) : [];
    const useNumerals = ["arabic", "roman"].includes(settings.hourStyle);
    const markerShapes = markers ? useNumerals ? hourNumeralPolygons(settings) : markerPolygons(diameter) : [];
    const markerOutline = markers ? silhouette(insetAlpha(alpha, n, rimPixels + 1), n, diameter, frame).polygons : [];
    const markerRegion = markerOutline.length ? import_polygon_clipping3.default.difference(markerOutline, [[circle(hole / 2 + 0.3 + frame.scale, 1e-3, 128)]]) : [];
    const ticks = markers && markerRegion.length ? import_polygon_clipping3.default.intersection(markerRegion, markerShapes) : [];
    if (detailed) {
      const height = settings.svgRelief ?? 0.8;
      if (!Number.isFinite(height) || height < 0 || height > 2) throw Error("SVG relief must be between 0 and 2 mm.");
      const relief = height > 0 ? artworkRelief(artwork.rgba, alpha, n, settings.svgTone || "contrast") : null;
      let top = thickness, previous = detailRegion;
      if (relief && detailRegion.length) {
        const steps = Math.max(1, Math.min(8, Math.round(height / 0.2)));
        for (let level = 1; level <= steps; level++) {
          const region = silhouette(relief, n, diameter, frame, (level - 0.5) * 255 / steps).polygons;
          const detail = region.length && previous.length ? import_polygon_clipping3.default.intersection(previous, region) : [];
          previous = detail;
          const raised = ticks.length ? detail.length ? import_polygon_clipping3.default.union(detail, ticks) : ticks : detail;
          if (raised.length) {
            top = thickness + height * level / steps;
            layers.push({ height: top, polygons: raised });
          }
        }
      }
      if (ticks.length) layers.push({ height: top + 0.8, polygons: ticks });
      return layers;
    }
    if (texture !== "smooth") {
      let pattern = texture === "ripple" ? ripplePolygons(diameter) : hatchPolygons(diameter);
      let first = [];
      if (useNumerals && markers) {
        pattern = import_polygon_clipping3.default.difference(pattern, hourNumeralPolygons(settings, 0.6));
        const textureArea = detailRegion.length ? import_polygon_clipping3.default.intersection(detailRegion, pattern) : [];
        first = textureArea.length && ticks.length ? import_polygon_clipping3.default.union(textureArea, ticks) : ticks.length ? ticks : textureArea;
      } else {
        const foundation = markers ? import_polygon_clipping3.default.union(pattern, markerPolygons(diameter, 0.15)) : pattern;
        first = detailRegion.length ? import_polygon_clipping3.default.intersection(detailRegion, foundation) : [];
      }
      if (first.length) layers.push({ height: thickness + 0.4, polygons: first });
    }
    if (ticks.length) layers.push({ height: thickness + 0.8, polygons: ticks });
    return layers;
  }
  function makeClockSTL(alpha, n, settings, progress = () => {
  }, artwork = null) {
    const layers = buildClockLayers(alpha, n, settings, progress, artwork);
    progress("mesh");
    return extrudeLayers(layers);
  }

  // node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = (function(cd, mb, r) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  });
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flm = /* @__PURE__ */ hMap(flt, 9, 0);
  var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var wbits = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
  };
  var wbits16 = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
  };
  var hTree = function(d, mb) {
    var t = [];
    for (var i2 = 0; i2 < d.length; ++i2) {
      if (d[i2])
        t.push({ s: i2, f: d[i2] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
      return { t: et, l: 0 };
    if (s == 1) {
      var v = new u8(t[0].s + 1);
      v[t[0].s] = 1;
      return { t: v, l: 1 };
    }
    t.sort(function(a, b) {
      return a.f - b.f;
    });
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
    t[0] = { s: -1, f: l.f + r.f, l, r };
    while (i1 != s - 1) {
      l = t[t[i0].f < t[i22].f ? i0++ : i22++];
      r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
      t[i1++] = { s: -1, f: l.f + r.f, l, r };
    }
    var maxSym = t2[0].s;
    for (var i2 = 1; i2 < s; ++i2) {
      if (t2[i2].s > maxSym)
        maxSym = t2[i2].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i2 = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t2.sort(function(a, b) {
        return tr[b.s] - tr[a.s] || a.f - b.f;
      });
      for (; i2 < s; ++i2) {
        var i2_1 = t2[i2].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t2[i2].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i2;
      }
      for (; i2 >= 0 && dt; --i2) {
        var i2_3 = t2[i2].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n, l, d) {
    return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
  };
  var lc = function(c) {
    var s = c.length;
    while (s && !c[--s])
      ;
    var cl = new u16(++s);
    var cli = 0, cln = c[0], cls = 1;
    var w = function(v) {
      cl[cli++] = v;
    };
    for (var i2 = 1; i2 <= s; ++i2) {
      if (c[i2] == cln && i2 != s)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (; cls > 138; cls -= 138)
            w(32754);
          if (cls > 2) {
            w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w(cln), --cls;
          for (; cls > 6; cls -= 6)
            w(8304);
          if (cls > 2)
            w(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w(cln);
        cls = 1;
        cln = c[i2];
      }
    }
    return { c: cl.subarray(0, cli), n: s };
  };
  var clen = function(cf, cl) {
    var l = 0;
    for (var i2 = 0; i2 < cl.length; ++i2)
      l += cf[i2] * cl[i2];
    return l;
  };
  var wfblk = function(out, pos, dat) {
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i2 = 0; i2 < s; ++i2)
      out[o + i2 + 4] = dat[i2];
    return (o + 4 + s) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i2 = 0; i2 < lclt.length; ++i2)
      ++lcfreq[lclt[i2] & 31];
    for (var i2 = 0; i2 < lcdt.length; ++i2)
      ++lcfreq[lcdt[i2] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
      var llm = hMap(lct, mlcb, 0);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i2 = 0; i2 < nlcc; ++i2)
        wbits(out, p + 3 * i2, lct[clim[i2]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0; it < 2; ++it) {
        var clct = lcts[it];
        for (var i2 = 0; i2 < clct.length; ++i2) {
          var len = clct[i2] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i2 = 0; i2 < li; ++i2) {
      var sym = syms[i2];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n = opt >> 13, c = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i3) {
        return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25e3);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (; i2 + 2 < s; ++i2) {
        var hv = hsh(i2);
        var imod = i2 & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i2) {
          var rem = s - i2;
          if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
            li = lc_1 = eb = 0, bs = i2;
            for (var j = 0; j < 286; ++j)
              lf[j] = 0;
            for (var j = 0; j < 30; ++j)
              df[j] = 0;
          }
          var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i2 - dif)) {
            var maxn = Math.min(n, rem) - 1;
            var maxd = Math.min(32767, i2);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i2 + l] == dat[i2 + l - dif]) {
                var nl = 0;
                for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                  ;
                if (nl > l) {
                  l = nl, d = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j = 0; j < mmd; ++j) {
                    var ti = i2 - dif + j & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d) {
            syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
            var lin = revfl[l] & 31, din = revfd[d] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i2 + l;
            ++lc_1;
          } else {
            syms[li++] = dat[i2];
            ++lf[dat[i2]];
          }
        }
      }
      for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
        syms[li++] = dat[i2];
        ++lf[dat[i2]];
      }
      pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i2, st.w = wi;
      }
    } else {
      for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
        var e = i2 + 65535;
        if (e >= s) {
          w[pos / 8 | 0] = lst;
          e = s;
        }
        pos = wfblk(w, pos + 1, dat.subarray(i2, e));
      }
      st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
  };
  var crct = /* @__PURE__ */ (function() {
    var t = new Int32Array(256);
    for (var i2 = 0; i2 < 256; ++i2) {
      var c = i2, k = 9;
      while (--k)
        c = (c & 1 && -306674912) ^ c >>> 1;
      t[i2] = c;
    }
    return t;
  })();
  var crc = function() {
    var c = -1;
    return {
      p: function(d) {
        var cr = c;
        for (var i2 = 0; i2 < d.length; ++i2)
          cr = crct[cr & 255 ^ d[i2]] ^ cr >>> 8;
        c = cr;
      },
      d: function() {
        return ~c;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var mrg = function(a, b) {
    var o = {};
    for (var k in a)
      o[k] = a[k];
    for (var k in b)
      o[k] = b[k];
    return o;
  };
  var wbytes = function(d, b, v) {
    for (; v; ++b)
      d[b] = v, v >>>= 8;
  };
  function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
  }
  var fltn = function(d, p, t, o) {
    for (var k in d) {
      var val = d[k], n = p + k, op = o;
      if (Array.isArray(val))
        op = mrg(o, val[1]), val = val[0];
      if (ArrayBuffer.isView(val))
        t[n] = [val, op];
      else {
        t[n += "/"] = [new u8(0), op];
        fltn(val, n, t, o);
      }
    }
  };
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  function strToU8(str, latin1) {
    if (latin1) {
      var ar_1 = new u8(str.length);
      for (var i2 = 0; i2 < str.length; ++i2)
        ar_1[i2] = str.charCodeAt(i2);
      return ar_1;
    }
    if (te)
      return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
      ar[ai++] = v;
    };
    for (var i2 = 0; i2 < l; ++i2) {
      if (ai + 5 > ar.length) {
        var n = new u8(ai + 8 + (l - i2 << 1));
        n.set(ar);
        ar = n;
      }
      var c = str.charCodeAt(i2);
      if (c < 128 || latin1)
        w(c);
      else if (c < 2048)
        w(192 | c >> 6), w(128 | c & 63);
      else if (c > 55295 && c < 57344)
        c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
      else
        w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }
  var exfl = function(ex) {
    var le = 0;
    if (ex) {
      for (var k in ex) {
        var l = ex[k].length;
        if (l > 65535)
          err(9);
        le += l + 4;
      }
    }
    return le;
  };
  var wzh = function(d, b, f, fn, u, c, ce, co) {
    var fl2 = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
    if (ce != null)
      d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2;
    d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
      err(10);
    wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
    if (c != -1) {
      wbytes(d, b, f.crc);
      wbytes(d, b + 4, c < 0 ? -c - 2 : c);
      wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl2);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
      wbytes(d, b, col);
      wbytes(d, b + 6, f.attrs);
      wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl2;
    if (exl) {
      for (var k in ex) {
        var exf = ex[k], l = exf.length;
        wbytes(d, b, +k);
        wbytes(d, b + 2, l);
        d.set(exf, b + 4), b += 4 + l;
      }
    }
    if (col)
      d.set(co, b), b += col;
    return b;
  };
  var wzf = function(o, b, c, d, e) {
    wbytes(o, b, 101010256);
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
  };
  function zipSync(data, opts) {
    if (!opts)
      opts = {};
    var r = {};
    var files = [];
    fltn(data, "", r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
      var _a2 = r[fn], file = _a2[0], p = _a2[1];
      var compression = p.level == 0 ? 0 : 8;
      var f = strToU8(fn), s = f.length;
      var com = p.comment, m = com && strToU8(com), ms = m && m.length;
      var exl = exfl(p.extra);
      if (s > 65535)
        err(11);
      var d = compression ? deflateSync(file, p) : file, l = d.length;
      var c = crc();
      c.p(file);
      files.push(mrg(p, {
        size: file.length,
        crc: c.d(),
        c: d,
        f,
        m,
        u: s != fn.length || m && com.length != ms,
        o,
        compression
      }));
      o += 30 + s + exl + l;
      tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i2 = 0; i2 < files.length; ++i2) {
      var f = files[i2];
      wzh(out, f.o, f, f.f, f.u, f.c.length);
      var badd = 30 + f.f.length + exfl(f.extra);
      out.set(f.c, f.o + badd);
      wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
  }

  // export-3mf.js
  var CORE_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
  var MATERIAL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";
  var MODEL_TYPE = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
  var XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
  function escapeXML(value) {
    const text = [...value].filter((character) => {
      const code = character.codePointAt(0);
      return code === 9 || code === 10 || code === 13 || code >= 32 && code <= 55295 || code >= 57344 && code <= 65533 || code >= 65536 && code <= 1114111;
    }).join("");
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function stlView(input) {
    if (input instanceof ArrayBuffer) return new DataView(input);
    if (ArrayBuffer.isView(input)) return new DataView(input.buffer, input.byteOffset, input.byteLength);
    throw new TypeError("The printable mesh must be a binary STL buffer.");
  }
  function* binarySTLTriangles(buffer) {
    const view2 = stlView(buffer);
    if (view2.byteLength < 84) throw new RangeError("The printable mesh is incomplete.");
    const count = view2.getUint32(80, true);
    if (!count || 84 + count * 50 !== view2.byteLength) throw new RangeError("The printable mesh has an invalid triangle count.");
    for (let i2 = 0; i2 < count; i2++) {
      const offset = 96 + i2 * 50, points = [0, 1, 2].map((j) => [0, 1, 2].map((k) => view2.getFloat32(offset + j * 12 + k * 4, true)));
      if (!points.every((point) => point.every(Number.isFinite))) throw new RangeError("The printable mesh contains invalid coordinates.");
      const [a, b, c] = points, u = b.map((value, k) => value - a[k]), v = c.map((value, k) => value - a[k]);
      if (Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) === 0) throw new RangeError("The printable mesh contains an empty triangle.");
      yield points;
    }
  }
  function stlTo3MF(buffer, { name = "Clock Factory", color = "#C47F62", artwork = null } = {}) {
    if (typeof name !== "string") throw new TypeError("The model name must be text.");
    if (typeof color !== "string" || !/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color)) {
      throw new TypeError("The model color must be #RRGGBB or #RRGGBBAA.");
    }
    const materialColor = color.toUpperCase() + (color.length === 7 ? "FF" : "");
    const view2 = stlView(buffer);
    if (view2.byteLength < 84) throw new RangeError("The printable mesh is incomplete.");
    const count = view2.getUint32(80, true);
    if (!count || 84 + count * 50 !== view2.byteLength) throw new RangeError("The printable mesh has an invalid triangle count.");
    if (artwork) {
      const { png, frame, thickness } = artwork;
      if (!(png instanceof Uint8Array) || png.length < 24 || ![137, 80, 78, 71, 13, 10, 26, 10].every((value, i2) => png[i2] === value)) throw new TypeError("The SVG color texture must be a PNG image.");
      if (!frame || ![frame.scale, frame.cx, frame.cy, frame.n, thickness].every(Number.isFinite) || frame.scale <= 0 || frame.n < 2 || thickness <= 0) throw new RangeError("The SVG color texture has an invalid placement.");
    }
    const vertexIds = /* @__PURE__ */ new Map(), vertices = [], triangles = [], textureCoordinates = [];
    function vertex(point) {
      const key = point.join(",");
      let index = vertexIds.get(key);
      if (index === void 0) {
        index = vertices.length;
        vertexIds.set(key, index);
        vertices.push(`<vertex x="${point[0]}" y="${point[1]}" z="${point[2]}"/>`);
        if (artwork) {
          const { scale, cx, cy, n } = artwork.frame;
          const u = (point[0] / scale + cx) / n, v = 1 - (cy - point[1] / scale) / n;
          textureCoordinates.push(`<m:tex2coord u="${u}" v="${v}"/>`);
        }
      }
      return index;
    }
    for (let i2 = 0; i2 < count; i2++) {
      const offset = 84 + i2 * 50 + 12;
      const points = [0, 1, 2].map((j) => [0, 1, 2].map((k) => view2.getFloat32(offset + j * 12 + k * 4, true)));
      if (!points.every((point) => point.every(Number.isFinite))) throw new RangeError("The printable mesh contains invalid coordinates.");
      const [a, b, c] = points;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) === 0) {
        throw new RangeError("The printable mesh contains an empty triangle.");
      }
      const indices = points.map(vertex);
      const painted = artwork && points.every((point) => point[2] >= artwork.thickness - 1e-5);
      const properties = painted ? ` pid="4" p1="${indices[0]}" p2="${indices[1]}" p3="${indices[2]}"` : "";
      triangles.push(`<triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}"${properties}/>`);
    }
    const title = escapeXML(name.trim() || "Clock Factory");
    const textureResources = artwork ? `<m:texture2d id="3" path="/3D/Textures/artwork.png" contenttype="image/png" tilestyleu="clamp" tilestylev="clamp" filter="linear"/>
<m:texture2dgroup id="4" texid="3">${textureCoordinates.join("")}</m:texture2dgroup>
` : "";
    const model = `${XML_HEADER}
<model unit="millimeter" xml:lang="en-US" xmlns="${CORE_NAMESPACE}"${artwork ? ` xmlns:m="${MATERIAL_NAMESPACE}"` : ""}>
<metadata name="Application">Clock Factory</metadata>
<metadata name="Title">${title}</metadata>
<resources>
<basematerials id="1"><base name="Clock face" displaycolor="${materialColor}"/></basematerials>
${textureResources}<object id="2" type="model" name="${title}" pid="1" pindex="0"><mesh>
<vertices>${vertices.join("")}</vertices>
<triangles>${triangles.join("")}</triangles>
</mesh></object>
</resources>
<build><item objectid="2"/></build>
</model>`;
    const contentTypes = `${XML_HEADER}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="${MODEL_TYPE}"/>
${artwork ? '<Default Extension="png" ContentType="image/png"/>\n' : ""}<Override PartName="/3D/3dmodel.model" ContentType="${MODEL_TYPE}"/>
</Types>`;
    const relationships = `${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>
</Relationships>`;
    const files = {
      "[Content_Types].xml": strToU8(contentTypes),
      "_rels/.rels": strToU8(relationships),
      "3D/3dmodel.model": strToU8(model)
    };
    if (artwork) {
      files["3D/Textures/artwork.png"] = artwork.png;
      files["3D/_rels/3dmodel.model.rels"] = strToU8(`${XML_HEADER}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="artwork" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dtexture" Target="/3D/Textures/artwork.png"/></Relationships>`);
    }
    const zip = zipSync(files, { level: 6, mtime: new Date(2e3, 0, 1) });
    return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
  }

  // filament-colors.js
  var hex = /^#[0-9a-f]{6}$/i;
  var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  function validFilamentOverrides(value) {
    return record(value) && Object.keys(value).length <= 64 && Object.entries(value).every(([source, target]) => hex.test(source) && typeof target === "string" && hex.test(target));
  }
  function normalizeFilamentOverrides(value) {
    if (!record(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([source, target]) => hex.test(source) && typeof target === "string" && hex.test(target)).slice(-64).map(([source, target]) => [source.toUpperCase(), target.toUpperCase()]));
  }
  function filamentColors(sourcePalette, overrides = {}) {
    if (!validFilamentOverrides(overrides)) throw Error("Filament colors must use valid six-digit HEX values.");
    const normalized = normalizeFilamentOverrides(overrides), palette = [], indices = [], colors2 = [];
    for (const source of sourcePalette) {
      const color = normalized[source.toUpperCase()] || source.toUpperCase();
      let index = palette.indexOf(color);
      if (index < 0) {
        index = palette.length;
        palette.push(color);
      }
      indices.push(index);
      colors2.push(color);
    }
    return { palette, indices, colors: colors2 };
  }

  // bambu-paint.js
  var rgb = (hex3) => [1, 3, 5].map((at) => parseInt(hex3.slice(at, at + 2), 16));
  var hex2 = (color) => "#" + color.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase();
  var distance = (a, b) => 0.2126 * (a[0] - b[0]) ** 2 + 0.7152 * (a[1] - b[1]) ** 2 + 0.0722 * (a[2] - b[2]) ** 2;
  var bin = (r, g, b) => (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
  function composite(data, at, base, opaqueBins) {
    if (data[at + 3] < 240 && opaqueBins?.[bin(data[at], data[at + 1], data[at + 2])]) return [data[at], data[at + 1], data[at + 2]];
    const a = data[at + 3] / 255;
    return [0, 1, 2].map((k) => Math.round(data[at + k] * a + base[k] * (1 - a)));
  }
  function dominantArtworkColor(raster, fallback) {
    if (!raster) return fallback;
    const { rgba } = raster, counts2 = new Uint32Array(32768), sums = [new Float64Array(32768), new Float64Array(32768), new Float64Array(32768)];
    let mode = 0, best = 0;
    for (let at = 0; at < rgba.length; at += 4) if (rgba[at + 3] >= 240) {
      const key = bin(rgba[at], rgba[at + 1], rgba[at + 2]);
      if (++counts2[key] > best) {
        best = counts2[key];
        mode = key;
      }
      for (let k = 0; k < 3; k++) sums[k][key] += rgba[at + k];
    }
    return best ? hex2(sums.map((values) => values[mode] / best)) : fallback;
  }
  function filamentPaint(raster, baseColor, maxColors = 4) {
    if (![2, 4, 8, 16].includes(maxColors)) throw Error("Choose 2, 4, 8, or 16 filaments.");
    if (typeof baseColor !== "string" || !/^#[0-9a-f]{6}$/i.test(baseColor)) throw Error("Choose a valid back color.");
    const base = rgb(baseColor);
    if (!raster) return { palette: [hex2(base)], map: null, mips: null };
    const { rgba, width, height } = raster;
    if (!(rgba instanceof Uint8Array || rgba instanceof Uint8ClampedArray) || !Number.isInteger(width) || width < 2 || width > 2048 || height !== width || rgba.length !== width * height * 4) throw Error("The SVG filament-color image is incomplete.");
    const counts2 = new Uint32Array(32768), opaqueBins = new Uint8Array(32768), sums = [new Float64Array(32768), new Float64Array(32768), new Float64Array(32768)];
    for (let at = 0; at < rgba.length; at += 4) if (rgba[at + 3] >= 240) opaqueBins[bin(rgba[at], rgba[at + 1], rgba[at + 2])] = 1;
    const originalBins = opaqueBins.slice();
    for (let key = 0; key < originalBins.length; key++) if (originalBins[key]) {
      const r = key >> 10, g = key >> 5 & 31, b = key & 31;
      for (let dr = -1; dr <= 1; dr++) for (let dg = -1; dg <= 1; dg++) for (let db = -1; db <= 1; db++) if (r + dr >= 0 && r + dr < 32 && g + dg >= 0 && g + dg < 32 && b + db >= 0 && b + db < 32) opaqueBins[(r + dr) * 1024 + (g + dg) * 32 + b + db] = 1;
    }
    let total = 0;
    for (let at = 0; at < rgba.length; at += 4) if (rgba[at + 3] >= 128) {
      const color = composite(rgba, at, base, opaqueBins), key = bin(...color);
      counts2[key]++;
      total++;
      for (let k = 0; k < 3; k++) sums[k][key] += color[k];
    }
    const samples = [];
    for (let key = 0; key < counts2.length; key++) if (counts2[key]) samples.push({ key, count: counts2[key], color: sums.map((values) => values[key] / counts2[key]) });
    let centers = [base];
    while (centers.length < maxColors) {
      let selected = null, best = 0;
      for (const sample of samples) {
        const gap = Math.min(...centers.map((center) => distance(sample.color, center))), score = gap * sample.count;
        if (gap > 64 && score > best) {
          best = score;
          selected = sample;
        }
      }
      if (!selected) break;
      centers.push(selected.color);
    }
    const nearest = (color, values) => {
      let index = 0, best = Infinity;
      for (let i2 = 0; i2 < values.length; i2++) {
        const d = distance(color, values[i2]);
        if (d < best) {
          index = i2;
          best = d;
        }
      }
      return index;
    };
    for (let iteration = 0; iteration < 6; iteration++) {
      const groups = centers.map(() => ({ sum: [0, 0, 0], count: 0 }));
      for (const sample of samples) {
        const group = groups[nearest(sample.color, centers)];
        group.count += sample.count;
        for (let k = 0; k < 3; k++) group.sum[k] += sample.color[k] * sample.count;
      }
      centers = centers.map((color, i2) => i2 && groups[i2].count ? groups[i2].sum.map((value) => value / groups[i2].count) : color);
    }
    const representatives = centers.map(() => ({ mass: 0, mode: null }));
    for (const sample of samples) {
      const group = representatives[nearest(sample.color, centers)];
      group.mass += sample.count;
      if (!group.mode || sample.count > group.mode.count) group.mode = sample;
    }
    const colors2 = [base];
    for (const group of representatives.slice(1).sort((a, b) => b.mass - a.mass)) if (group.mode && group.mass >= Math.max(1, total * 5e-4) && !colors2.some((color) => distance(color, group.mode.color) < 16)) colors2.push(group.mode.color);
    const palette = colors2.map(hex2), lookup = new Uint8Array(32768);
    for (const sample of samples) lookup[sample.key] = nearest(sample.color, colors2);
    const map = new Uint8Array(width * height);
    for (let i2 = 0; i2 < map.length; i2++) if (rgba[i2 * 4 + 3] >= 128) map[i2] = lookup[bin(...composite(rgba, i2 * 4, base, opaqueBins))];
    return { palette, map, mips: paintMips(map, width), width };
  }
  function paintMips(map, width) {
    const mips = [{ width, data: Uint16Array.from(map, (value) => 1 << value) }];
    while (mips.at(-1).width > 1) {
      const previous = mips.at(-1), size = Math.ceil(previous.width / 2), data = new Uint16Array(size * size);
      for (let y = 0; y < size; y++) for (let x2 = 0; x2 < size; x2++) {
        let mask = 0;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (x2 * 2 + dx < previous.width && y * 2 + dy < previous.width) mask |= previous.data[(y * 2 + dy) * previous.width + x2 * 2 + dx];
        data[y * size + x2] = mask;
      }
      mips.push({ width: size, data });
    }
    return mips;
  }
  function recolorFilamentPaint(paint, overrides = {}) {
    const { palette, indices } = filamentColors(paint.palette, overrides);
    if (!paint.map || indices.every((value, i2) => value === i2)) return { ...paint, palette };
    const map = paint.map.map((index) => indices[index]);
    return { ...paint, palette, map, mips: paintMips(map, paint.width) };
  }
  function filamentCode(index) {
    if (!Number.isInteger(index) || index < 0 || index >= 16) throw Error("The filament index is invalid.");
    const state2 = index + 1;
    return state2 < 3 ? (state2 * 4).toString(16).toUpperCase() : (state2 - 3).toString(16).toUpperCase() + "C";
  }
  function uniformRectangle(paint, minX, minY, maxX, maxY, bit) {
    const last = paint.mips.length - 1;
    function visit(level, x2, y) {
      const mip = paint.mips[level];
      if (x2 >= mip.width || y >= mip.width) return true;
      const span = 2 ** level, left = x2 * span, top = y * span, right = left + span - 1, bottom = top + span - 1;
      if (right < minX || bottom < minY || left > maxX || top > maxY) return true;
      const mask = mip.data[y * mip.width + x2];
      if ((mask & ~bit) === 0) return true;
      if (level === 0 || left >= minX && top >= minY && right <= maxX && bottom <= maxY) return false;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (!visit(level - 1, x2 * 2 + dx, y * 2 + dy)) return false;
      return true;
    }
    return visit(last, 0, 0);
  }
  function paintFacet(points, frame, paint, budget = { nodes: 0 }) {
    if (!paint.map) return filamentCode(0);
    if (!frame || frame.n !== paint.width || ![frame.scale, frame.cx, frame.cy].every(Number.isFinite) || frame.scale <= 0) throw Error("The SVG filament colors have an invalid placement.");
    const project = (point) => [point[0] / frame.scale + frame.cx, frame.cy - point[1] / frame.scale];
    const sample = (x2, y) => paint.map[Math.max(0, Math.min(paint.width - 1, Math.floor(y))) * paint.width + Math.max(0, Math.min(paint.width - 1, Math.floor(x2)))];
    const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const tolerance = 0.25 / frame.scale;
    function split(vertices, depth) {
      if (++budget.nodes > 2e6) throw Error("The SVG color map is too complex. Choose fewer filaments or simplify its smallest details.");
      const centroid = [0, 1].map((k) => (vertices[0][k] + vertices[1][k] + vertices[2][k]) / 3), color = sample(...centroid);
      const bounds = [0, 1].map((k) => [Math.floor(Math.min(...vertices.map((p) => p[k]))), Math.floor(Math.max(...vertices.map((p) => p[k])))]);
      const lengths = vertices.map((a2, i2) => {
        const b2 = vertices[(i2 + 1) % 3];
        return (a2[0] - b2[0]) ** 2 + (a2[1] - b2[1]) ** 2;
      });
      const longest = Math.max(...lengths);
      if (longest <= tolerance * tolerance || depth >= 20 || uniformRectangle(paint, bounds[0][0], bounds[1][0], bounds[0][1], bounds[1][1], 1 << color)) return { code: filamentCode(color), color };
      const special = (lengths.indexOf(longest) + 2) % 3, [a, b, c] = [0, 1, 2].map((i2) => vertices[(special + i2) % 3]), middle = midpoint(b, c);
      const left = split([a, b, middle], depth + 1), right = split([middle, c, a], depth + 1);
      if (left.color >= 0 && left.color === right.color) return left;
      return { code: left.code + right.code + (special * 4 + 1).toString(16).toUpperCase(), color: -1 };
    }
    return split(points.map(project), 0).code;
  }

  // export-bambu.js
  var header = '<?xml version="1.0" encoding="UTF-8"?>';
  function stlToBambu3MF(buffer, { name = "Clock Factory", color = "#C47F62", painting = null, maxColors = 4, backColor = "background", colorOverrides = {} } = {}) {
    if (typeof name !== "string") throw new TypeError("The model name must be text.");
    if (![2, 4].includes(maxColors)) throw Error("An A1 with AMS Lite supports up to 4 filaments. Choose 2 or 4 colors.");
    if (painting && (!painting.frame || painting.frame.n !== painting.width || !Number.isFinite(painting.thickness) || painting.thickness <= 0)) throw Error("The SVG filament colors have an invalid placement.");
    if (!["background", "face"].includes(backColor)) throw Error("Choose a valid back color mode.");
    const paint = recolorFilamentPaint(filamentPaint(painting, backColor === "background" ? dominantArtworkColor(painting, color) : color, maxColors), colorOverrides), title = escapeXML(name.trim() || "Clock Factory"), vertices = [], triangles = [], ids = /* @__PURE__ */ new Map(), budget = { nodes: 0 };
    let minX = Infinity, minY = Infinity;
    const vertex = (point) => {
      const key = point.join(",");
      let id = ids.get(key);
      if (id === void 0) {
        id = vertices.length;
        ids.set(key, id);
        vertices.push(`<vertex x="${point[0]}" y="${point[1]}" z="${point[2]}"/>`);
        minX = Math.min(minX, point[0]);
        minY = Math.min(minY, point[1]);
      }
      return id;
    };
    for (const points of binarySTLTriangles(buffer)) {
      const indices = points.map(vertex), painted = painting && points.every((point) => point[2] >= painting.thickness - 1e-5);
      const code = painted ? paintFacet(points, painting.frame, paint, budget) : filamentCode(0);
      triangles.push(`<triangle v1="${indices[0]}" v2="${indices[1]}" v3="${indices[2]}" paint_color="${code}"/>`);
    }
    const model = `${header}
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Application">BambuStudio-02.00.00.00</metadata><metadata name="Creator">Clock Factory</metadata><metadata name="Title">${title}</metadata>
<metadata name="BambuStudio:3mfVersion">1</metadata><metadata name="BambuStudio:MmPaintingVersion">0</metadata>
<resources><object id="2" type="model" name="${title}"><mesh><vertices>${vertices.join("")}</vertices><triangles>${triangles.join("")}</triangles></mesh></object></resources>
<build><item objectid="2" transform="1 0 0 0 1 0 0 0 1 ${-minX} ${-minY} 0"/></build></model>`;
    const types = `${header}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="application/octet-stream"/></Types>`;
    const rels = `${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/></Relationships>`;
    const config = `${header}<config><object id="2"><metadata key="name" value="${title}"/><metadata key="extruder" value="1"/><part id="2" subtype="normal_part"><metadata key="name" value="Clock face"/><metadata key="extruder" value="1"/></part></object></config>`;
    const settings = JSON.stringify({ filament_colour: paint.palette, filament_settings_id: paint.palette.map(() => "Generic PLA @BBL A1"), printer_settings_id: "Bambu Lab A1 0.4 nozzle", print_settings_id: "0.20mm Standard @BBL A1", nozzle_diameter: ["0.4"], printable_height: "256", printable_area: ["0x0", "256x0", "256x256", "0x256"], flush_volumes_matrix: [] });
    const zip = zipSync({ "[Content_Types].xml": strToU8(types), "_rels/.rels": strToU8(rels), "3D/3dmodel.model": strToU8(model), "Metadata/model_settings.config": strToU8(config), "Metadata/project_settings.config": strToU8(settings) }, { level: 6, mtime: new Date(2e3, 0, 1) });
    return { buffer: zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength), palette: paint.palette };
  }

  // project.js
  var MAX_PROJECT_BYTES = 12 * 1024 * 1024;
  var DEFAULT_SETTINGS = Object.freeze({ design: "petal", projectName: "My Clock", color: 0, texture: "ripple", diameter: 200, thickness: 3, hole: 8, markers: true, hourStyle: "ticks", numberSize: 100, numberPosition: 100, exportFormat: "stl", svgDetail: "artwork", svgRelief: 0.8, svgTone: "contrast", showHands: true, threeMFTarget: "bambu-a1", filamentCount: 4, bambuBackColor: "background", bambuColors: Object.freeze({}), svgBacking: false, svgBackingThickness: 1.2, svgBackingMargin: 3 });
  var choices = { design: [...designs.map((d) => d.id), "custom"], texture: ["smooth", "ripple", "grain"], hourStyle: ["ticks", "arabic", "roman"], exportFormat: ["stl", "3mf"], svgDetail: ["artwork", "silhouette"], svgTone: ["contrast", "dark", "light"], threeMFTarget: ["bambu-a1", "standard"], filamentCount: [2, 4], bambuBackColor: ["background", "face"] };
  var ranges = { color: [0, 6, 1], diameter: [100, 300, 1], thickness: [2, 10, 0.5], hole: [5, 15, 0.5], numberSize: [70, 130, 5], numberPosition: [80, 120, 5], svgRelief: [0, 2, 0.2], svgBackingThickness: [1, 3, 0.2], svgBackingMargin: [1, 12, 0.5] };
  var bytes = (value) => new TextEncoder().encode(value).byteLength;
  var record2 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  function projectName(value) {
    return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 80) || "My Clock" : "My Clock";
  }
  function normalizeSettings(input = {}) {
    if (!record2(input)) input = {};
    const settings = { ...DEFAULT_SETTINGS, projectName: projectName(input.projectName) };
    settings.bambuColors = normalizeFilamentOverrides(input.bambuColors);
    for (const [key, values] of Object.entries(choices)) if (values.includes(input[key])) settings[key] = input[key];
    for (const [key, [min, max, step]] of Object.entries(ranges)) {
      const value = Number(input[key]);
      if (input[key] != null && Number.isFinite(value)) settings[key] = Number(Math.min(max, Math.max(min, Math.round(value / step) * step)).toFixed(5));
    }
    for (const key of ["markers", "showHands", "svgBacking"]) if (typeof input[key] === "boolean") settings[key] = input[key];
    return settings;
  }
  function checkedArtwork(value) {
    if (value == null) return null;
    if (!record2(value) || typeof value.source !== "string" || !value.source.trim()) throw Error("This project is missing its SVG artwork.");
    if (value.source.length > 5 * 1024 * 1024 || bytes(value.source) > 5 * 1024 * 1024) throw Error("The project SVG must be smaller than 5 MB.");
    const name = typeof value.name === "string" ? value.name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f<>]/g, "").slice(0, 255) : "Imported SVG.svg";
    return { name: name || "Imported SVG.svg", source: value.source };
  }
  function parseProject(text) {
    if (typeof text !== "string" || text.length > MAX_PROJECT_BYTES || bytes(text) > MAX_PROJECT_BYTES) throw Error("Choose a Clock Factory project smaller than 12 MB.");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw Error("This file is not a valid Clock Factory project.");
    }
    if (!record2(data) || data.format !== "clock-factory-project" || data.version !== 1 || !record2(data.settings)) throw Error("This project format is not supported. Open a .clock file saved by Clock Factory.");
    for (const [key, values] of Object.entries(choices)) if (data.settings[key] !== void 0 && !values.includes(data.settings[key])) throw Error(`The project has an invalid ${key} setting.`);
    for (const [key, [min, max, step]] of Object.entries(ranges)) {
      const value = data.settings[key];
      if (value !== void 0 && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || Math.abs(value / step - Math.round(value / step)) > 1e-6)) throw Error(`The project has an invalid ${key} setting.`);
    }
    for (const key of ["markers", "showHands", "svgBacking"]) if (data.settings[key] !== void 0 && typeof data.settings[key] !== "boolean") throw Error(`The project has an invalid ${key} setting.`);
    if (data.settings.bambuColors !== void 0 && !validFilamentOverrides(data.settings.bambuColors)) throw Error("The project has invalid filament colors.");
    const settings = normalizeSettings(data.settings), artwork = checkedArtwork(data.artwork), orientation = normalizeOrientation(data.orientation);
    if (settings.design === "custom" && !artwork) throw Error("The project is missing its imported SVG.");
    if (data.orientation !== void 0 && (!Array.isArray(data.orientation) || data.orientation.length !== 4 || !data.orientation.every((v, i2) => v === orientation[i2]))) throw Error("The project SVG orientation is invalid.");
    return { settings, artwork, orientation };
  }
  function serializeProject(settings, artwork = null, orientation = null) {
    const text = JSON.stringify({ format: "clock-factory-project", version: 1, settings: normalizeSettings(settings), artwork: checkedArtwork(artwork), orientation: normalizeOrientation(orientation) }, null, 2);
    parseProject(text);
    return text;
  }
  function projectFilename(name) {
    let filename = projectName(name).replace(/[\\/:*?"|]/g, "-").replace(/[. ]+$/g, "").slice(0, 80) || "My Clock";
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) filename = "Clock-" + filename;
    return `${filename}.clock`;
  }

  // history.js
  var DesignHistory = class {
    constructor(limit = 60) {
      this.limit = Math.max(2, limit);
      this.entries = [];
      this.index = -1;
      this.endGroup();
    }
    get canUndo() {
      return this.index > 0;
    }
    get canRedo() {
      return this.index < this.entries.length - 1;
    }
    reset(value, key) {
      this.entries = [{ value, key }];
      this.index = 0;
      this.endGroup();
    }
    endGroup() {
      this.group = null;
      this.time = -Infinity;
    }
    commit(value, key, { group = null, time = Date.now() } = {}) {
      if (this.entries[this.index]?.key === key) return false;
      const replace = group && group === this.group && time - this.time < 700 && this.index > 0 && !this.canRedo;
      this.entries.length = this.index + 1;
      if (replace) this.entries[this.index] = { value, key };
      else {
        this.entries.push({ value, key });
        this.index++;
      }
      if (this.entries.length > this.limit) {
        this.entries.shift();
        this.index--;
      }
      this.group = group;
      this.time = time;
      return true;
    }
    undo() {
      if (!this.canUndo) return null;
      this.endGroup();
      return this.entries[--this.index].value;
    }
    redo() {
      if (!this.canRedo) return null;
      this.endGroup();
      return this.entries[++this.index].value;
    }
  };

  // mesh-store.js
  var MeshStore = class {
    constructor(limit = 2) {
      this.limit = limit;
      this.cache = /* @__PURE__ */ new Map();
      this.pending = /* @__PURE__ */ new Map();
    }
    peek(key) {
      return this.cache.get(key) || null;
    }
    get(key, build, { signal, onStage = () => {
    } } = {}) {
      if (signal?.aborted) return Promise.reject(signal.reason || new DOMException("Cancelled", "AbortError"));
      if (this.cache.has(key)) {
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return Promise.resolve(value);
      }
      let job = this.pending.get(key);
      if (!job) {
        job = { controller: new AbortController(), listeners: /* @__PURE__ */ new Set() };
        this.pending.set(key, job);
        job.promise = Promise.resolve().then(() => build(job.controller.signal, (stage) => {
          for (const listener of job.listeners) listener.onStage(stage);
        })).then((value) => {
          job.controller.signal.throwIfAborted();
          this.cache.set(key, value);
          while (this.cache.size > this.limit) this.cache.delete(this.cache.keys().next().value);
          return value;
        }).finally(() => {
          if (this.pending.get(key) === job) this.pending.delete(key);
        });
        job.promise.catch(() => {
        });
      }
      return new Promise((resolve, reject) => {
        let settled = false;
        const listener = { onStage };
        const clean = () => {
          job.listeners.delete(listener);
          signal?.removeEventListener("abort", abort);
        };
        const finish = (error, value) => {
          if (settled) return;
          settled = true;
          clean();
          error ? reject(error) : resolve(value);
        };
        const abort = () => {
          finish(signal.reason || new DOMException("Cancelled", "AbortError"));
          if (!job.listeners.size) {
            job.controller.abort();
            if (this.pending.get(key) === job) this.pending.delete(key);
          }
        };
        job.listeners.add(listener);
        signal?.addEventListener("abort", abort, { once: true });
        job.promise.then((value) => finish(null, value), (error) => finish(error));
      });
    }
  };

  // mesh-analysis.js
  function analyzeSTL(buffer) {
    const view2 = buffer instanceof ArrayBuffer ? new DataView(buffer) : ArrayBuffer.isView(buffer) ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength) : null;
    if (!view2 || view2.byteLength < 84) throw Error("The print model is incomplete.");
    const count = view2.getUint32(80, true);
    if (!count || view2.byteLength !== 84 + count * 50) throw Error("The print model has an invalid triangle count.");
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], ids = /* @__PURE__ */ new Map(), parents = [], ranks = [];
    let volume = 0, surfaceArea = 0;
    const root = (id) => {
      while (parents[id] !== id) {
        parents[id] = parents[parents[id]];
        id = parents[id];
      }
      return id;
    };
    const connect = (a, b) => {
      a = root(a);
      b = root(b);
      if (a === b) return;
      if (ranks[a] < ranks[b]) [a, b] = [b, a];
      parents[b] = a;
      if (ranks[a] === ranks[b]) ranks[a]++;
    };
    function vertex(point) {
      const key = point.join(",");
      let id = ids.get(key);
      if (id === void 0) {
        id = parents.length;
        ids.set(key, id);
        parents.push(id);
        ranks.push(0);
      }
      return id;
    }
    for (let i2 = 0; i2 < count; i2++) {
      const points = [0, 1, 2].map((j) => [0, 1, 2].map((k) => view2.getFloat32(96 + i2 * 50 + j * 12 + k * 4, true)));
      for (const p of points) for (let k = 0; k < 3; k++) {
        if (!Number.isFinite(p[k])) throw Error("The print model contains invalid coordinates.");
        min[k] = Math.min(min[k], p[k]);
        max[k] = Math.max(max[k], p[k]);
      }
      const [a, b, c] = points, u = b.map((v2, k) => v2 - a[k]), v = c.map((v2, k) => v2 - a[k]);
      surfaceArea += Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
      volume += (a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
      const [ia, ib, ic] = points.map(vertex);
      connect(ia, ib);
      connect(ia, ic);
    }
    let components = 0;
    for (let i2 = 0; i2 < parents.length; i2++) if (root(i2) === i2) components++;
    return { triangles: count, vertices: parents.length, components, min, max, dimensions: max.map((value, i2) => value - min[i2]), volume: Math.abs(volume), surfaceArea, bytes: view2.byteLength };
  }
  function bedFit(dimensions, width, depth, clearance = 0) {
    if (!Array.isArray(dimensions) || dimensions.length < 2 || ![...dimensions.slice(0, 2), width, depth, clearance].every(Number.isFinite) || width <= 0 || depth <= 0 || clearance < 0) throw Error("Enter valid build plate dimensions.");
    const [x2, y] = dimensions, fit = (a, b) => a + clearance * 2 <= width + 0.05 && b + clearance * 2 <= depth + 0.05;
    return { fits: fit(x2, y) || fit(y, x2), rotated: !fit(x2, y) && fit(y, x2) };
  }

  // filament-preview.js
  function analyze(painting, settings, workerURL2, signal) {
    return new Promise((resolve, reject) => {
      let worker, timer, fallbackTimer, settled = false, fallingBack = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
        worker?.terminate();
        signal.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve(result);
      };
      const abort = () => finish(new DOMException("Color preview cancelled", "AbortError"));
      const fallback = () => {
        if (settled || fallingBack) return;
        fallingBack = true;
        clearTimeout(timer);
        worker?.terminate();
        fallbackTimer = setTimeout(() => {
          try {
            signal.throwIfAborted();
            const base = settings.bambuBackColor === "background" ? dominantArtworkColor(painting, settings.faceColor) : settings.faceColor;
            const { palette, map, width } = filamentPaint(painting, base, settings.filamentCount);
            finish(null, { palette, map, width });
          } catch (error) {
            finish(error);
          }
        }, 0);
      };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      try {
        worker = new Worker(workerURL2, { name: "clock-filament-preview" });
        worker.onmessage = ({ data }) => {
          if (data.id === 2) finish(data.error ? new Error(data.error) : null, data);
        };
        worker.onerror = (event) => {
          event.preventDefault();
          fallback();
        };
        const rgba = painting.rgba.slice();
        worker.postMessage({ id: 2, operation: "filament-proof", settings, artwork: { painting: { ...painting, rgba } } }, [rgba.buffer]);
        timer = setTimeout(fallback, 6e4);
      } catch {
        fallback();
      }
    });
  }
  var FilamentPreview = class {
    constructor({ workerURL: workerURL2, prepareRaster, onColorChange, onReset }) {
      this.workerURL = workerURL2;
      this.prepareRaster = prepareRaster;
      this.onColorChange = onColorChange;
      this.root = document.getElementById("filamentPreview");
      this.body = document.getElementById("filamentProofBody");
      this.status = document.getElementById("filamentProofStatus");
      this.canvas = document.getElementById("filamentProofCanvas");
      this.editors = document.getElementById("filamentEditors");
      this.reset = document.getElementById("resetFilamentColors");
      this.retry = document.getElementById("filamentProofRetry");
      this.mode = "print";
      for (const [id, mode] of [["proofOriginal", "original"], ["proofPrinted", "print"]]) document.getElementById(id).onclick = () => {
        this.mode = mode;
        this.draw();
      };
      this.editors.addEventListener("input", (event) => {
        if (event.target.matches('input[type="color"]')) onColorChange(event.target.dataset.source, event.target.value, false);
      });
      this.editors.addEventListener("change", (event) => {
        if (event.target.matches('input[type="color"]')) onColorChange(event.target.dataset.source, event.target.value, true);
      });
      this.reset.onclick = onReset;
      this.retry.onclick = () => {
        this.cached = null;
        this.update(this.current);
      };
    }
    cancel() {
      clearTimeout(this.timer);
      this.controller?.abort();
      this.controller = null;
      this.jobKey = null;
    }
    dispose() {
      this.cancel();
      this.cached = null;
    }
    update(current) {
      this.current = current;
      this.root.hidden = !current.enabled;
      if (!current.enabled) {
        this.cancel();
        return;
      }
      if (current.busy) {
        this.cancel();
        this.loading("Opening your artwork…");
        return;
      }
      if (this.cached?.key === current.key) {
        if (this.jobKey && this.jobKey !== current.key) this.cancel();
        this.draw();
        return;
      }
      if (this.jobKey === current.key) return;
      this.cancel();
      this.jobKey = current.key;
      this.loading("Preparing your printable colors…");
      const controller = new AbortController();
      this.controller = controller;
      this.timer = setTimeout(() => this.build(current, controller), 250);
    }
    loading(message) {
      this.root.dataset.ready = "false";
      this.root.setAttribute("aria-busy", "true");
      this.body.hidden = true;
      this.status.textContent = message;
      this.retry.hidden = true;
      this.reset.disabled = true;
    }
    async build(current, controller) {
      try {
        controller.signal.throwIfAborted();
        const painting = this.prepareRaster(current.snapshot), paint = await analyze(painting, current.snapshot.settings, this.workerURL, controller.signal);
        controller.signal.throwIfAborted();
        if (this.current.key !== current.key || !this.current.enabled || this.current.busy) return;
        this.cached = { key: current.key, painting, paint };
        this.draw();
      } catch (error) {
        if (error.name !== "AbortError" && this.current.key === current.key) {
          this.status.textContent = "Color preview unavailable. You can still export, or try the preview again.";
          this.retry.hidden = false;
        }
      } finally {
        if (this.controller === controller) {
          this.controller = null;
          this.jobKey = null;
          this.root.setAttribute("aria-busy", "false");
        }
      }
    }
    draw() {
      if (!this.cached || !this.current?.enabled || this.cached.key !== this.current.key || this.current.busy) return;
      const { painting, paint } = this.cached, { overrides, snapshot } = this.current;
      const displayKey = JSON.stringify([this.cached.key, overrides, this.mode, snapshot.settings.hole]);
      if (this.displayKey === displayKey && this.root.dataset.ready === "true") return;
      this.displayKey = displayKey;
      const mapped = filamentColors(paint.palette, overrides), merged = paint.palette.length - mapped.palette.length;
      this.root.dataset.ready = "true";
      this.root.setAttribute("aria-busy", "false");
      this.body.hidden = false;
      this.retry.hidden = true;
      this.status.textContent = `${mapped.palette.length} printable filament${mapped.palette.length === 1 ? "" : "s"}${merged ? ` · ${merged} matching color${merged === 1 ? "" : "s"} merged` : ""}.`;
      this.reset.disabled = !Object.keys(overrides).length;
      document.getElementById("proofOriginal").setAttribute("aria-pressed", String(this.mode === "original"));
      document.getElementById("proofPrinted").setAttribute("aria-pressed", String(this.mode === "print"));
      this.canvas.setAttribute("aria-label", this.mode === "original" ? "Original artwork colors, front view" : "Printable filament colors, front view");
      const signature = paint.palette.join(",");
      if (this.signature !== signature) {
        this.signature = signature;
        this.editors.replaceChildren();
        paint.palette.forEach((source, i2) => {
          const row = document.createElement("div"), label = document.createElement("label"), dot = document.createElement("i"), text = document.createElement("span"), small = document.createElement("small"), input = document.createElement("input"), value = document.createElement("span");
          row.className = "filament-editor";
          dot.style.background = source;
          text.textContent = i2 ? "Artwork region " + (i2 + 1) : "Back & face";
          small.textContent = source;
          text.append(small);
          label.append(dot, text);
          input.type = "color";
          input.id = "filamentColor" + i2;
          input.dataset.source = source;
          input.setAttribute("aria-label", `Filament color for ${source}`);
          label.htmlFor = input.id;
          value.className = "filament-color-value";
          row.append(label, input, value);
          this.editors.append(row);
        });
      }
      [...this.editors.children].forEach((row, i2) => {
        const input = row.querySelector("input");
        if (input.value.toUpperCase() !== mapped.colors[i2]) input.value = mapped.colors[i2];
        row.querySelector(".filament-color-value").textContent = `${mapped.indices[i2] + 1} · ${mapped.colors[i2]}`;
      });
      const n = painting.width, size = this.canvas.width, context = this.canvas.getContext("2d"), image = context.createImageData(size, size), { frame, rgba } = painting;
      const span = snapshot.settings.diameter / frame.scale * 1.08, palette = mapped.palette.map((color) => [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16)));
      const radius = snapshot.settings.hole / 2 / frame.scale, backed = usesSVGBacking(snapshot.settings), backRadius = snapshot.settings.diameter / 2 / frame.scale;
      const originalBase = [1, 3, 5].map((at) => parseInt(paint.palette[0].slice(at, at + 2), 16));
      for (let y = 0; y < size; y++) for (let x2 = 0; x2 < size; x2++) {
        const px = frame.cx + ((x2 + 0.5) / size - 0.5) * span, py = frame.cy + ((y + 0.5) / size - 0.5) * span;
        const distance2 = (px - frame.cx) ** 2 + (py - frame.cy) ** 2, target = (y * size + x2) * 4;
        if (distance2 < radius ** 2 || backed && distance2 > backRadius ** 2) continue;
        if (backed) {
          image.data.set(this.mode === "original" ? originalBase : palette[0], target);
          image.data[target + 3] = 255;
        }
        if (px < 0 || py < 0 || px >= n || py >= n) continue;
        const pixel = Math.floor(py) * n + Math.floor(px), source = pixel * 4;
        if (this.mode === "original") {
          if (backed) {
            const alpha = rgba[source + 3] / 255;
            for (let k = 0; k < 3; k++) image.data[target + k] = rgba[source + k] * alpha + originalBase[k] * (1 - alpha);
          } else image.data.set(rgba.subarray(source, source + 4), target);
        } else if (rgba[source + 3] >= 128) {
          image.data.set(palette[mapped.indices[paint.map[pixel]]], target);
          image.data[target + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
    }
  };

  // app.js
  var $ = (id) => document.getElementById(id);
  var colors = [["Terracotta", "#c47f62"], ["Oat milk", "#dfd5bd"], ["Sage", "#94a18a"], ["Forest", "#485c48"], ["Ink", "#434643"], ["Lavender", "#aaa0b5"], ["Dusty rose", "#c99d99"]];
  var initial = DEFAULT_SETTINGS;
  var state = { ...initial };
  var artworkOrientation = normalizeOrientation(null);
  var restoreReference = null;
  var restorePending = false;
  try {
    const saved = JSON.parse(localStorage.getItem("clock-factory") || "null");
    const artworkId = typeof saved?.artworkId === "string" && saved.artworkId.length <= 128 ? saved.artworkId : null;
    const validDesign = saved && (designs.some((d) => d.id === saved.design) || saved.design === "custom" && artworkId);
    if (validDesign && Number.isInteger(saved.color) && colors[saved.color] && ["smooth", "ripple", "grain"].includes(saved.texture)) {
      state = normalizeSettings(saved);
      if (state.design === "custom") state.design = "petal";
      artworkOrientation = normalizeOrientation(saved.artworkOrientation);
      if (artworkId) {
        restoreReference = { id: artworkId, useCustom: saved.design === "custom", orientation: [...artworkOrientation] };
        restorePending = true;
      }
    }
  } catch {
  }
  var activeArtwork = null;
  var gallerySequence = 0;
  var deletingArtwork = false;
  var settingsSaved = true;
  var customSVG = null;
  var customArtwork = null;
  var customImage = null;
  var customRevision = 0;
  var revisionCounter = 0;
  var importSequence = 0;
  var importPending = false;
  var zoom = 1;
  var rx = 12;
  var ry = -19;
  var rz = -7;
  var outlines = new Map(designs.map((d) => [d.id, shapePath(d.id)]));
  var workerURL = new URL("./export-worker.js", document.currentScript?.src || location.href);
  var meshViewURL = new URL("./mesh-view.js", document.currentScript?.src || location.href);
  var history = new DesignHistory();
  var meshStore = new MeshStore(2);
  var toastTimer;
  var saveTimer;
  var previewKey = "";
  var exportCache = null;
  var lastDownloadKey = null;
  var exportController = null;
  var applyingHistory = false;
  var backingViewCache = null;
  var previewMode = "design";
  var meshView = null;
  var loadedMeshKey = null;
  var meshPreviewKey = null;
  var meshPreviewController = null;
  var meshPreviewTimer = null;
  var checkController = null;
  var checkKey = null;
  var bed = { width: 220, depth: 220 };
  var bedPreset = "custom";
  try {
    const saved = JSON.parse(localStorage.getItem("clock-factory-bed") || "null");
    if (saved && [saved.width, saved.depth].every((v) => Number.isInteger(v) && v >= 80 && v <= 500)) {
      bed = { width: saved.width, depth: saved.depth };
      if (saved.preset === "a1" && saved.width === 256 && saved.depth === 256) bedPreset = "a1";
    }
  } catch {
  }
  function originalArtwork(settings = state) {
    return settings.design === "custom" && settings.svgDetail === "artwork";
  }
  function geometryKey(settings = state) {
    return JSON.stringify([settings.design, settings.design === "custom" ? [customRevision, ...artworkOrientation, settings.svgDetail, settings.svgRelief, settings.svgTone, settings.svgBacking, settings.svgBacking ? [settings.svgBackingThickness, settings.svgBackingMargin] : null] : null, settings.diameter, settings.thickness, settings.hole, originalArtwork(settings) ? "smooth" : settings.texture, settings.markers, settings.markers ? settings.hourStyle : null, settings.markers && settings.hourStyle !== "ticks" ? [settings.numberSize, settings.numberPosition] : null]);
  }
  function fileKey(settings = state) {
    return JSON.stringify([geometryKey(settings), settings.exportFormat, settings.exportFormat === "3mf" ? [colors[settings.color][1], settings.threeMFTarget, settings.threeMFTarget === "bambu-a1" ? [settings.filamentCount, settings.bambuBackColor, Object.entries(settings.bambuColors).sort()] : null] : null]);
  }
  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 4e3);
  }
  function updateSaveLabel() {
    document.querySelector(".local-status").textContent = restorePending ? "Opening saved SVG…" : importPending ? "Saving SVG…" : !settingsSaved ? "Session only" : activeArtwork && !activeArtwork.id ? "SVG: session only" : "Saved on this device";
  }
  function flushSave() {
    clearTimeout(saveTimer);
    if (restorePending) return;
    const reference = activeArtwork?.id || restoreReference?.id || null;
    let design = state.design;
    if (design === "custom" && !reference) design = "petal";
    if (restoreReference?.useCustom && !activeArtwork) design = "custom";
    try {
      localStorage.setItem("clock-factory", JSON.stringify({ ...state, design, artworkId: reference, artworkOrientation }));
      settingsSaved = true;
    } catch {
      settingsSaved = false;
    }
    updateSaveLabel();
  }
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 200);
  }
  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushSave();
  });
  function backingViewTransform() {
    const key = JSON.stringify([customRevision, artworkOrientation, state.diameter, state.svgBackingMargin]);
    if (backingViewCache?.key === key) return backingViewCache.transform;
    const { frame, width: n } = prepareFilamentRaster(designSnapshot()), scale = frame.scale * n / 400 * 360 / state.diameter;
    const transform = `matrix(${scale} 0 0 ${scale} ${200 - frame.cx * frame.scale * 360 / state.diameter} ${200 - frame.cy * frame.scale * 360 / state.diameter})`;
    backingViewCache = { key, transform };
    return transform;
  }
  function faceMarkup() {
    const markup = customSVG && state.design === "custom" ? `<g transform="${placementTransform(artworkOrientation)}">${customSVG}</g>` : `<path d="${outlines.get(state.design) || outlines.get("petal")}"/>`;
    return usesSVGBacking(state) ? `<g transform="${backingViewTransform()}">${markup}</g>` : markup;
  }
  function render({ forceInputs = false, historyGroup = null, recordHistory = true } = {}) {
    const color = colors[state.color][1], detailed = originalArtwork(), backed = usesSVGBacking(state);
    const nextPreviewKey = JSON.stringify([state.design, state.color, state.texture, state.markers, state.hourStyle, state.numberSize, state.numberPosition, state.diameter, state.svgDetail, customRevision, artworkOrientation, backed, backed ? [state.svgBackingMargin, state.hole] : null]);
    if (nextPreviewKey !== previewKey) {
      let ticks = "", numberClearance = "";
      if (state.markers && state.hourStyle !== "ticks") {
        ticks = `<g id="hourNumerals" fill="#f5e5cd">${hourNumeralMarkup(state)}</g>`;
        numberClearance = `<mask id="numberClearanceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill="white"/><g fill="black" stroke="black" stroke-width="${1.2 * 400 / state.diameter}" stroke-linejoin="round">${hourNumeralMarkup(state)}</g></mask>`;
      }
      if (state.markers && state.hourStyle === "ticks") for (let i2 = 0; i2 < 12; i2++) ticks += `<rect x="197.5" y="76" width="5" height="${i2 % 3 === 0 ? 17 : 10}" rx="2" transform="rotate(${i2 * 30} 200 200)" fill="#f5e5cd" opacity=".9"/>`;
      if (backed) ticks = `<g transform="translate(200 200) scale(0.9) translate(-200 -200)">${ticks}</g>`;
      $("clockSvg").innerHTML = `<defs><mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><g fill="white" stroke="none">${faceMarkup()}</g></mask>${numberClearance}<pattern id="ridges" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M-4 4L4 12M4 -4L12 4" stroke="#402e21" opacity=".12" stroke-width=".8"/><path d="M8 0L0 8" stroke="#fff" opacity=".14" stroke-width=".7"/></pattern><radialGradient id="light" cx="30%" cy="20%" r="90%"><stop stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#24190d" stop-opacity=".13"/></radialGradient></defs><g mask="url(#faceMask)"><rect width="400" height="400" fill="${color}"/><g${numberClearance ? ' mask="url(#numberClearanceMask)"' : ""}>${state.texture === "ripple" ? Array.from({ length: 44 }, (_, i2) => `<circle cx="200" cy="200" r="${12 + i2 * 4}" fill="none" stroke="${i2 % 2 ? "#fff0da" : "#774832"}" stroke-opacity="${i2 % 2 ? ".18" : ".23"}" stroke-width=".8"/>`).join("") : state.texture === "grain" ? '<rect width="400" height="400" fill="url(#ridges)"/>' : ""}</g><rect width="400" height="400" fill="url(#light)"/>${ticks}</g><g id="previewHands" style="filter:drop-shadow(1px 3px 2px #0003)"><path d="M197 206L193 142Q193 138 197 138L202 138L204 206Z" transform="rotate(-59 200 200)" fill="#f4ebd7"/><path d="M197 212L197 102Q197 98 200 98Q203 98 203 102L203 212Z" transform="rotate(49 200 200)" fill="#f4ebd7"/><circle cx="200" cy="200" r="8" fill="#e6ce9d"/><circle cx="200" cy="200" r="3" fill="#c1a46e"/></g>`;
      if (detailed) {
        const painted = document.createElementNS("http://www.w3.org/2000/svg", "g");
        painted.id = "originalArtwork";
        painted.setAttribute("transform", `${backed ? backingViewTransform() + " " : ""}${placementTransform(artworkOrientation)}`);
        painted.innerHTML = customArtwork;
        const face = $("clockSvg").querySelector('g[mask="url(#faceMask)"]');
        face.innerHTML = ticks;
        face.before(painted);
      }
      if (backed) {
        const svg = $("clockSvg"), ns = "http://www.w3.org/2000/svg", circle2 = document.createElementNS(ns, "circle"), mask = document.createElementNS(ns, "mask"), group = document.createElementNS(ns, "g");
        circle2.id = "svgBackingPreview";
        circle2.setAttribute("cx", "200");
        circle2.setAttribute("cy", "200");
        circle2.setAttribute("r", "180");
        circle2.setAttribute("fill", color);
        svg.insertBefore(circle2, svg.querySelector("defs").nextSibling);
        mask.id = "backingShaftMask";
        mask.setAttribute("maskUnits", "userSpaceOnUse");
        mask.setAttribute("x", "0");
        mask.setAttribute("y", "0");
        mask.setAttribute("width", "400");
        mask.setAttribute("height", "400");
        mask.innerHTML = `<rect width="400" height="400" fill="white"/><circle cx="200" cy="200" r="${state.hole / state.diameter * 180}" fill="black"/>`;
        svg.querySelector("defs").append(mask);
        svg.querySelector("#numberClearanceMask g")?.setAttribute("transform", "translate(200 200) scale(0.9) translate(-200 -200)");
        group.setAttribute("mask", "url(#backingShaftMask)");
        for (const child of [...svg.children]) if (child.tagName.toLowerCase() !== "defs" && child.id !== "previewHands") group.append(child);
        svg.insertBefore(group, $("previewHands"));
      }
      previewKey = nextPreviewKey;
    }
    document.querySelectorAll(".design-card").forEach((b) => {
      b.classList.toggle("selected", b.dataset.design === state.design);
      b.setAttribute("aria-pressed", b.dataset.design === state.design);
    });
    document.querySelectorAll(".swatch").forEach((b, i2) => {
      b.classList.toggle("selected", i2 === state.color);
      b.setAttribute("aria-pressed", i2 === state.color);
    });
    document.querySelectorAll("[data-texture]").forEach((b) => {
      b.classList.toggle("selected", b.dataset.texture === state.texture);
      b.setAttribute("aria-pressed", b.dataset.texture === state.texture);
    });
    ["diameter", "thickness", "hole", "markers"].forEach((id) => {
      const input = $(id);
      if (id === "markers") input.checked = state[id];
      else if (forceInputs || id === "diameter" || document.activeElement !== input && !input.dataset.editing) input.value = state[id];
    });
    $("diameterValue").textContent = state.diameter;
    $("diameter").setAttribute("aria-valuetext", `${state.diameter / 10} centimeters across`);
    $("colorName").textContent = colors[state.color][0];
    $("measure").textContent = state.diameter + " mm";
    $("exportSize").textContent = `${state.diameter} mm across · ${Number(artworkSurfaceHeight(state).toFixed(1))} mm ${backed ? "base + backing" : "base"}`;
    $("thicknessLabelText").textContent = backed ? "Artwork thickness" : "Base thickness";
    $("fitHint").textContent = `The threaded shaft must pass through the face and leave room for the nut.${backed ? " The backing adds " + backingDepth(state) + " mm below the artwork; include it and any relief when checking shaft length." : ""}`;
    $("svgBacking").checked = state.svgBacking;
    $("svgBackingOptions").hidden = !state.svgBacking;
    for (const id of ["svgBackingThickness", "svgBackingMargin"]) {
      $(id).value = state[id];
      $(id + "Value").textContent = state[id];
    }
    $("sizeHint").textContent = `${state.diameter / 10} cm across — ${state.diameter <= 160 ? "a compact clock for a shelf or desk." : state.diameter <= 220 ? "a lovely size for a desk or small wall." : "a statement piece for your wall. Check your printer’s bed size."}`;
    document.querySelectorAll("[data-size]").forEach((b) => {
      const active = Number(b.dataset.size) === state.diameter;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", active);
    });
    $("downloadGuide").hidden = lastDownloadKey !== fileKey();
    $("hourStyle").value = state.hourStyle;
    $("hourStyle").disabled = !state.markers;
    $("numeralOptions").hidden = !state.markers || state.hourStyle === "ticks";
    for (const id of ["numberSize", "numberPosition"]) {
      $(id).value = state[id];
      $(id + "Value").textContent = state[id];
    }
    $("svgDetailControls").hidden = state.design !== "custom";
    $("svgDetail").value = state.svgDetail;
    $("svgReliefControls").hidden = !detailed;
    $("svgRelief").value = state.svgRelief;
    $("svgReliefValue").textContent = state.svgRelief.toFixed(1);
    $("svgTone").value = state.svgTone;
    $("texture").hidden = $("textureLabel").hidden = detailed;
    $("faceColorHint").textContent = detailed ? "Your SVG keeps its original colors. This filament color is used for the back and edges." : "A preview of your filament color. Choose the matching filament when you print.";
    if (detailed && state.exportFormat === "3mf" && state.threeMFTarget === "bambu-a1" && state.bambuBackColor === "background") $("faceColorHint").textContent = "The back starts with the SVG background color. Adjust it in “See your print colors”, or choose “Use selected face color” in the export options to use this swatch.";
    updateExportFormatUI();
    const d = designs.find((d2) => d2.id === state.design);
    $("designTitle").innerHTML = d ? `The ${d.name} Clock <span>↗</span>` : "Your Custom Clock <span>↗</span>";
    $("designDescription").textContent = d?.description || "Your own shape. Your own sense of time.";
    $("clockObject").style.filter = `drop-shadow(3px ${Math.round(artworkSurfaceHeight(state) * 1.5)}px 0 ${color} ) drop-shadow(9px 19px 12px #726b4f30)`;
    if (forceInputs || document.activeElement !== $("diameterNumber") && !$("diameterNumber").dataset.editing) $("diameterNumber").value = state.diameter;
    if (forceInputs || document.activeElement !== $("projectName")) $("projectName").value = state.projectName;
    $("showHands").checked = state.showHands;
    const hands = $("clockSvg").querySelector("#previewHands");
    if (hands) hands.toggleAttribute("hidden", !state.showHands);
    updateArtworkUI();
    validateDimensions();
    persist();
    if (recordHistory) checkpointHistory(historyGroup);
    updateHistoryUI();
    updatePrintSummary();
    scheduleMeshPreview();
  }
  function captureSnapshot() {
    return { settings: { ...state }, orientation: [...artworkOrientation], artwork: activeArtwork ? { ...activeArtwork } : null, mask: customSVG, paint: customArtwork, image: customImage, revision: customRevision };
  }
  function snapshotKey() {
    return JSON.stringify([state, artworkOrientation, activeArtwork ? customRevision : null]);
  }
  function checkpointHistory(group = null) {
    if (!importPending && !restorePending && !applyingHistory) history.commit(captureSnapshot(), snapshotKey(), { group });
  }
  function updateHistoryUI() {
    const busy = importPending || restorePending || deletingArtwork || applyingHistory;
    $("undo").disabled = busy || !history.canUndo;
    $("redo").disabled = busy || !history.canRedo;
    $("openProject").disabled = $("saveProject").disabled = busy;
    $("projectUpload").disabled = busy;
  }
  async function restoreHistory(action) {
    if (importPending || restorePending || deletingArtwork || applyingHistory) return;
    const snapshot = history[action]();
    if (!snapshot) return;
    const sequence = ++importSequence;
    applyingHistory = true;
    importPending = !!snapshot.artwork;
    restoreReference = null;
    restorePending = false;
    state = { ...snapshot.settings };
    artworkOrientation = [...snapshot.orientation];
    customSVG = snapshot.mask;
    customArtwork = snapshot.paint;
    customImage = snapshot.image;
    customRevision = snapshot.revision;
    activeArtwork = snapshot.artwork ? { ...snapshot.artwork, id: null } : null;
    for (const id of ["thickness", "hole", "diameterNumber"]) delete $(id).dataset.editing;
    tab(state.design === "custom");
    render({ forceInputs: true, recordHistory: false });
    try {
      if (activeArtwork) {
        const saved = await saveSVG(activeArtwork);
        if (sequence === importSequence) activeArtwork = saved;
      }
    } catch (error) {
      if (sequence === importSequence) $("uploadStatus").textContent = error.message;
    } finally {
      if (sequence === importSequence) {
        applyingHistory = false;
        importPending = false;
        render({ forceInputs: true, recordHistory: false });
        refreshGallery();
        toast(action === "undo" ? "Previous design restored." : "Design change restored.");
      }
    }
  }
  $("undo").onclick = () => restoreHistory("undo");
  $("redo").onclick = () => restoreHistory("redo");
  $("projectName").addEventListener("input", () => {
    state.projectName = $("projectName").value;
    render({ historyGroup: "projectName" });
  });
  $("projectName").addEventListener("blur", () => {
    state.projectName = projectName(state.projectName);
    render();
    history.endGroup();
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches('input[type="range"]')) history.endGroup();
  });
  $("showHands").onchange = () => {
    state.showHands = $("showHands").checked;
    render();
  };
  try {
    $("welcome").hidden = localStorage.getItem("clock-factory-welcome-hidden") === "true";
  } catch {
  }
  $("dismissWelcome").onclick = () => {
    $("welcome").hidden = true;
    try {
      localStorage.setItem("clock-factory-welcome-hidden", "true");
    } catch {
    }
  };
  for (const list of document.querySelectorAll('[role="tablist"]')) list.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...list.querySelectorAll('[role="tab"]')], index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  });
  document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase(), editing = event.target instanceof Element && event.target.closest('textarea,[contenteditable="true"],input:not([type="range"]):not([type="checkbox"])');
    if (key === "s") {
      event.preventDefault();
      $("saveProject").click();
    } else if (key === "o") {
      event.preventDefault();
      $("openProject").click();
    } else if (!editing && (key === "z" || key === "y")) {
      event.preventDefault();
      restoreHistory(key === "y" || event.shiftKey ? "redo" : "undo");
    }
  });
  designs.forEach((d) => {
    const b = document.createElement("button");
    b.className = "design-card";
    b.dataset.design = d.id;
    b.innerHTML = `<svg viewBox="0 0 400 400" aria-hidden="true"><path d="${outlines.get(d.id)}" fill="${d.id === "petal" ? "#bf977b" : "#c5c9b6"}"/><path d="M200 130V200L245 227" fill="none" stroke="#f7f5e9" stroke-width="10" stroke-linecap="round"/></svg>${d.name}`;
    b.onclick = () => {
      cancelRestoration();
      state.design = d.id;
      render();
    };
    $("designGrid").append(b);
  });
  colors.forEach(([name, color], i2) => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = color;
    b.title = name;
    b.setAttribute("aria-label", name);
    b.onclick = () => {
      state.color = i2;
      render();
    };
    $("swatches").append(b);
  });
  document.querySelectorAll("[data-texture]").forEach((b) => b.onclick = () => {
    state.texture = b.dataset.texture;
    render();
  });
  function validateDimensions(focus = false) {
    const ids = ["diameterNumber", "thickness", "hole"], invalid = ids.map($).find((input) => input.value === "" || !input.validity.valid);
    for (const id of ids) $(id).setAttribute("aria-invalid", String($(id).value === "" || !$(id).validity.valid));
    $("dimensionError").hidden = !invalid || invalid.id === "diameterNumber";
    $("sizeError").hidden = !invalid || invalid.id !== "diameterNumber";
    if (invalid) {
      const size = invalid.id === "diameterNumber";
      $(size ? "sizeError" : "dimensionError").textContent = size ? "Enter a diameter from 100 to 300 mm, in steps of 1 mm." : `Enter ${invalid.id === "hole" ? "a center hole from 5 to 15" : "a face thickness from 2 to 10"} mm, in steps of 0.5 mm.`;
      if (focus) {
        if (!size) document.querySelector(".advanced-settings").open = true;
        invalid.focus();
      }
    }
    $("export").disabled = !!invalid || importPending || deletingArtwork || restorePending || !!exportController;
    return !invalid;
  }
  $("diameterNumber").addEventListener("input", () => {
    $("diameterNumber").dataset.editing = "true";
    if (!validateDimensions()) return;
    state.diameter = Number($("diameterNumber").value);
    render({ historyGroup: "diameter" });
  });
  $("diameterNumber").addEventListener("blur", () => {
    if (validateDimensions()) delete $("diameterNumber").dataset.editing;
  });
  ["diameter", "thickness", "hole", "markers", "svgBacking"].forEach((id) => $(id).addEventListener("input", () => {
    const input = $(id);
    if (id === "markers" || id === "svgBacking") state[id] = input.checked;
    else {
      if (id !== "diameter") input.dataset.editing = "true";
      if (!input.validity.valid || input.value === "") {
        validateDimensions();
        return;
      }
      state[id] = Number(input.value);
    }
    validateDimensions();
    render({ historyGroup: ["markers", "svgBacking"].includes(id) ? null : id });
  }));
  for (const id of ["hourStyle", "exportFormat", "svgDetail", "svgTone", "threeMFTarget", "filamentCount", "bambuBackColor"]) $(id).addEventListener("change", () => {
    const value = id === "filamentCount" ? Number($(id).value) : $(id).value, allowed = { hourStyle: ["ticks", "arabic", "roman"], exportFormat: ["stl", "3mf"], svgDetail: ["artwork", "silhouette"], svgTone: ["contrast", "dark", "light"], threeMFTarget: ["bambu-a1", "standard"], filamentCount: [2, 4], bambuBackColor: ["background", "face"] }[id];
    if (!allowed.includes(value)) return;
    state[id] = value;
    render();
  });
  for (const id of ["numberSize", "numberPosition", "svgRelief", "svgBackingThickness", "svgBackingMargin"]) $(id).addEventListener("input", () => {
    if (!$(id).validity.valid) return;
    state[id] = Number($(id).value);
    render({ historyGroup: id });
  });
  function updateExportFormatUI() {
    const format = state.exportFormat.toUpperCase();
    $("exportFormat").value = state.exportFormat;
    const bambu = state.exportFormat === "3mf" && state.threeMFTarget === "bambu-a1";
    const single = state.exportFormat === "stl";
    for (const [id, selected] of [["singleColorPrint", single], ["bambuColorPrint", bambu]]) {
      $(id).classList.toggle("selected", selected);
      $(id).setAttribute("aria-pressed", String(selected));
    }
    $("printModeLabel").textContent = single ? "One-color print" : bambu ? "Bambu A1 · color" : "Standard 3MF";
    $("printModeHint").textContent = single ? "A simple print in one filament. Your SVG details can still stand out in relief." : bambu ? `A1 / 0.4 mm · up to ${state.filamentCount} filaments. SVG colors become printable color regions; gradients become solid colors.` : "Original SVG colors are stored as a texture. Check that your software supports 3MF textures; this option does not assign filaments.";
    $("exportOptionsSummary").textContent = single ? "STL · one color" : bambu ? `A1 / 0.4 mm · up to ${state.filamentCount} colors` : "Standard 3MF · color texture";
    $("exportType").textContent = bambu ? "3MF · Bambu A1" : `${format} file`;
    $("exportFormatHint").textContent = originalArtwork() ? state.exportFormat === "3mf" ? "3MF keeps the SVG relief and original artwork as a color texture. Texture color support depends on your slicer." : "STL keeps the SVG details as relief. STL stores geometry; use 3MF to keep the artwork colors too." : state.exportFormat === "3mf" ? "3MF includes the mesh, millimeter units, and selected face color." : "STL exports the printable mesh. Colors are a filament preview.";
    $("threeMFOptions").hidden = state.exportFormat !== "3mf";
    $("threeMFTarget").value = state.threeMFTarget;
    $("filamentCount").value = state.filamentCount;
    $("bambuBackColor").value = state.bambuBackColor;
    $("bambuOptions").hidden = !bambu;
    if (bambu) $("exportFormatHint").textContent = "Open the .3mf as a project in Bambu Studio. Check your A1 0.4 mm and filament presets, then map the numbered colors to your AMS spools before slicing.";
    showFilamentPalette(exportCache?.key === fileKey() ? exportCache.palette : null);
    updateFilamentPreview();
    if (!exportController) $("export").innerHTML = `Download ${format} <span>↓</span>`;
  }
  function showFilamentPalette(palette) {
    $("filamentPalette").replaceChildren();
    $("paletteSummary").hidden = !palette?.length;
    if (!palette?.length) return;
    palette.forEach((color, i2) => {
      const chip = document.createElement("span"), dot = document.createElement("i");
      dot.style.backgroundColor = color;
      chip.append(dot, document.createTextNode(`${i2 + 1} · ${color}`));
      $("filamentPalette").append(chip);
    });
  }
  $("singleColorPrint").onclick = () => {
    state.exportFormat = "stl";
    render();
  };
  $("bambuColorPrint").onclick = () => {
    state.exportFormat = "3mf";
    state.threeMFTarget = "bambu-a1";
    setBuildPlate(256, 256, "a1");
    render();
  };
  $("downloadAgain").onclick = () => $("export").click();
  for (const id of ["thickness", "hole"]) $(id).addEventListener("blur", () => {
    if (validateDimensions()) {
      delete $(id).dataset.editing;
      $(id).value = state[id];
    }
  });
  function tab(upload) {
    $("uploadPanel").hidden = !upload;
    $("presetPanel").hidden = upload;
    for (const [id, active] of [["uploadTab", upload], ["presetsTab", !upload]]) {
      $(id).classList.toggle("selected", active);
      $(id).setAttribute("aria-selected", active);
      $(id).tabIndex = active ? 0 : -1;
    }
  }
  document.querySelectorAll("[data-size]").forEach((b) => b.onclick = () => {
    state.diameter = Number(b.dataset.size);
    render();
  });
  $("showGuide").onclick = () => $("helpDialog").showModal();
  $("uploadTab").onclick = () => tab(true);
  $("presetsTab").onclick = () => tab(false);
  $("designNav").onclick = () => {
    tab(false);
    $("designGrid").scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Six shapes. Endless possibilities. Pick your starting point.");
  };
  $("editorLink").onclick = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  function view() {
    $("clockObject").style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${zoom})`;
    const front = rx === 0 && ry === 0;
    $("frontView").classList.toggle("selected", front);
    $("angleView").classList.toggle("selected", !front);
  }
  $("frontView").onclick = () => {
    if (previewMode === "print") {
      meshView?.setView("front");
      return;
    }
    rx = ry = rz = 0;
    view();
  };
  $("angleView").onclick = () => {
    if (previewMode === "print") {
      meshView?.setView("angle");
      return;
    }
    rx = 12;
    ry = -19;
    rz = -7;
    view();
  };
  $("restoreView").onclick = () => {
    if (previewMode === "print") {
      meshView?.setView("angle");
      return;
    }
    zoom = 1;
    rx = 12;
    ry = -19;
    rz = -7;
    view();
  };
  $("zoomIn").onclick = () => {
    if (previewMode === "print") {
      meshView?.zoom(1 / 1.12);
      return;
    }
    zoom = Math.min(1.4, zoom + 0.1);
    view();
  };
  $("zoomOut").onclick = () => {
    if (previewMode === "print") {
      meshView?.zoom(1.12);
      return;
    }
    zoom = Math.max(0.6, zoom - 0.1);
    view();
  };
  var drag = null;
  $("clockStage").onpointerdown = (e) => {
    if (previewMode === "print") return;
    drag = [e.clientX, e.clientY, rx, ry];
    $("clockStage").setPointerCapture(e.pointerId);
  };
  var viewFrame = null;
  function scheduleView() {
    if (viewFrame === null) viewFrame = requestAnimationFrame(() => {
      viewFrame = null;
      view();
    });
  }
  $("clockStage").onpointermove = (e) => {
    if (!drag) return;
    ry = Math.max(-60, Math.min(60, drag[3] + (e.clientX - drag[0]) * 0.3));
    rx = Math.max(-50, Math.min(50, drag[2] - (e.clientY - drag[1]) * 0.3));
    scheduleView();
  };
  $("clockStage").onpointerup = $("clockStage").onpointercancel = () => drag = null;
  $("clockStage").addEventListener("wheel", (e) => {
    if (previewMode === "print") return;
    e.preventDefault();
    zoom = Math.min(1.4, Math.max(0.6, zoom - e.deltaY * 1e-3));
    scheduleView();
  }, { passive: false });
  $("reset").onclick = () => {
    setPreviewMode("design");
    applyingHistory = false;
    importSequence++;
    restorePending = false;
    restoreReference = null;
    importPending = false;
    activeArtwork = null;
    artworkOrientation = normalizeOrientation(null);
    $("uploadPanel").setAttribute("aria-busy", "false");
    $("export").disabled = !!exportController;
    exportController?.abort();
    state = { ...initial };
    customSVG = customArtwork = customImage = null;
    lastDownloadKey = null;
    for (const id of ["thickness", "hole", "diameterNumber"]) delete $(id).dataset.editing;
    $("svgUpload").value = "";
    $("uploadStatus").textContent = "";
    tab(false);
    $("restoreView").click();
    render({ forceInputs: true });
    validateDimensions();
    toast("A fresh start. Your saved SVGs are still available.");
  };
  $("help").onclick = () => $("helpDialog").showModal();
  $("closeHelp").onclick = $("gotIt").onclick = () => $("helpDialog").close();
  function cancelRestoration() {
    if (!restorePending && !restoreReference && !importPending) return;
    const wasLoading = importPending || restorePending;
    importSequence++;
    restorePending = false;
    restoreReference = null;
    importPending = false;
    applyingHistory = false;
    $("uploadPanel").setAttribute("aria-busy", "false");
    $("export").disabled = !!exportController;
    if (wasLoading) $("uploadStatus").textContent = "SVG loading cancelled.";
    updateSaveLabel();
  }
  function updateArtworkUI() {
    const busy = importPending || deletingArtwork;
    $("export").disabled = busy || restorePending || !!exportController;
    $("artworkCard").hidden = !activeArtwork;
    $("svgDropZone").classList.toggle("has-artwork", !!activeArtwork);
    $("artworkCard").setAttribute("aria-busy", String(busy));
    $("svgUpload").disabled = deletingArtwork;
    $("svgDropZone").setAttribute("aria-disabled", String(deletingArtwork));
    if (activeArtwork) {
      $("artworkName").textContent = activeArtwork.name;
      $("artworkName").title = activeArtwork.name;
      $("artworkThumbnail").src = activeArtwork.thumbnail;
      $("artworkThumbnail").style.transform = `matrix(${artworkOrientation.join(",")},0,0)`;
      $("artworkDetails").textContent = `SVG · ${activeArtwork.size < 1024 * 1024 ? Math.max(1, Math.round(activeArtwork.size / 1024)) + " KB" : (activeArtwork.size / (1024 * 1024)).toFixed(1) + " MB"}`;
      $("artworkSavedStatus").textContent = busy ? "Saving…" : activeArtwork.id ? "Saved on this device" : "Session only — SVG not saved";
      $("artworkSavedStatus").classList.toggle("session-only", !busy && !activeArtwork.id);
      $("useArtwork").hidden = state.design === "custom";
    }
    for (const id of ["useArtwork", "replaceArtwork", "removeArtwork", "artRotateLeft", "artRotateRight", "artMirrorX", "artMirrorY", "artResetOrientation", "svgDetail", "svgRelief", "svgTone", "svgBacking", "svgBackingThickness", "svgBackingMargin"]) $(id).disabled = busy;
    for (const button of $("savedArtworks").querySelectorAll("button")) {
      button.disabled = deletingArtwork;
      button.classList.toggle("selected", button.dataset.artworkId === activeArtwork?.id);
    }
    updateSaveLabel();
    updateHistoryUI();
    updateFilamentPreview();
  }
  async function refreshGallery() {
    const sequence = ++gallerySequence;
    try {
      const entries = await listSavedSVGs();
      if (sequence !== gallerySequence) return;
      $("savedArtworks").replaceChildren();
      $("savedArtworkSection").hidden = !entries.length;
      for (const entry of entries) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.artworkId = entry.id;
        button.title = entry.name;
        button.setAttribute("aria-label", `Use saved SVG: ${entry.name}`);
        const image = document.createElement("img");
        image.src = entry.thumbnail;
        image.alt = "";
        image.width = image.height = 53;
        const name = document.createElement("span");
        name.textContent = entry.name;
        button.append(image, name);
        button.onclick = () => {
          if (entry.id === activeArtwork?.id && !importPending) {
            state.design = "custom";
            render();
          } else loadSavedArtwork(entry.id);
        };
        $("savedArtworks").append(button);
      }
      updateArtworkUI();
    } catch {
      $("savedArtworkSection").hidden = true;
    }
  }
  function thumbnailFor(image) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, 128, 128);
    return canvas.toDataURL("image/png");
  }
  function activateArtwork(prepared, record3, { useCustom = true, orientation = null } = {}) {
    customSVG = prepared.markup;
    customArtwork = prepared.artworkMarkup;
    customImage = prepared.image;
    customRevision = ++revisionCounter;
    activeArtwork = { ...record3 };
    artworkOrientation = normalizeOrientation(orientation);
    if (useCustom) state.design = "custom";
    render();
  }
  async function importArtwork(file) {
    if (!file || deletingArtwork) return;
    cancelRestoration();
    const sequence = ++importSequence;
    importPending = true;
    $("uploadPanel").setAttribute("aria-busy", "true");
    $("export").disabled = true;
    $("uploadStatus").textContent = `Opening ${file.name}…`;
    updateArtworkUI();
    try {
      if (file.size > SVG_IMPORT_MAX_BYTES) throw Error("Please choose an SVG smaller than 5 MB.");
      const source = await file.text(), prepared = await prepareSVG(source);
      if (sequence !== importSequence) return;
      const record3 = { id: null, name: file.name, source, size: file.size, thumbnail: thumbnailFor(prepared.image) };
      activateArtwork(prepared, record3);
      let saved = false;
      try {
        const stored = await saveSVG(record3);
        if (sequence !== importSequence) {
          if (activeArtwork && !activeArtwork.id && activeArtwork.source === stored.source) {
            activeArtwork = { ...stored };
            updateArtworkUI();
            persist();
          }
          refreshGallery();
          return;
        }
        activeArtwork = { ...stored };
        saved = true;
      } catch (error) {
        if (sequence !== importSequence) return;
        $("uploadStatus").textContent = `Loaded ${file.name}. ${error.message}`;
      }
      if (sequence !== importSequence) return;
      if (saved) $("uploadStatus").textContent = `Loaded ${activeArtwork.name}. Saved on this device for next time.`;
      toast(saved ? "Your SVG is ready and saved on this device." : "Your SVG is ready. It is available for this session only.");
      refreshGallery();
    } catch (error) {
      if (sequence !== importSequence) return;
      $("uploadStatus").textContent = `Couldn’t import ${file.name}: ${error.message}`;
      toast(error.message);
    } finally {
      if (sequence === importSequence) {
        importPending = false;
        $("uploadPanel").setAttribute("aria-busy", "false");
        $("export").disabled = !!exportController;
        updateArtworkUI();
        persist();
        checkpointHistory();
        updateHistoryUI();
        scheduleMeshPreview();
      }
    }
  }
  async function loadSavedArtwork(id, { restoring = false, useCustom = true, orientation = null } = {}) {
    if (deletingArtwork) return;
    if (!restoring) cancelRestoration();
    const sequence = ++importSequence;
    importPending = true;
    $("uploadPanel").setAttribute("aria-busy", "true");
    $("export").disabled = true;
    $("uploadStatus").textContent = "Opening saved SVG…";
    updateArtworkUI();
    let recordRead = false;
    try {
      const record3 = await getSavedSVG(id);
      if (sequence !== importSequence) return;
      if (!record3) {
        if (restoring) restoreReference = null;
        throw Error("This saved SVG is no longer available. Choose its original file to import it again.");
      }
      recordRead = true;
      const prepared = await prepareSVG(record3.source);
      if (sequence !== importSequence) return;
      restoreReference = null;
      activateArtwork(prepared, record3, { useCustom, orientation });
      $("uploadStatus").textContent = `Loaded ${record3.name}. Saved on this device.`;
      if (useCustom) tab(true);
    } catch (error) {
      if (sequence !== importSequence) return;
      if (restoring && recordRead) restoreReference = null;
      $("uploadStatus").textContent = error.message;
      toast(error.message);
    } finally {
      if (sequence === importSequence) {
        restorePending = false;
        importPending = false;
        $("uploadPanel").setAttribute("aria-busy", "false");
        $("export").disabled = !!exportController;
        updateArtworkUI();
        persist();
        if (restoring) history.reset(captureSnapshot(), snapshotKey());
        else checkpointHistory();
        updateHistoryUI();
        scheduleMeshPreview();
      }
    }
  }
  $("svgUpload").onchange = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    await importArtwork(file);
  };
  $("svgDropZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    if (deletingArtwork) return;
    event.dataTransfer.dropEffect = "copy";
    $("svgDropZone").classList.add("drag-active");
  });
  $("svgDropZone").addEventListener("dragleave", () => $("svgDropZone").classList.remove("drag-active"));
  $("svgDropZone").addEventListener("drop", (event) => {
    event.preventDefault();
    $("svgDropZone").classList.remove("drag-active");
    importArtwork(event.dataTransfer.files[0]);
  });
  window.addEventListener("dragover", (event) => {
    if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
  });
  window.addEventListener("drop", (event) => {
    if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
  });
  $("replaceArtwork").onclick = () => $("svgUpload").click();
  $("useArtwork").onclick = () => {
    if (activeArtwork && !importPending) {
      state.design = "custom";
      render();
    }
  };
  for (const [id, action] of [["artRotateLeft", "left"], ["artRotateRight", "right"], ["artMirrorX", "mirrorX"], ["artMirrorY", "mirrorY"], ["artResetOrientation", "reset"]]) $(id).onclick = () => {
    if (!activeArtwork || importPending || deletingArtwork) return;
    artworkOrientation = transformOrientation(artworkOrientation, action);
    state.design = "custom";
    render();
  };
  $("removeArtwork").onclick = async () => {
    if (!activeArtwork || importPending || deletingArtwork) return;
    const removed = activeArtwork;
    deletingArtwork = true;
    updateArtworkUI();
    try {
      if (removed.id) await deleteSavedSVG(removed.id);
      activeArtwork = null;
      customSVG = customArtwork = customImage = null;
      customRevision = ++revisionCounter;
      restoreReference = null;
      artworkOrientation = normalizeOrientation(null);
      if (state.design === "custom") state.design = "petal";
      $("uploadStatus").textContent = `Removed ${removed.name} from saved artwork.`;
      render();
      await refreshGallery();
    } catch (error) {
      toast(error.message);
    } finally {
      deletingArtwork = false;
      updateArtworkUI();
      persist();
    }
  };
  function meshAsync(alpha, n, settings, signal, cachedSTL = null, artwork = null, onStage = () => {
  }, cachedStats = null) {
    return new Promise((resolve, reject) => {
      let worker = null, timer = null, settled = false, fallingBack = false;
      const clean = () => {
        clearTimeout(timer);
        worker?.terminate();
        signal.removeEventListener("abort", abort);
      };
      const finish = (error, buffer) => {
        if (settled) return;
        settled = true;
        clean();
        error ? reject(error) : resolve(buffer);
      };
      const abort = () => finish(new DOMException("Export cancelled", "AbortError"));
      const fallback = () => {
        if (settled || fallingBack) return;
        fallingBack = true;
        clearTimeout(timer);
        worker?.terminate();
        setTimeout(() => {
          if (settled) return;
          try {
            signal.throwIfAborted();
            const mesh = cachedSTL || makeClockSTL(alpha, n, settings, void 0, artwork), stats = cachedStats || analyzeSTL(mesh);
            let buffer = mesh, palette = null;
            if (settings.exportFormat === "3mf") {
              if (settings.threeMFTarget === "bambu-a1") {
                const result = stlToBambu3MF(mesh, { name: "Clock Factory clock face", color: settings.faceColor, painting: artwork?.painting, maxColors: settings.filamentCount, backColor: settings.bambuBackColor, colorOverrides: settings.bambuColors });
                buffer = result.buffer;
                palette = result.palette;
              } else buffer = stlTo3MF(mesh, { name: "Clock Factory clock face", color: settings.faceColor, artwork: artwork?.texture });
            }
            finish(null, { buffer, stlBuffer: mesh, stats, palette });
          } catch (error) {
            finish(error);
          }
        }, 0);
      };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      try {
        worker = new Worker(workerURL);
        worker.onmessage = ({ data }) => {
          if (data.id !== 1 || settled) return;
          if (data.error) {
            finish(new Error(data.error));
            return;
          }
          if (data.stage) onStage(data.stage);
          if (data.buffer) finish(null, { buffer: data.buffer, stlBuffer: data.stlBuffer || data.buffer, stats: data.stats, palette: data.palette });
        };
        worker.onerror = (event) => {
          event.preventDefault();
          fallback();
        };
        const copy = (cachedSTL || alpha.buffer).slice(0);
        const transferredArtwork = artwork ? { rgba: artwork.rgba?.slice(), texture: artwork.texture ? { ...artwork.texture, png: artwork.texture.png.slice() } : null, painting: artwork.painting ? { ...artwork.painting, rgba: artwork.painting.rgba.slice() } : null } : null;
        const transfers = [copy];
        if (transferredArtwork?.rgba) transfers.push(transferredArtwork.rgba.buffer);
        if (transferredArtwork?.texture) transfers.push(transferredArtwork.texture.png.buffer);
        if (transferredArtwork?.painting) transfers.push(transferredArtwork.painting.rgba.buffer);
        worker.postMessage({ id: 1, ...cachedSTL ? { stlBuffer: copy } : { alpha: copy }, n, settings, artwork: transferredArtwork, stats: cachedStats }, transfers);
        timer = setTimeout(fallback, 6e4);
      } catch {
        fallback();
      }
    });
  }
  function downloadClock(blob, settings, key) {
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = `clock-factory-${settings.design}-${settings.diameter}mm${settings.exportFormat === "3mf" && settings.threeMFTarget === "bambu-a1" ? "-bambu-a1" : ""}.${settings.exportFormat}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e4);
    lastDownloadKey = key;
    $("downloadGuide").hidden = fileKey() !== key;
    const bambu = settings.exportFormat === "3mf" && settings.threeMFTarget === "bambu-a1";
    const steps = bambu ? [
      "Open the .3mf in Bambu Studio and choose “Open as project” to load its colors.",
      "Choose your actual filament presets and match each numbered color to an AMS spool.",
      "Check the flat side is on the plate, review flushing volumes, then slice and print."
    ] : [
      `Open the .${settings.exportFormat} file in your printer’s slicer.`,
      "Place the flat side on the print bed and check the dimensions.",
      "Slice and print, then fit your clock movement and hands."
    ];
    $("downloadSteps").replaceChildren(...steps.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
    $("downloadNote").textContent = bambu ? "A1 · 0.4 mm nozzle. Up to 4 colors with one AMS Lite. Reopen your .clock project in Clock Factory to edit the design." : settings.exportFormat === "stl" ? "STL contains the shape and raised details. For colored SVG artwork on your A1, choose Bambu A1 · colors above." : "Standard 3MF contains a color texture. For AMS filament assignments, choose Bambu A1 · colors above.";
    toast(fileKey() === key ? "Your print file is ready. Next steps are below the download button." : `Your ${settings.diameter} mm clock was exported. Download again to include your latest edits.`);
  }
  function paintHourDetails(context, settings, frame = null) {
    if (!settings.markers) return;
    context.save();
    context.fillStyle = "#f5e5cd";
    if (frame && usesSVGBacking(settings)) {
      const scale = settings.diameter / (frame.n * frame.scale);
      context.transform(scale, 0, 0, scale, frame.cx * 400 / frame.n - 200 * scale, frame.cy * 400 / frame.n - 200 * scale);
    }
    if (settings.hourStyle !== "ticks") {
      const svg = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${hourNumeralMarkup(settings)}</svg>`, "image/svg+xml");
      for (const path2 of svg.querySelectorAll("path")) context.fill(new Path2D(path2.getAttribute("d")), "evenodd");
    } else {
      for (let i2 = 0; i2 < 12; i2++) {
        context.save();
        context.translate(200, 200);
        context.rotate(i2 * Math.PI / 6);
        context.beginPath();
        context.roundRect(-2.5, -124, 5, i2 % 3 === 0 ? 17 : 10, 2);
        context.fill();
        context.restore();
      }
    }
    context.restore();
  }
  function designSnapshot() {
    const settings = { ...state, faceColor: colors[state.color][1] };
    return { settings, geometry: geometryKey(settings), image: customImage, placement: [...artworkOrientation] };
  }
  async function ensureMesh(snapshot, signal, onStage = () => {
  }) {
    const { settings, geometry, image, placement } = snapshot;
    const result = await meshStore.get(geometry, async (jobSignal, stage) => {
      jobSignal.throwIfAborted();
      stage("outline");
      const n = Math.ceil(settings.diameter / 0.15), canvas = document.createElement("canvas");
      canvas.width = canvas.height = n;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.scale(n / 400, n / 400);
      if (settings.design === "custom") drawPlacedArtwork(ctx, image, placement);
      else {
        ctx.fillStyle = "#fff";
        ctx.fill(new Path2D(outlines.get(settings.design)));
      }
      const pixels = ctx.getImageData(0, 0, n, n).data, alpha = new Uint8Array(n * n);
      for (let i2 = 0; i2 < alpha.length; i2++) alpha[i2] = pixels[i2 * 4 + 3];
      let artwork = null;
      if (originalArtwork(settings)) {
        const frame = artworkFrame(alpha, n, settings.diameter, settings);
        paintHourDetails(ctx, settings, frame);
        const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        jobSignal.throwIfAborted();
        if (!png) throw Error("The SVG color artwork could not be prepared.");
        artwork = { rgba: pixels, texture: { png: new Uint8Array(await png.arrayBuffer()), frame, thickness: artworkSurfaceHeight(settings) } };
      }
      jobSignal.throwIfAborted();
      const mesh = await meshAsync(alpha, n, { ...settings, exportFormat: "stl" }, jobSignal, null, artwork, stage);
      return { stlBuffer: mesh.stlBuffer, stats: mesh.stats, artwork: artwork ? { texture: artwork.texture } : null };
    }, { signal, onStage });
    updatePrintSummary();
    return result;
  }
  function prepareFilamentRaster(snapshot, mesh) {
    const { settings, image, placement } = snapshot, n = Math.ceil(settings.diameter / 0.15), canvas = document.createElement("canvas");
    canvas.width = canvas.height = n;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.scale(n / 400, n / 400);
    if (settings.design === "custom") drawPlacedArtwork(context, image, placement);
    else {
      context.fillStyle = "#fff";
      context.fill(new Path2D(outlines.get(settings.design)));
    }
    const alpha = new Uint8Array(n * n), pixels = context.getImageData(0, 0, n, n).data;
    for (let i2 = 0; i2 < alpha.length; i2++) alpha[i2] = pixels[i2 * 4 + 3];
    const frame = mesh?.artwork?.texture.frame || artworkFrame(alpha, n, settings.diameter, settings);
    if (!originalArtwork(settings)) {
      context.globalCompositeOperation = "source-in";
      context.fillStyle = settings.faceColor;
      context.fillRect(0, 0, 400, 400);
    }
    context.globalCompositeOperation = "source-atop";
    paintHourDetails(context, settings, frame);
    return { rgba: context.getImageData(0, 0, n, n).data, width: n, height: n, frame, thickness: artworkSurfaceHeight(settings) };
  }
  function updateFilamentPreview() {
    const snapshot = designSnapshot(), settings = snapshot.settings;
    const key = JSON.stringify([settings.design, settings.design === "custom" ? [customRevision, ...artworkOrientation, settings.svgDetail, settings.svgBacking, settings.svgBacking ? settings.svgBackingMargin : null] : null, settings.diameter, settings.faceColor, settings.markers ? [settings.hourStyle, settings.numberSize, settings.numberPosition] : false, settings.filamentCount, settings.bambuBackColor]);
    filamentPreview.update({ enabled: state.exportFormat === "3mf" && state.threeMFTarget === "bambu-a1", busy: importPending || restorePending || deletingArtwork, key, snapshot, overrides: state.bambuColors });
  }
  var stageMessage = (stage) => ({ outline: "Tracing the clock outline…", details: "Adding the printable details…", mesh: "Closing the print mesh…", package: "Preparing your 3MF file…", filaments: "Mapping your SVG colors to printable filaments…" })[stage] || "Checking your model…";
  function updatePrintSummary() {
    const key = geometryKey(), result = meshStore.peek(key), stats = result?.stats;
    if (checkController && key !== checkKey) checkController.abort();
    $("modelDimensions").textContent = stats ? stats.dimensions.map((value) => Number(value.toFixed(1))).join(" × ") : `${state.diameter} mm span`;
    $("modelVolume").textContent = stats ? (stats.volume / 1e3).toFixed(1) : "—";
    $("modelParts").textContent = stats ? String(stats.components) : "—";
    $("printCheckStatus").textContent = stats ? stats.components > 1 ? `${stats.components} separate pieces. Plan a backing or assembly before printing.` : "Closed print mesh checked. Add the movement and hands after printing." : "Check the model to see its exact dimensions, relief, and separate parts.";
    $("printCheckStatus").dataset.tone = stats ? stats.components > 1 ? "warning" : "success" : "neutral";
    $("printCheckStatus").dataset.checked = String(!!stats);
    const valid = [$("bedWidth"), $("bedDepth")].every((input) => input.value !== "" && input.validity.valid);
    const fit = stats ? bedFit(stats.dimensions, bed.width, bed.depth) : null;
    $("bedLabel").textContent = `${bed.width} × ${bed.depth} mm${valid && fit ? fit.fits ? " · Fits" : " · Too small" : ""}`;
    $("bedLabel").dataset.tone = valid && fit ? fit.fits ? "success" : "warning" : "neutral";
    $("printerPreset").value = bedPreset;
    if (stats && valid && !fit.fits) {
      $("printCheckStatus").textContent = `${stats.components > 1 ? stats.components + " separate pieces." : "Closed mesh checked."} Too large for your ${bed.width} × ${bed.depth} mm build plate.`;
      $("printCheckStatus").dataset.tone = "warning";
    }
    $("bedStatus").textContent = !valid ? "Enter build plate dimensions from 80 to 500 mm." : !fit ? "Check the model to verify its fit on this build plate." : fit.fits ? fit.rotated ? "Fits after a quarter turn on the build plate." : "Fits on your build plate." : "This model is larger than your build plate. Reduce its size or choose a larger printer.";
    $("bedStatus").dataset.tone = valid && fit ? fit.fits ? "success" : "warning" : "neutral";
    $("fitToBed").hidden = !valid || !fit || fit.fits;
    $("connectArtwork").hidden = state.design !== "custom" || state.svgBacking || !stats || stats.components < 2;
    $("connectArtwork").disabled = !!checkController || importPending || restorePending || deletingArtwork;
    if (meshView) meshView.setBed(bed.width, bed.depth, fit?.fits !== false, $("meshBed").checked);
  }
  function saveBuildPlate() {
    try {
      localStorage.setItem("clock-factory-bed", JSON.stringify({ ...bed, preset: bedPreset }));
    } catch {
    }
  }
  function setBuildPlate(width, depth, preset = "custom") {
    bed = { width, depth };
    bedPreset = preset;
    $("bedWidth").value = width;
    $("bedDepth").value = depth;
    saveBuildPlate();
  }
  $("printerPreset").onchange = () => {
    if ($("printerPreset").value === "a1") setBuildPlate(256, 256, "a1");
    else {
      bedPreset = "custom";
      saveBuildPlate();
    }
    updatePrintSummary();
  };
  for (const [id, key] of [["bedWidth", "width"], ["bedDepth", "depth"]]) {
    $(id).value = bed[key];
    $(id).addEventListener("input", () => {
      bedPreset = "custom";
      if ([$("bedWidth"), $("bedDepth")].every((input) => input.value !== "" && input.validity.valid)) {
        bed = { width: Number($("bedWidth").value), depth: Number($("bedDepth").value) };
        saveBuildPlate();
      }
      updatePrintSummary();
    });
  }
  $("fitToBed").onclick = () => {
    const stats = meshStore.peek(geometryKey())?.stats;
    if (!stats) return;
    const [x2, y] = stats.dimensions, scale = Math.max(Math.min((bed.width - 4) / x2, (bed.depth - 4) / y), Math.min((bed.width - 4) / y, (bed.depth - 4) / x2));
    const diameter = Math.min(300, Math.floor(state.diameter * scale));
    if (diameter < 100) {
      toast("This design needs a larger build plate at the minimum 100 mm size.");
      return;
    }
    state.diameter = diameter;
    render({ forceInputs: true });
    toast(`Resized to ${diameter} mm, with space around the print.`);
  };
  $("checkModel").onclick = async () => {
    if (checkController || importPending || restorePending || deletingArtwork || !validateDimensions(true)) return;
    const controller = new AbortController(), snapshot = designSnapshot();
    checkController = controller;
    checkKey = snapshot.geometry;
    $("checkModel").disabled = true;
    $("checkModel").textContent = "Checking…";
    try {
      await ensureMesh(snapshot, controller.signal, (stage) => {
        if (snapshot.geometry === geometryKey()) $("printCheckStatus").textContent = stageMessage(stage);
      });
    } catch (error) {
      if (error.name !== "AbortError") toast("Could not check model: " + error.message);
    } finally {
      if (checkController === controller) {
        checkController = null;
        $("checkModel").disabled = false;
        $("checkModel").textContent = "Check model";
        updatePrintSummary();
      }
    }
  };
  $("connectArtwork").onclick = async () => {
    if (state.design !== "custom" || checkController || importPending || restorePending || deletingArtwork) return;
    state.svgBacking = true;
    render({ forceInputs: true });
    const requested = geometryKey();
    await $("checkModel").onclick();
    if (requested === geometryKey() && meshStore.peek(requested)?.stats.components === 1) toast("Your SVG now prints as one piece on a round backing.");
  };
  function setPreviewMode(mode) {
    previewMode = mode;
    for (const [id, active] of [["designPreview", mode === "design"], ["printPreview", mode === "print"]]) {
      $(id).classList.toggle("selected", active);
      $(id).setAttribute("aria-selected", String(active));
      $(id).tabIndex = active ? 0 : -1;
    }
    $("preview").dataset.mode = mode;
    $("clockObject").hidden = $("clockShadow").hidden = $("measureLine").hidden = mode === "print";
    $("showHandsRow").hidden = mode === "print";
    $("meshOptions").hidden = mode !== "print";
    $("previewBadge").textContent = mode === "print" ? "Actual print model" : "Design preview";
    if (mode === "design") {
      clearTimeout(meshPreviewTimer);
      meshPreviewTimer = null;
      meshPreviewController?.abort();
      meshPreviewController = null;
      meshPreviewKey = null;
      $("meshCanvas").hidden = $("meshState").hidden = true;
      meshView?.setVisible(false);
    } else scheduleMeshPreview(true);
  }
  function scheduleMeshPreview(immediate = false) {
    if (previewMode !== "print") return;
    const snapshot = designSnapshot(), key = snapshot.geometry;
    if (importPending || restorePending || deletingArtwork) {
      clearTimeout(meshPreviewTimer);
      meshPreviewTimer = null;
      meshPreviewController?.abort();
      meshPreviewController = null;
      meshPreviewKey = null;
      $("meshCanvas").hidden = true;
      $("meshState").hidden = false;
      $("meshStateText").textContent = "Opening your artwork…";
      return;
    }
    if (key === loadedMeshKey && meshView) {
      clearTimeout(meshPreviewTimer);
      meshPreviewTimer = null;
      meshPreviewController?.abort();
      meshPreviewController = null;
      meshPreviewKey = key;
      meshView.setAppearance(snapshot.settings.faceColor, $("meshColors").checked, $("meshWireframe").checked);
      $("meshState").hidden = true;
      $("meshCanvas").hidden = false;
      meshView.setVisible(true);
      return;
    }
    if (key === meshPreviewKey && (meshPreviewController || meshPreviewTimer)) return;
    clearTimeout(meshPreviewTimer);
    meshPreviewController?.abort();
    meshPreviewKey = key;
    meshView?.setVisible(false);
    $("meshCanvas").hidden = true;
    $("meshState").hidden = false;
    $("meshRetry").hidden = true;
    $("meshStateText").textContent = "Preparing your printable model…";
    $("meshState").dataset.loading = "true";
    meshPreviewTimer = setTimeout(async () => {
      meshPreviewTimer = null;
      const controller = new AbortController();
      meshPreviewController = controller;
      try {
        const result = await ensureMesh(snapshot, controller.signal, (stage) => {
          if (!controller.signal.aborted) $("meshStateText").textContent = stageMessage(stage);
        });
        controller.signal.throwIfAborted();
        if (previewMode !== "print" || key !== geometryKey()) return;
        if (!meshView) {
          const { PrintView } = await import(meshViewURL.href);
          controller.signal.throwIfAborted();
          meshView = new PrintView($("meshCanvas"), { onError: (error) => {
            meshView?.dispose();
            meshView = null;
            loadedMeshKey = null;
            $("meshCanvas").hidden = true;
            $("meshState").hidden = false;
            $("meshStateText").textContent = error.message;
            $("meshRetry").hidden = false;
          } });
        }
        await meshView.setModel(result, snapshot.settings, { signal: controller.signal });
        controller.signal.throwIfAborted();
        if (previewMode !== "print" || key !== geometryKey()) return;
        loadedMeshKey = key;
        $("meshCanvas").dataset.geometryKey = key;
        $("meshCanvas").dataset.triangles = String(result.stats.triangles);
        $("meshCanvas").hidden = false;
        $("meshState").hidden = true;
        meshView.setAppearance(colors[state.color][1], $("meshColors").checked, $("meshWireframe").checked);
        meshView.setVisible(true);
        updatePrintSummary();
      } catch (error) {
        if (error.name !== "AbortError" && previewMode === "print" && key === geometryKey()) {
          $("meshState").hidden = false;
          $("meshState").dataset.loading = "false";
          $("meshStateText").textContent = meshStore.peek(key) ? "The print model is checked, but 3D graphics are unavailable on this device. You can still download your model." : `Could not prepare this model: ${error.message}`;
          $("meshRetry").hidden = false;
          meshPreviewKey = null;
        }
      } finally {
        if (meshPreviewController === controller) meshPreviewController = null;
      }
    }, immediate ? 0 : 400);
  }
  $("designPreview").onclick = () => setPreviewMode("design");
  $("printPreview").onclick = () => setPreviewMode("print");
  $("meshRetry").onclick = () => {
    loadedMeshKey = meshPreviewKey = null;
    scheduleMeshPreview(true);
  };
  for (const id of ["meshColors", "meshWireframe"]) $(id).onchange = () => meshView?.setAppearance(colors[state.color][1], $("meshColors").checked, $("meshWireframe").checked);
  $("meshBed").onchange = updatePrintSummary;
  $("openProject").onclick = () => $("projectUpload").click();
  $("saveProject").onclick = () => {
    if (importPending || restorePending || deletingArtwork) return;
    try {
      const text = serializeProject(state, activeArtwork, artworkOrientation), url = URL.createObjectURL(new Blob([text], { type: "application/json" })), link = document.createElement("a");
      link.href = url;
      link.download = projectFilename(state.projectName);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e4);
      toast("Project saved with your settings and original SVG. Open the .clock file to continue on another device.");
    } catch (error) {
      toast("Could not save project: " + error.message);
    }
  };
  $("projectUpload").onchange = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file || deletingArtwork) return;
    cancelRestoration();
    const sequence = ++importSequence;
    importPending = true;
    updateArtworkUI();
    try {
      if (file.size > MAX_PROJECT_BYTES) throw Error("Choose a project smaller than 12 MB.");
      const project = parseProject(await file.text()), prepared = project.artwork ? await prepareSVG(project.artwork.source) : null;
      if (sequence !== importSequence) return;
      state = { ...project.settings };
      artworkOrientation = project.orientation;
      if (prepared) {
        customSVG = prepared.markup;
        customArtwork = prepared.artworkMarkup;
        customImage = prepared.image;
        activeArtwork = { ...project.artwork, id: null, size: new TextEncoder().encode(project.artwork.source).byteLength, thumbnail: thumbnailFor(prepared.image) };
      } else {
        customSVG = customArtwork = customImage = null;
        activeArtwork = null;
      }
      customRevision = ++revisionCounter;
      render({ forceInputs: true });
      tab(state.design === "custom");
      if (activeArtwork) {
        try {
          const saved = await saveSVG(activeArtwork);
          if (sequence !== importSequence) return;
          activeArtwork = saved;
        } catch (error) {
          if (sequence !== importSequence) return;
          $("uploadStatus").textContent = error.message;
        }
      }
      if (sequence !== importSequence) return;
      if (activeArtwork) $("uploadStatus").textContent = `Loaded ${activeArtwork.name}. ${activeArtwork.id ? "Saved on this device." : "Available for this session."}`;
      toast(`Opened ${state.projectName}. Your settings and artwork are restored.`);
      refreshGallery();
    } catch (error) {
      if (sequence === importSequence) toast("Could not open project: " + error.message);
    } finally {
      if (sequence === importSequence) {
        importPending = false;
        updateArtworkUI();
        persist();
        checkpointHistory();
        updateHistoryUI();
        updatePrintSummary();
        scheduleMeshPreview();
      }
    }
  };
  window.addEventListener("pagehide", () => {
    meshPreviewController?.abort();
    checkController?.abort();
    meshView?.dispose();
    filamentPreview.dispose();
  });
  $("cancelExport").onclick = () => exportController?.abort();
  $("export").onclick = async () => {
    if (importPending || deletingArtwork || restorePending || exportController || !validateDimensions(true)) return;
    const snapshot = designSnapshot(), settings = snapshot.settings, key = fileKey(settings);
    if (exportCache?.key === key) {
      showFilamentPalette(exportCache.palette);
      downloadClock(exportCache.blob, settings, key);
      return;
    }
    const controller = new AbortController();
    exportController = controller;
    const button = $("export");
    button.disabled = true;
    button.textContent = "Preparing your clock…";
    $("exportProgress").hidden = false;
    $("printSection").setAttribute("aria-busy", "true");
    $("exportStatus").textContent = "Preparing your shape… You can keep designing.";
    await new Promise((r) => setTimeout(r, 0));
    try {
      controller.signal.throwIfAborted();
      const onStage = (stage) => {
        $("exportStatus").textContent = stageMessage(stage);
        const progress = $("exportProgress").querySelector("progress");
        progress.max = 100;
        progress.value = { outline: 15, details: 40, mesh: 70, filaments: 80, package: 90 }[stage] || 5;
      };
      const mesh = await ensureMesh(snapshot, controller.signal, onStage);
      let artwork = mesh.artwork;
      if (settings.exportFormat === "3mf" && settings.threeMFTarget === "bambu-a1") {
        onStage("filaments");
        artwork = { ...artwork, painting: prepareFilamentRaster(snapshot, mesh) };
        await new Promise((resolve) => setTimeout(resolve, 0));
        controller.signal.throwIfAborted();
      }
      const result = settings.exportFormat === "3mf" ? await meshAsync(null, 0, settings, controller.signal, mesh.stlBuffer, artwork, onStage, mesh.stats) : { buffer: mesh.stlBuffer };
      controller.signal.throwIfAborted();
      const blob = new Blob([result.buffer], { type: settings.exportFormat === "3mf" ? "model/3mf" : "model/stl" });
      exportCache = { key, blob, palette: result.palette };
      showFilamentPalette(result.palette);
      downloadClock(blob, settings, key);
    } catch (error) {
      if (error.name === "AbortError") toast("Download cancelled. Your design is still here.");
      else toast("Could not export: " + error.message);
    } finally {
      exportController = null;
      button.disabled = importPending || deletingArtwork || restorePending;
      updateExportFormatUI();
      validateDimensions();
      $("exportProgress").hidden = true;
      $("printSection").setAttribute("aria-busy", "false");
    }
  };
  var filamentPreview = new FilamentPreview({ workerURL, prepareRaster: prepareFilamentRaster, onColorChange: (source, color, final) => {
    const overrides = { ...state.bambuColors };
    if (source === color.toUpperCase()) delete overrides[source];
    else overrides[source] = color;
    state.bambuColors = normalizeFilamentOverrides(overrides);
    render({ historyGroup: "filament-" + source });
    if (final) history.endGroup();
  }, onReset: () => {
    state.bambuColors = {};
    render();
  } });
  render();
  view();
  refreshGallery();
  if (restoreReference) {
    const reference = { ...restoreReference };
    if (reference.useCustom) tab(true);
    loadSavedArtwork(reference.id, { restoring: true, useCustom: reference.useCustom, orientation: reference.orientation });
  }
})();
/*! Bundled license information:

polygon-clipping/dist/polygon-clipping.umd.js:
  (**
   * splaytree v3.1.2
   * Fast Splay tree for Node and browser
   *
   * @author Alexander Milevski <info@w8r.name>
   * @license MIT
   * @preserve
   *)
  (*! *****************************************************************************
      Copyright (c) Microsoft Corporation. All rights reserved.
      Licensed under the Apache License, Version 2.0 (the "License"); you may not use
      this file except in compliance with the License. You may obtain a copy of the
      License at http://www.apache.org/licenses/LICENSE-2.0

      THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
      KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
      WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
      MERCHANTABLITY OR NON-INFRINGEMENT.

      See the Apache Version 2.0 License for specific language governing permissions
      and limitations under the License.
      ***************************************************************************** *)
*/
