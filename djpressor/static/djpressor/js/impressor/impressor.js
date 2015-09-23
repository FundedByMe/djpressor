(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Impressor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// Algorithm by @GameAlchemist at http://stackoverflow.com/a/19144434/1584052
var downScaleImage = function (scale, srcImageData, blankTargetImageData) {
  var sqScale = scale * scale; // square scale = area of source pixel within target
  var sw = srcImageData.width; // source image width
  var sh = srcImageData.height; // source image height
  var tw = blankTargetImageData.width; // target image width
  var th = blankTargetImageData.height; // target image height
  var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
  var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
  var tX = 0, tY = 0; // rounded tx, ty
  var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
  // weight is weight of current source point within target.
  // next weight is weight of current source point within next target's point.
  var crossX = false; // does scaled px cross its current px right border ?
  var crossY = false; // does scaled px cross its current px bottom border ?
  var sBuffer = srcImageData.data; // source buffer 8 bit rgba
  var tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
  var sR = 0, sG = 0,  sB = 0; // source's current point r,g,b
  /* untested !
  var sA = 0;  //source alpha  */

  for (sy = 0; sy < sh; sy++) {
    ty = sy * scale; // y src position within target
    tY = 0 | ty;     // rounded : target pixel's y
    yIndex = 3 * tY * tw;  // line index within target array
    crossY = (tY != (0 | ty + scale));
    if (crossY) { // if pixel is crossing botton target pixel
      wy = (tY + 1 - ty); // weight of point within target pixel
      nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
    }
    for (sx = 0; sx < sw; sx++, sIndex += 4) {
      tx = sx * scale; // x src position within target
      tX = 0 |  tx;    // rounded : target pixel's x
      tIndex = yIndex + tX * 3; // target pixel index within target array
      crossX = (tX != (0 | tx + scale));
      if (crossX) { // if pixel is crossing target pixel's right
        wx = (tX + 1 - tx); // weight of point within target pixel
        nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
      }
      sR = sBuffer[sIndex    ];   // retrieving r,g,b for curr src px.
      sG = sBuffer[sIndex + 1];
      sB = sBuffer[sIndex + 2];

      /* !! untested : handling alpha !!
      sA = sBuffer[sIndex + 3];
      if (!sA) continue;
      if (sA != 0xFF) {
      sR = (sR * sA) >> 8;  // or use /256 instead ??
      sG = (sG * sA) >> 8;
      sB = (sB * sA) >> 8;
      }
      */
      if (!crossX && !crossY) { // pixel does not cross
        // just add components weighted by squared scale.
        tBuffer[tIndex    ] += sR * sqScale;
        tBuffer[tIndex + 1] += sG * sqScale;
        tBuffer[tIndex + 2] += sB * sqScale;
      } else if (crossX && !crossY) { // cross on X only
        w = wx * scale;
        // add weighted component for current px
        tBuffer[tIndex    ] += sR * w;
        tBuffer[tIndex + 1] += sG * w;
        tBuffer[tIndex + 2] += sB * w;
        // add weighted component for next (tX+1) px
        nw = nwx * scale
        tBuffer[tIndex + 3] += sR * nw;
        tBuffer[tIndex + 4] += sG * nw;
        tBuffer[tIndex + 5] += sB * nw;
      } else if (crossY && !crossX) { // cross on Y only
        w = wy * scale;
        // add weighted component for current px
        tBuffer[tIndex    ] += sR * w;
        tBuffer[tIndex + 1] += sG * w;
        tBuffer[tIndex + 2] += sB * w;
        // add weighted component for next (tY+1) px
        nw = nwy * scale
        tBuffer[tIndex + 3 * tw    ] += sR * nw;
        tBuffer[tIndex + 3 * tw + 1] += sG * nw;
        tBuffer[tIndex + 3 * tw + 2] += sB * nw;
      } else { // crosses both x and y : four target points involved
        // add weighted component for current px
        w = wx * wy;
        tBuffer[tIndex    ] += sR * w;
        tBuffer[tIndex + 1] += sG * w;
        tBuffer[tIndex + 2] += sB * w;
        // for tX + 1; tY px
        nw = nwx * wy;
        tBuffer[tIndex + 3] += sR * nw;
        tBuffer[tIndex + 4] += sG * nw;
        tBuffer[tIndex + 5] += sB * nw;
        // for tX ; tY + 1 px
        nw = wx * nwy;
        tBuffer[tIndex + 3 * tw    ] += sR * nw;
        tBuffer[tIndex + 3 * tw + 1] += sG * nw;
        tBuffer[tIndex + 3 * tw + 2] += sB * nw;
        // for tX + 1 ; tY +1 px
        nw = nwx * nwy;
        tBuffer[tIndex + 3 * tw + 3] += sR * nw;
        tBuffer[tIndex + 3 * tw + 4] += sG * nw;
        tBuffer[tIndex + 3 * tw + 5] += sB * nw;
      }
    } // end for sx
  } // end for sy

  var resImageData = blankTargetImageData;
  var tByteBuffer = resImageData.data;
  // convert float32 array into a UInt8Clamped Array
  var pxIndex = 0; //
  for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
    tByteBuffer[tIndex    ] = Math.ceil(tBuffer[sIndex    ]);
    tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
    tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
    tByteBuffer[tIndex + 3] = 255;
  }
  return resImageData;
}

module.exports = function (self) {
  self.onmessage = function (ev) {
    var data = ev.data;
    var imageData = downScaleImage(data.scale, data.srcImageData, data.blankTargetImageData);
    self.postMessage(imageData);
  };
};

},{}],2:[function(require,module,exports){
"use strict";

var impress = require("./psc-bundle").Impressor.impress;

// Sugar for Impressor function call
var Impressor = function (img, sizes, cb) {
  impress(img)(sizes)(function (imgs){
    return function () {
      cb(imgs);
      return;
    }
  })();
};

module.exports = Impressor;

},{"./psc-bundle":3}],3:[function(require,module,exports){
// Generated by psc-bundle 0.7.4.1
var PS = { };
(function(exports) {
  /* global exports */
  "use strict";

  // module Prelude

  //- Functor --------------------------------------------------------------------

  exports.arrayMap = function (f) {
    return function (arr) {
      var l = arr.length;
      var result = new Array(l);
      for (var i = 0; i < l; i++) {
        result[i] = f(arr[i]);
      }
      return result;
    };
  };

  //- Eq -------------------------------------------------------------------------

  exports.refEq = function (r1) {
    return function (r2) {
      return r1 === r2;
    };
  };

  //- Show -----------------------------------------------------------------------

  exports.showIntImpl = function (n) {
    return n.toString();
  };

  exports.showStringImpl = function (s) {
    return JSON.stringify(s);
  };

})(PS["Prelude"] = PS["Prelude"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Prelude"];
  var Semigroupoid = function (compose) {
      this.compose = compose;
  };
  var Category = function (__superclass_Prelude$dotSemigroupoid_0, id) {
      this["__superclass_Prelude.Semigroupoid_0"] = __superclass_Prelude$dotSemigroupoid_0;
      this.id = id;
  };
  var Functor = function (map) {
      this.map = map;
  };
  var Apply = function (__superclass_Prelude$dotFunctor_0, apply) {
      this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
      this.apply = apply;
  };
  var Applicative = function (__superclass_Prelude$dotApply_0, pure) {
      this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
      this.pure = pure;
  };
  var Bind = function (__superclass_Prelude$dotApply_0, bind) {
      this["__superclass_Prelude.Apply_0"] = __superclass_Prelude$dotApply_0;
      this.bind = bind;
  };
  var Monad = function (__superclass_Prelude$dotApplicative_0, __superclass_Prelude$dotBind_1) {
      this["__superclass_Prelude.Applicative_0"] = __superclass_Prelude$dotApplicative_0;
      this["__superclass_Prelude.Bind_1"] = __superclass_Prelude$dotBind_1;
  };
  var Eq = function (eq) {
      this.eq = eq;
  };
  var Show = function (show) {
      this.show = show;
  };
  var unit = {};
  var showString = new Show($foreign.showStringImpl);
  var showInt = new Show($foreign.showIntImpl);
  var show = function (dict) {
      return dict.show;
  };
  var semigroupoidFn = new Semigroupoid(function (f) {
      return function (g) {
          return function (x) {
              return f(g(x));
          };
      };
  });
  var pure = function (dict) {
      return dict.pure;
  };
  var $$return = function (__dict_Applicative_2) {
      return pure(__dict_Applicative_2);
  };
  var map = function (dict) {
      return dict.map;
  };
  var $less$dollar$greater = function (__dict_Functor_5) {
      return map(__dict_Functor_5);
  };
  var id = function (dict) {
      return dict.id;
  };
  var functorArray = new Functor($foreign.arrayMap);
  var flip = function (f) {
      return function (b) {
          return function (a) {
              return f(a)(b);
          };
      };
  };
  var eqString = new Eq($foreign.refEq);
  var eq = function (dict) {
      return dict.eq;
  };
  var $eq$eq = function (__dict_Eq_7) {
      return eq(__dict_Eq_7);
  };
  var $$const = function (a) {
      return function (_91) {
          return a;
      };
  };
  var compose = function (dict) {
      return dict.compose;
  };
  var categoryFn = new Category(function () {
      return semigroupoidFn;
  }, function (x) {
      return x;
  });
  var bind = function (dict) {
      return dict.bind;
  };
  var $greater$greater$eq = function (__dict_Bind_24) {
      return bind(__dict_Bind_24);
  };
  var apply = function (dict) {
      return dict.apply;
  };
  var $less$times$greater = function (__dict_Apply_25) {
      return apply(__dict_Apply_25);
  };
  var liftA1 = function (__dict_Applicative_26) {
      return function (f) {
          return function (a) {
              return $less$times$greater(__dict_Applicative_26["__superclass_Prelude.Apply_0"]())(pure(__dict_Applicative_26)(f))(a);
          };
      };
  };
  var append = function (dict) {
      return dict.append;
  };
  var $less$greater = function (__dict_Semigroup_28) {
      return append(__dict_Semigroup_28);
  };
  var ap = function (__dict_Monad_30) {
      return function (f) {
          return function (a) {
              return bind(__dict_Monad_30["__superclass_Prelude.Bind_1"]())(f)(function (_21) {
                  return bind(__dict_Monad_30["__superclass_Prelude.Bind_1"]())(a)(function (_20) {
                      return $$return(__dict_Monad_30["__superclass_Prelude.Applicative_0"]())(_21(_20));
                  });
              });
          };
      };
  };
  exports["Show"] = Show;
  exports["Eq"] = Eq;
  exports["Monad"] = Monad;
  exports["Bind"] = Bind;
  exports["Applicative"] = Applicative;
  exports["Apply"] = Apply;
  exports["Functor"] = Functor;
  exports["Category"] = Category;
  exports["Semigroupoid"] = Semigroupoid;
  exports["show"] = show;
  exports["=="] = $eq$eq;
  exports["eq"] = eq;
  exports["<>"] = $less$greater;
  exports["append"] = append;
  exports["ap"] = ap;
  exports["return"] = $$return;
  exports[">>="] = $greater$greater$eq;
  exports["bind"] = bind;
  exports["liftA1"] = liftA1;
  exports["pure"] = pure;
  exports["<*>"] = $less$times$greater;
  exports["apply"] = apply;
  exports["<$>"] = $less$dollar$greater;
  exports["map"] = map;
  exports["id"] = id;
  exports["compose"] = compose;
  exports["const"] = $$const;
  exports["flip"] = flip;
  exports["unit"] = unit;
  exports["semigroupoidFn"] = semigroupoidFn;
  exports["categoryFn"] = categoryFn;
  exports["functorArray"] = functorArray;
  exports["eqString"] = eqString;
  exports["showInt"] = showInt;
  exports["showString"] = showString;;

})(PS["Prelude"] = PS["Prelude"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var $eq$less$less = function (__dict_Bind_1) {
      return function (f) {
          return function (m) {
              return Prelude[">>="](__dict_Bind_1)(m)(f);
          };
      };
  };
  exports["=<<"] = $eq$less$less;;

})(PS["Control.Bind"] = PS["Control.Bind"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports._makeAff = function (cb) {
    return function(success, error) {
      return cb(function(e) {
        return function() {
          error(e);
        };
      })(function(v) {
        return function() {
          try {
            success(v);
          } catch (e) {
            error(e);
          }
        };
      })();
    }
  }

  exports._pure = function (nonCanceler, v) {
    return function(success, error) {
      try {
        success(v);
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    };
  }

  exports._fmap = function (f, aff) {
    return function(success, error) {
      return aff(function(v) {
        try {
          success(f(v));
        } catch (e) {
          error(e);
        }
      }, error);
    };
  }

  exports._bind = function (alwaysCanceler, aff, f) {
    return function(success, error) {
      var canceler1, canceler2;

      var isCanceled    = false;
      var requestCancel = false;

      var onCanceler = function(){};

      canceler1 = aff(function(v) {
        if (requestCancel) {
          isCanceled = true;

          return alwaysCanceler;
        } else {
          canceler2 = f(v)(success, error);

          onCanceler(canceler2);

          return canceler2;
        }
      }, error);

      return function(e) {
        return function(s, f) {
          requestCancel = true;

          if (canceler2 !== undefined) {
            return canceler2(e)(s, f);
          } else {
            return canceler1(e)(function(bool) {
              if (bool || isCanceled) {
                try {
                  s(true);
                } catch (e) {
                  f(e);
                }
              } else {
                onCanceler = function(canceler) {
                  canceler(e)(s, f);
                };
              }
            }, f);
          }
        };
      };
    };
  }

  exports._runAff = function (errorT, successT, aff) {
    return function() {
      return aff(function(v) {
        try {
          successT(v)();
        } catch (e) {
          errorT(e)();
        }
      }, function(e) {
        errorT(e)();
      });
    };
  }

  exports._liftEff = function (nonCanceler, e) {
    return function(success, error) {
      try {
        success(e());
      } catch (e) {
        error(e);
      }

      return nonCanceler;
    };
  }

})(PS["Control.Monad.Aff"] = PS["Control.Monad.Aff"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Control.Monad.Eff

  exports.returnE = function (a) {
    return function () {
      return a;
    };
  };

  exports.bindE = function (a) {
    return function (f) {
      return function () {
        return f(a())();
      };
    };
  };

})(PS["Control.Monad.Eff"] = PS["Control.Monad.Eff"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Control.Monad.Eff"];
  var Prelude = PS["Prelude"];
  var monadEff = new Prelude.Monad(function () {
      return applicativeEff;
  }, function () {
      return bindEff;
  });
  var bindEff = new Prelude.Bind(function () {
      return applyEff;
  }, $foreign.bindE);
  var applyEff = new Prelude.Apply(function () {
      return functorEff;
  }, Prelude.ap(monadEff));
  var applicativeEff = new Prelude.Applicative(function () {
      return applyEff;
  }, $foreign.returnE);
  var functorEff = new Prelude.Functor(Prelude.liftA1(applicativeEff));
  exports["functorEff"] = functorEff;
  exports["applyEff"] = applyEff;
  exports["applicativeEff"] = applicativeEff;
  exports["bindEff"] = bindEff;
  exports["monadEff"] = monadEff;;

})(PS["Control.Monad.Eff"] = PS["Control.Monad.Eff"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var MonadEff = function (__superclass_Prelude$dotMonad_0, liftEff) {
      this["__superclass_Prelude.Monad_0"] = __superclass_Prelude$dotMonad_0;
      this.liftEff = liftEff;
  };
  var liftEff = function (dict) {
      return dict.liftEff;
  };
  exports["MonadEff"] = MonadEff;
  exports["liftEff"] = liftEff;;

})(PS["Control.Monad.Eff.Class"] = PS["Control.Monad.Eff.Class"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.error = function (msg) {
    return new Error(msg);
  };

  exports.throwException = function (e) {
    return function () {
      throw e;
    };
  };

})(PS["Control.Monad.Eff.Exception"] = PS["Control.Monad.Eff.Exception"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Control.Monad.Eff.Exception"];
  var Prelude = PS["Prelude"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  exports["throwException"] = $foreign.throwException;
  exports["error"] = $foreign.error;;

})(PS["Control.Monad.Eff.Exception"] = PS["Control.Monad.Eff.Exception"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Foldable

  exports.foldrArray = function (f) {
    return function (init) {
      return function (xs) {
        var acc = init;
        var len = xs.length;
        for (var i = len - 1; i >= 0; i--) {
          acc = f(xs[i])(acc);
        }
        return acc;
      };
    };
  };

  exports.foldlArray = function (f) {
    return function (init) {
      return function (xs) {
        var acc = init;
        var len = xs.length;
        for (var i = 0; i < len; i++) {
          acc = f(acc)(xs[i]);
        }
        return acc;
      };
    };
  };

})(PS["Data.Foldable"] = PS["Data.Foldable"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var mempty = function (dict) {
      return dict.mempty;
  };
  exports["mempty"] = mempty;;

})(PS["Data.Monoid"] = PS["Data.Monoid"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Extend = PS["Control.Extend"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Functor_Invariant = PS["Data.Functor.Invariant"];
  var Data_Monoid = PS["Data.Monoid"];
  var Nothing = (function () {
      function Nothing() {

      };
      Nothing.value = new Nothing();
      return Nothing;
  })();
  var Just = (function () {
      function Just(value0) {
          this.value0 = value0;
      };
      Just.create = function (value0) {
          return new Just(value0);
      };
      return Just;
  })();
  var maybe = function (b) {
      return function (f) {
          return function (_258) {
              if (_258 instanceof Nothing) {
                  return b;
              };
              if (_258 instanceof Just) {
                  return f(_258.value0);
              };
              throw new Error("Failed pattern match at Data.Maybe line 26, column 1 - line 27, column 1: " + [ b.constructor.name, f.constructor.name, _258.constructor.name ]);
          };
      };
  };
  exports["Nothing"] = Nothing;
  exports["Just"] = Just;
  exports["maybe"] = maybe;;

})(PS["Data.Maybe"] = PS["Data.Maybe"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Foldable"];
  var Prelude = PS["Prelude"];
  var Control_Apply = PS["Control.Apply"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_First = PS["Data.Maybe.First"];
  var Data_Maybe_Last = PS["Data.Maybe.Last"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Monoid_Additive = PS["Data.Monoid.Additive"];
  var Data_Monoid_Dual = PS["Data.Monoid.Dual"];
  var Data_Monoid_Disj = PS["Data.Monoid.Disj"];
  var Data_Monoid_Conj = PS["Data.Monoid.Conj"];
  var Data_Monoid_Multiplicative = PS["Data.Monoid.Multiplicative"];
  var Foldable = function (foldMap, foldl, foldr) {
      this.foldMap = foldMap;
      this.foldl = foldl;
      this.foldr = foldr;
  };
  var foldr = function (dict) {
      return dict.foldr;
  };
  var foldl = function (dict) {
      return dict.foldl;
  };
  var foldableArray = new Foldable(function (__dict_Monoid_19) {
      return function (f) {
          return function (xs) {
              return foldr(foldableArray)(function (x) {
                  return function (acc) {
                      return Prelude["<>"](__dict_Monoid_19["__superclass_Prelude.Semigroup_0"]())(f(x))(acc);
                  };
              })(Data_Monoid.mempty(__dict_Monoid_19))(xs);
          };
      };
  }, $foreign.foldlArray, $foreign.foldrArray);
  var foldMap = function (dict) {
      return dict.foldMap;
  };
  exports["Foldable"] = Foldable;
  exports["foldMap"] = foldMap;
  exports["foldl"] = foldl;
  exports["foldr"] = foldr;
  exports["foldableArray"] = foldableArray;;

})(PS["Data.Foldable"] = PS["Data.Foldable"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Traversable

  // jshint maxparams: 3

  exports.traverseArrayImpl = function () {
    function Cont (fn) {
      this.fn = fn;
    }

    var emptyList = {};

    var ConsCell = function (head, tail) {
      this.head = head;
      this.tail = tail;
    };

    function consList (x) {
      return function (xs) {
        return new ConsCell(x, xs);
      };
    }

    function listToArray (list) {
      var arr = [];
      while (list !== emptyList) {
        arr.push(list.head);
        list = list.tail;
      }
      return arr;
    }

    return function (apply) {
      return function (map) {
        return function (pure) {
          return function (f) {
            var buildFrom = function (x, ys) {
              return apply(map(consList)(f(x)))(ys);
            };

            var go = function (acc, currentLen, xs) {
              if (currentLen === 0) {
                return acc;
              } else {
                var last = xs[currentLen - 1];
                return new Cont(function () {
                  return go(buildFrom(last, acc), currentLen - 1, xs);
                });
              }
            };

            return function (array) {
              var result = go(pure(emptyList), array.length, array);
              while (result instanceof Cont) {
                result = result.fn();
              }

              return map(listToArray)(result);
            };
          };
        };
      };
    };
  }();

})(PS["Data.Traversable"] = PS["Data.Traversable"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Traversable"];
  var Prelude = PS["Prelude"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_First = PS["Data.Maybe.First"];
  var Data_Maybe_Last = PS["Data.Maybe.Last"];
  var Data_Monoid_Additive = PS["Data.Monoid.Additive"];
  var Data_Monoid_Dual = PS["Data.Monoid.Dual"];
  var Data_Monoid_Multiplicative = PS["Data.Monoid.Multiplicative"];
  var Data_Monoid_Disj = PS["Data.Monoid.Disj"];
  var Data_Monoid_Conj = PS["Data.Monoid.Conj"];
  var Traversable = function (__superclass_Data$dotFoldable$dotFoldable_1, __superclass_Prelude$dotFunctor_0, sequence, traverse) {
      this["__superclass_Data.Foldable.Foldable_1"] = __superclass_Data$dotFoldable$dotFoldable_1;
      this["__superclass_Prelude.Functor_0"] = __superclass_Prelude$dotFunctor_0;
      this.sequence = sequence;
      this.traverse = traverse;
  };
  var traverse = function (dict) {
      return dict.traverse;
  };
  var traversableArray = new Traversable(function () {
      return Data_Foldable.foldableArray;
  }, function () {
      return Prelude.functorArray;
  }, function (__dict_Applicative_11) {
      return traverse(traversableArray)(__dict_Applicative_11)(Prelude.id(Prelude.categoryFn));
  }, function (__dict_Applicative_10) {
      return $foreign.traverseArrayImpl(Prelude.apply(__dict_Applicative_10["__superclass_Prelude.Apply_0"]()))(Prelude.map((__dict_Applicative_10["__superclass_Prelude.Apply_0"]())["__superclass_Prelude.Functor_0"]()))(Prelude.pure(__dict_Applicative_10));
  });
  var sequence = function (dict) {
      return dict.sequence;
  };
  exports["Traversable"] = Traversable;
  exports["sequence"] = sequence;
  exports["traverse"] = traverse;
  exports["traversableArray"] = traversableArray;;

})(PS["Data.Traversable"] = PS["Data.Traversable"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Extend = PS["Control.Extend"];
  var Data_Bifoldable = PS["Data.Bifoldable"];
  var Data_Bifunctor = PS["Data.Bifunctor"];
  var Data_Bitraversable = PS["Data.Bitraversable"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];
  var Left = (function () {
      function Left(value0) {
          this.value0 = value0;
      };
      Left.create = function (value0) {
          return new Left(value0);
      };
      return Left;
  })();
  var Right = (function () {
      function Right(value0) {
          this.value0 = value0;
      };
      Right.create = function (value0) {
          return new Right(value0);
      };
      return Right;
  })();
  var functorEither = new Prelude.Functor(function (f) {
      return function (_343) {
          if (_343 instanceof Left) {
              return new Left(_343.value0);
          };
          if (_343 instanceof Right) {
              return new Right(f(_343.value0));
          };
          throw new Error("Failed pattern match at Data.Either line 52, column 1 - line 56, column 1: " + [ f.constructor.name, _343.constructor.name ]);
      };
  });
  var either = function (f) {
      return function (g) {
          return function (_342) {
              if (_342 instanceof Left) {
                  return f(_342.value0);
              };
              if (_342 instanceof Right) {
                  return g(_342.value0);
              };
              throw new Error("Failed pattern match at Data.Either line 28, column 1 - line 29, column 1: " + [ f.constructor.name, g.constructor.name, _342.constructor.name ]);
          };
      };
  };
  var applyEither = new Prelude.Apply(function () {
      return functorEither;
  }, function (_345) {
      return function (r) {
          if (_345 instanceof Left) {
              return new Left(_345.value0);
          };
          if (_345 instanceof Right) {
              return Prelude["<$>"](functorEither)(_345.value0)(r);
          };
          throw new Error("Failed pattern match at Data.Either line 92, column 1 - line 116, column 1: " + [ _345.constructor.name, r.constructor.name ]);
      };
  });
  var bindEither = new Prelude.Bind(function () {
      return applyEither;
  }, either(function (e) {
      return function (_341) {
          return new Left(e);
      };
  })(function (a) {
      return function (f) {
          return f(a);
      };
  }));
  var applicativeEither = new Prelude.Applicative(function () {
      return applyEither;
  }, Right.create);
  exports["Left"] = Left;
  exports["Right"] = Right;
  exports["either"] = either;
  exports["functorEither"] = functorEither;
  exports["applyEither"] = applyEither;
  exports["applicativeEither"] = applicativeEither;
  exports["bindEither"] = bindEither;;

})(PS["Data.Either"] = PS["Data.Either"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.runFn1 = function (fn) {
    return function (a) {
      return fn(a);
    };
  };

})(PS["Data.Function"] = PS["Data.Function"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Function"];
  var Prelude = PS["Prelude"];
  exports["runFn1"] = $foreign.runFn1;;

})(PS["Data.Function"] = PS["Data.Function"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Control.Monad.Aff"];
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Monad_Cont_Class = PS["Control.Monad.Cont.Class"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Control_Monad_Eff_Unsafe = PS["Control.Monad.Eff.Unsafe"];
  var Control_Monad_Error_Class = PS["Control.Monad.Error.Class"];
  var Control_Monad_Rec_Class = PS["Control.Monad.Rec.Class"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Either = PS["Data.Either"];
  var Data_Function = PS["Data.Function"];
  var Data_Monoid = PS["Data.Monoid"];
  var runAff = function (ex) {
      return function (f) {
          return function (aff) {
              return $foreign._runAff(ex, f, aff);
          };
      };
  };
  var makeAff$prime = function (h) {
      return $foreign._makeAff(h);
  };
  var functorAff = new Prelude.Functor(function (f) {
      return function (fa) {
          return $foreign._fmap(f, fa);
      };
  });
  var applyAff = new Prelude.Apply(function () {
      return functorAff;
  }, function (ff) {
      return function (fa) {
          return $foreign._bind(alwaysCanceler, ff, function (f) {
              return Prelude["<$>"](functorAff)(f)(fa);
          });
      };
  });
  var applicativeAff = new Prelude.Applicative(function () {
      return applyAff;
  }, function (v) {
      return $foreign._pure(nonCanceler, v);
  });
  var nonCanceler = Prelude["const"](Prelude.pure(applicativeAff)(false));
  var alwaysCanceler = Prelude["const"](Prelude.pure(applicativeAff)(true));
  var makeAff = function (h) {
      return makeAff$prime(function (e) {
          return function (a) {
              return Prelude["<$>"](Control_Monad_Eff.functorEff)(Prelude["const"](nonCanceler))(h(e)(a));
          };
      });
  };
  var bindAff = new Prelude.Bind(function () {
      return applyAff;
  }, function (fa) {
      return function (f) {
          return $foreign._bind(alwaysCanceler, fa, f);
      };
  });
  var monadAff = new Prelude.Monad(function () {
      return applicativeAff;
  }, function () {
      return bindAff;
  });
  var monadEffAff = new Control_Monad_Eff_Class.MonadEff(function () {
      return monadAff;
  }, function (eff) {
      return $foreign._liftEff(nonCanceler, eff);
  });
  exports["runAff"] = runAff;
  exports["nonCanceler"] = nonCanceler;
  exports["makeAff"] = makeAff;
  exports["functorAff"] = functorAff;
  exports["applyAff"] = applyAff;
  exports["applicativeAff"] = applicativeAff;
  exports["bindAff"] = bindAff;
  exports["monadAff"] = monadAff;
  exports["monadEffAff"] = monadEffAff;;

})(PS["Control.Monad.Aff"] = PS["Control.Monad.Aff"] || {});
(function(exports) {
  /* global exports, window */
  "use strict";

  // module DOM.HTML

  exports.window = function () {
    return window;
  };

})(PS["DOM.HTML"] = PS["DOM.HTML"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.unsafeFromForeign = function (value) {
    return value;
  };

  exports.typeOf = function (value) {
    return typeof value;
  };

  exports.tagOf = function (value) {
    return Object.prototype.toString.call(value).slice(8, -1);
  };

  exports.isNull = function (value) {
    return value === null;
  };

  exports.isUndefined = function (value) {
    return value === undefined;
  };

  exports.isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  };

})(PS["Data.Foreign"] = PS["Data.Foreign"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Foreign"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Function = PS["Data.Function"];
  var Data_Int = PS["Data.Int"];
  var Data_String = PS["Data.String"];
  var TypeMismatch = (function () {
      function TypeMismatch(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      TypeMismatch.create = function (value0) {
          return function (value1) {
              return new TypeMismatch(value0, value1);
          };
      };
      return TypeMismatch;
  })();
  var ErrorAtIndex = (function () {
      function ErrorAtIndex(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ErrorAtIndex.create = function (value0) {
          return function (value1) {
              return new ErrorAtIndex(value0, value1);
          };
      };
      return ErrorAtIndex;
  })();
  var ErrorAtProperty = (function () {
      function ErrorAtProperty(value0, value1) {
          this.value0 = value0;
          this.value1 = value1;
      };
      ErrorAtProperty.create = function (value0) {
          return function (value1) {
              return new ErrorAtProperty(value0, value1);
          };
      };
      return ErrorAtProperty;
  })();
  var JSONError = (function () {
      function JSONError(value0) {
          this.value0 = value0;
      };
      JSONError.create = function (value0) {
          return new JSONError(value0);
      };
      return JSONError;
  })();
  var unsafeReadTagged = function (tag) {
      return function (value) {
          if (Prelude["=="](Prelude.eqString)($foreign.tagOf(value))(tag)) {
              return Prelude.pure(Data_Either.applicativeEither)($foreign.unsafeFromForeign(value));
          };
          return new Data_Either.Left(new TypeMismatch(tag, $foreign.tagOf(value)));
      };
  };
  var showForeignError = new Prelude.Show(function (_367) {
      if (_367 instanceof TypeMismatch) {
          return "Type mismatch: expected " + (_367.value0 + (", found " + _367.value1));
      };
      if (_367 instanceof ErrorAtIndex) {
          return "Error at array index " + (Prelude.show(Prelude.showInt)(_367.value0) + (": " + Prelude.show(showForeignError)(_367.value1)));
      };
      if (_367 instanceof ErrorAtProperty) {
          return "Error at property " + (Prelude.show(Prelude.showString)(_367.value0) + (": " + Prelude.show(showForeignError)(_367.value1)));
      };
      if (_367 instanceof JSONError) {
          return "JSON error: " + _367.value0;
      };
      throw new Error("Failed pattern match: " + [ _367.constructor.name ]);
  });
  var readString = unsafeReadTagged("String");
  var readNumber = unsafeReadTagged("Number");
  var readArray = function (value) {
      if ($foreign.isArray(value)) {
          return Prelude.pure(Data_Either.applicativeEither)($foreign.unsafeFromForeign(value));
      };
      return new Data_Either.Left(new TypeMismatch("array", $foreign.tagOf(value)));
  };
  exports["TypeMismatch"] = TypeMismatch;
  exports["ErrorAtIndex"] = ErrorAtIndex;
  exports["ErrorAtProperty"] = ErrorAtProperty;
  exports["JSONError"] = JSONError;
  exports["readArray"] = readArray;
  exports["readNumber"] = readNumber;
  exports["readString"] = readString;
  exports["unsafeReadTagged"] = unsafeReadTagged;
  exports["showForeignError"] = showForeignError;
  exports["isUndefined"] = $foreign.isUndefined;
  exports["isNull"] = $foreign.isNull;
  exports["typeOf"] = $foreign.typeOf;;

})(PS["Data.Foreign"] = PS["Data.Foreign"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Array

  //------------------------------------------------------------------------------
  // Array creation --------------------------------------------------------------
  //------------------------------------------------------------------------------

  exports.range = function (start) {
    return function (end) {
      var step = start > end ? -1 : 1;
      var result = [];
      for (var i = start, n = 0; i !== end; i += step) {
        result[n++] = i;
      }
      result[n] = i;
      return result;
    };
  };

  //------------------------------------------------------------------------------
  // Array size ------------------------------------------------------------------
  //------------------------------------------------------------------------------

  exports.length = function (xs) {
    return xs.length;
  };

  //------------------------------------------------------------------------------
  // Zipping ---------------------------------------------------------------------
  //------------------------------------------------------------------------------

  exports.zipWith = function (f) {
    return function (xs) {
      return function (ys) {
        var l = xs.length < ys.length ? xs.length : ys.length;
        var result = new Array(l);
        for (var i = 0; i < l; i++) {
          result[i] = f(xs[i])(ys[i]);
        }
        return result;
      };
    };
  };

})(PS["Data.Array"] = PS["Data.Array"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Array"];
  var Prelude = PS["Prelude"];
  var Control_Alt = PS["Control.Alt"];
  var Control_Alternative = PS["Control.Alternative"];
  var Control_Lazy = PS["Control.Lazy"];
  var Control_MonadPlus = PS["Control.MonadPlus"];
  var Control_Plus = PS["Control.Plus"];
  var Data_Foldable = PS["Data.Foldable"];
  var Data_Functor_Invariant = PS["Data.Functor.Invariant"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Tuple = PS["Data.Tuple"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  exports["zipWith"] = $foreign.zipWith;
  exports["length"] = $foreign.length;
  exports["range"] = $foreign.range;;

})(PS["Data.Array"] = PS["Data.Array"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module Data.Foreign.Index

  // jshint maxparams: 4
  exports.unsafeReadPropImpl = function (f, s, key, value) {
    return value == null ? f : s(value[key]);
  };

  // jshint maxparams: 2
  exports.unsafeHasOwnProperty = function (prop, value) {
    return Object.prototype.hasOwnProperty.call(value, prop);
  };

  exports.unsafeHasProperty = function (prop, value) {
    return prop in value;
  };

})(PS["Data.Foreign.Index"] = PS["Data.Foreign.Index"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Data.Foreign.Index"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Function = PS["Data.Function"];
  var Data_Int = PS["Data.Int"];
  var Index = function (errorAt, hasOwnProperty, hasProperty, ix) {
      this.errorAt = errorAt;
      this.hasOwnProperty = hasOwnProperty;
      this.hasProperty = hasProperty;
      this.ix = ix;
  };
  var unsafeReadProp = function (k) {
      return function (value) {
          return $foreign.unsafeReadPropImpl(new Data_Either.Left(new Data_Foreign.TypeMismatch("object", Data_Foreign.typeOf(value))), Prelude.pure(Data_Either.applicativeEither), k, value);
      };
  };
  var prop = unsafeReadProp;
  var ix = function (dict) {
      return dict.ix;
  };
  var $bang = function (__dict_Index_0) {
      return ix(__dict_Index_0);
  };
  var hasPropertyImpl = function (p) {
      return function (value) {
          if (Data_Foreign.isNull(value)) {
              return false;
          };
          if (Data_Foreign.isUndefined(value)) {
              return false;
          };
          if (Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("object") || Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("function")) {
              return $foreign.unsafeHasProperty(p, value);
          };
          return false;
      };
  };
  var hasProperty = function (dict) {
      return dict.hasProperty;
  };
  var hasOwnPropertyImpl = function (p) {
      return function (value) {
          if (Data_Foreign.isNull(value)) {
              return false;
          };
          if (Data_Foreign.isUndefined(value)) {
              return false;
          };
          if (Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("object") || Prelude["=="](Prelude.eqString)(Data_Foreign.typeOf(value))("function")) {
              return $foreign.unsafeHasOwnProperty(p, value);
          };
          return false;
      };
  };
  var indexString = new Index(Data_Foreign.ErrorAtProperty.create, hasOwnPropertyImpl, hasPropertyImpl, Prelude.flip(prop));
  var hasOwnProperty = function (dict) {
      return dict.hasOwnProperty;
  };
  var errorAt = function (dict) {
      return dict.errorAt;
  };
  exports["Index"] = Index;
  exports["errorAt"] = errorAt;
  exports["hasOwnProperty"] = hasOwnProperty;
  exports["hasProperty"] = hasProperty;
  exports["!"] = $bang;
  exports["ix"] = ix;
  exports["prop"] = prop;
  exports["indexString"] = indexString;;

})(PS["Data.Foreign.Index"] = PS["Data.Foreign.Index"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Either = PS["Data.Either"];
  var NullOrUndefined = function (x) {
      return x;
  };
  var runNullOrUndefined = function (_371) {
      return _371;
  };
  var readNullOrUndefined = function (f) {
      return function (value) {
          if (Data_Foreign.isNull(value) || Data_Foreign.isUndefined(value)) {
              return Prelude.pure(Data_Either.applicativeEither)(Data_Maybe.Nothing.value);
          };
          return Prelude["<$>"](Data_Either.functorEither)(function (_1313) {
              return NullOrUndefined(Data_Maybe.Just.create(_1313));
          })(f(value));
      };
  };
  exports["NullOrUndefined"] = NullOrUndefined;
  exports["readNullOrUndefined"] = readNullOrUndefined;
  exports["runNullOrUndefined"] = runNullOrUndefined;;

})(PS["Data.Foreign.NullOrUndefined"] = PS["Data.Foreign.NullOrUndefined"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var Data_Array = PS["Data.Array"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Index = PS["Data.Foreign.Index"];
  var Data_Foreign_Null = PS["Data.Foreign.Null"];
  var Data_Foreign_NullOrUndefined = PS["Data.Foreign.NullOrUndefined"];
  var Data_Foreign_Undefined = PS["Data.Foreign.Undefined"];
  var Data_Int = PS["Data.Int"];
  var Data_Traversable = PS["Data.Traversable"];
  var IsForeign = function (read) {
      this.read = read;
  };
  var stringIsForeign = new IsForeign(Data_Foreign.readString);
  var read = function (dict) {
      return dict.read;
  };
  var readWith = function (__dict_IsForeign_1) {
      return function (f) {
          return function (value) {
              return Data_Either.either(function (_1895) {
                  return Data_Either.Left.create(f(_1895));
              })(Data_Either.Right.create)(read(__dict_IsForeign_1)(value));
          };
      };
  };
  var readProp = function (__dict_IsForeign_2) {
      return function (__dict_Index_3) {
          return function (prop) {
              return function (value) {
                  return Prelude[">>="](Data_Either.bindEither)(Data_Foreign_Index["!"](__dict_Index_3)(value)(prop))(readWith(__dict_IsForeign_2)(Data_Foreign_Index.errorAt(__dict_Index_3)(prop)));
              };
          };
      };
  };
  var numberIsForeign = new IsForeign(Data_Foreign.readNumber);
  var nullOrUndefinedIsForeign = function (__dict_IsForeign_5) {
      return new IsForeign(Data_Foreign_NullOrUndefined.readNullOrUndefined(read(__dict_IsForeign_5)));
  };
  var arrayIsForeign = function (__dict_IsForeign_7) {
      return new IsForeign(function (value) {
          var readElement = function (i) {
              return function (value_1) {
                  return readWith(__dict_IsForeign_7)(Data_Foreign.ErrorAtIndex.create(i))(value_1);
              };
          };
          var readElements = function (arr) {
              return Data_Traversable.sequence(Data_Traversable.traversableArray)(Data_Either.applicativeEither)(Data_Array.zipWith(readElement)(Data_Array.range(0)(Data_Array.length(arr)))(arr));
          };
          return Prelude[">>="](Data_Either.bindEither)(Data_Foreign.readArray(value))(readElements);
      });
  };
  exports["IsForeign"] = IsForeign;
  exports["readProp"] = readProp;
  exports["readWith"] = readWith;
  exports["read"] = read;
  exports["stringIsForeign"] = stringIsForeign;
  exports["numberIsForeign"] = numberIsForeign;
  exports["arrayIsForeign"] = arrayIsForeign;
  exports["nullOrUndefinedIsForeign"] = nullOrUndefinedIsForeign;;

})(PS["Data.Foreign.Class"] = PS["Data.Foreign.Class"] || {});
(function(exports) {
  "use strict";

  // module Unsafe.Coerce

  exports.unsafeCoerce = function(x) { return x; }

})(PS["Unsafe.Coerce"] = PS["Unsafe.Coerce"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Unsafe.Coerce"];
  exports["unsafeCoerce"] = $foreign.unsafeCoerce;;

})(PS["Unsafe.Coerce"] = PS["Unsafe.Coerce"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["DOM.HTML.Types"];
  var Prelude = PS["Prelude"];
  var Data_Either = PS["Data.Either"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var DOM_Event_Types = PS["DOM.Event.Types"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  var Unsafe_Coerce = PS["Unsafe.Coerce"];
  var htmlDocumentToDocument = Unsafe_Coerce.unsafeCoerce;
  exports["htmlDocumentToDocument"] = htmlDocumentToDocument;;

})(PS["DOM.HTML.Types"] = PS["DOM.HTML.Types"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["DOM.HTML"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var DOM = PS["DOM"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  exports["window"] = $foreign.window;;

})(PS["DOM.HTML"] = PS["DOM.HTML"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  // module DOM.HTML.Window

  exports.document = function (window) {
    return function () {
      return window.document;
    };
  };

})(PS["DOM.HTML.Window"] = PS["DOM.HTML.Window"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["DOM.HTML.Window"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var DOM = PS["DOM"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  exports["document"] = $foreign.document;;

})(PS["DOM.HTML.Window"] = PS["DOM.HTML.Window"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.createElement = function (localName) {
    return function (doc) {
      return function () {
        return doc.createElement(localName);
      };
    };
  };

})(PS["DOM.Node.Document"] = PS["DOM.Node.Document"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["DOM.Node.Document"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Data_Nullable = PS["Data.Nullable"];
  var DOM = PS["DOM"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  exports["createElement"] = $foreign.createElement;;

})(PS["DOM.Node.Document"] = PS["DOM.Node.Document"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var $dollar$greater = function (__dict_Functor_1) {
      return function (f) {
          return function (x) {
              return Prelude["<$>"](__dict_Functor_1)(Prelude["const"](x))(f);
          };
      };
  };
  exports["$>"] = $dollar$greater;;

})(PS["Data.Functor"] = PS["Data.Functor"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.getContext2D = function(c) {
      return function() {
          return c.getContext('2d');
      };
  };

  exports.setCanvasWidth = function(width) {
      return function(canvas) {
          return function() {
              canvas.width = width;
              return canvas;
          };
      };
  };

  exports.setCanvasHeight = function(height) {
      return function(canvas) {
          return function() {
              canvas.height = height;
              return canvas;
          };
      };
  };

  exports.getImageData = function(ctx) {
      return function(x) {
          return function(y) {
              return function(w) {
                  return function(h) {
                      return function() {
                          return ctx.getImageData(x, y, w, h);
                      };
                  };
              };
          };
      };
  };

  exports.putImageData = function(ctx) {
      return function(image_data) {
          return function(x) {
              return function(y) {
                  return function() {
                      ctx.putImageData(image_data, x, y);
                      return ctx;
                  };
              };
          };
      };
  };

  exports.drawImage = function(ctx) {
      return function(image_source) {
          return function(dx) {
              return function(dy) {
                  return function() {
                      ctx.drawImage(image_source, dx, dy);
                      return ctx;
                  };
              };
          };
      };
  };

  exports.drawImageFull = function(ctx) {
      return function(image_source) {
          return function(sx) {
              return function(sy) {
                  return function(sWidth) {
                      return function(sHeight) {
                          return function(dx) {
                              return function(dy) {
                                  return function(dWidth) {
                                      return function(dHeight) {
                                          return function() {
                                              ctx.drawImage(image_source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
                                              return ctx;
                                          };
                                      };
                                  };
                              };
                          };
                      };
                  };
              };
          };
      };
  };


})(PS["Graphics.Canvas"] = PS["Graphics.Canvas"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Graphics.Canvas"];
  var Prelude = PS["Prelude"];
  var Data_Function = PS["Data.Function"];
  var Data_Maybe = PS["Data.Maybe"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  exports["drawImageFull"] = $foreign.drawImageFull;
  exports["putImageData"] = $foreign.putImageData;
  exports["getImageData"] = $foreign.getImageData;
  exports["setCanvasHeight"] = $foreign.setCanvasHeight;
  exports["setCanvasWidth"] = $foreign.setCanvasWidth;
  exports["getContext2D"] = $foreign.getContext2D;;

})(PS["Graphics.Canvas"] = PS["Graphics.Canvas"] || {});
(function(exports) {
  /* global exports */
  "use strict";

  exports.max = function (n1) {
    return function (n2) {
      return Math.max(n1, n2);
    };
  };

})(PS["Math"] = PS["Math"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Math"];
  exports["max"] = $foreign.max;;

})(PS["Math"] = PS["Math"] || {});
(function(exports) {
  "use strict";

  // module Impressor.Workers

  var work = require("webworkify");
  var downScaleImageWorker = require("../js/down-scale-image-worker");
  var worker = work(downScaleImageWorker);

  exports.downScaleImageWorkerImpl = function (callback) {
    return function (scale) {
      return function (srcImageData) {
        return function (blankTargetImageData) {
          return function () {
            worker.postMessage({
              scale: scale,
              srcImageData: srcImageData,
              blankTargetImageData: blankTargetImageData
            });

            worker.onmessage = function (ev) {
              callback(ev.data)();
            };
          }
        }
      }
    }
  }

})(PS["Impressor.Workers"] = PS["Impressor.Workers"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Impressor.Workers"];
  var Prelude = PS["Prelude"];
  var Graphics_Canvas = PS["Graphics.Canvas"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var downScaleImageWorker = function (scale) {
      return function (srcImageData) {
          return function (blankTargetImageData) {
              return Control_Monad_Aff.makeAff(function (error) {
                  return function (success) {
                      return $foreign.downScaleImageWorkerImpl(success)(scale)(srcImageData)(blankTargetImageData);
                  };
              });
          };
      };
  };
  exports["downScaleImageWorker"] = downScaleImageWorker;;

})(PS["Impressor.Workers"] = PS["Impressor.Workers"] || {});
(function(exports) {
  "use strict";

  exports.getImageSize = function (img) {
      return function () {
          return { w: img.naturalWidth, h: img.naturalHeight };
      };
  };

  exports.canvasToDataURL_ = function (type) {
      return function (encoderOptions) {
          return function (canvas) {
              return function () {
                  return canvas.toDataURL(type, encoderOptions);
              };
          };
      };
  };

  // From https://gist.github.com/fupslot/5015897 and http://stackoverflow.com/a/16245768/1584052
  exports.unsafeDataUrlToBlob = function (dataURL) {
      var byteString = atob(dataURL.split(',')[1]);
      var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
      var sliceSize = 512;
      var byteArrays = [];

      for (var offset = 0; offset < byteString.length; offset += sliceSize) {
          var slice = byteString.slice(offset, offset + sliceSize);
          var byteNumbers = new Array(slice.length);

          for (var i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
          }

          var byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, { type: mimeString });
      return blob;
  }

})(PS["Impressor.Utils"] = PS["Impressor.Utils"] || {});
(function(exports) {
  "use strict";

  // module Impressor.Types

  exports.elementToCanvasElement = function (el) {
      return el;
  };

  exports.readCanvasImageSourceImpl = function (foreign, Left, Right) {
      if (foreign && foreign instanceof HTMLImageElement) {
          return Right(foreign);
      } else {
          return Left(foreign.toString() + " :: " + typeof foreign);
      }
  };

})(PS["Impressor.Types"] = PS["Impressor.Types"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Impressor.Types"];
  var Prelude = PS["Prelude"];
  var DOM_Node_Types = PS["DOM.Node.Types"];
  var DOM_File_Types = PS["DOM.File.Types"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var Graphics_Canvas = PS["Graphics.Canvas"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var Data_Foreign_NullOrUndefined = PS["Data.Foreign.NullOrUndefined"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Either = PS["Data.Either"];
  var Data_Function = PS["Data.Function"];
  var Data_Foreign_Index = PS["Data.Foreign.Index"];
  var TargetSize = function (x) {
      return x;
  };
  var ForeignCanvasImageSource = function (x) {
      return x;
  };
  var ParsedArgs = function (x) {
      return x;
  };
  var readCanvasImageSource = function (img) {
      return $foreign.readCanvasImageSourceImpl(img, function (_2707) {
          return Data_Either.Left.create(Data_Foreign.TypeMismatch.create("canvas image source element")(_2707));
      }, Data_Either.Right.create);
  };
  var isForeignTargetSize = new Data_Foreign_Class.IsForeign(function (obj) {
      return Prelude["<$>"](Data_Either.functorEither)(TargetSize)(Prelude["<*>"](Data_Either.applyEither)(Prelude["<*>"](Data_Either.applyEither)(Prelude["<$>"](Data_Either.functorEither)(function (_2) {
          return function (_3) {
              return function (_4) {
                  return {
                      w: _2,
                      h: _3,
                      name: _4
                  };
              };
          };
      })(Data_Foreign_Class.readProp(Data_Foreign_Class.numberIsForeign)(Data_Foreign_Index.indexString)("width")(obj)))(Prelude["<$>"](Data_Either.functorEither)(Data_Foreign_NullOrUndefined.runNullOrUndefined)(Data_Foreign_Class.readProp(Data_Foreign_Class.nullOrUndefinedIsForeign(Data_Foreign_Class.numberIsForeign))(Data_Foreign_Index.indexString)("height")(obj))))(Data_Foreign_Class.readProp(Data_Foreign_Class.stringIsForeign)(Data_Foreign_Index.indexString)("name")(obj)));
  });
  var isForeignForeignCanvasImageSource = new Data_Foreign_Class.IsForeign(function (img) {
      return Prelude["<$>"](Data_Either.functorEither)(ForeignCanvasImageSource)(readCanvasImageSource(img));
  });
  exports["ParsedArgs"] = ParsedArgs;
  exports["ForeignCanvasImageSource"] = ForeignCanvasImageSource;
  exports["TargetSize"] = TargetSize;
  exports["isForeignTargetSize"] = isForeignTargetSize;
  exports["isForeignForeignCanvasImageSource"] = isForeignForeignCanvasImageSource;
  exports["elementToCanvasElement"] = $foreign.elementToCanvasElement;;

})(PS["Impressor.Types"] = PS["Impressor.Types"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var $foreign = PS["Impressor.Utils"];
  var Prelude = PS["Prelude"];
  var DOM = PS["DOM"];
  var DOM_HTML = PS["DOM.HTML"];
  var DOM_HTML_Window = PS["DOM.HTML.Window"];
  var DOM_HTML_Types = PS["DOM.HTML.Types"];
  var DOM_Node_Document = PS["DOM.Node.Document"];
  var DOM_File_Types = PS["DOM.File.Types"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Bind = PS["Control.Bind"];
  var Graphics_Canvas = PS["Graphics.Canvas"];
  var Impressor_Types = PS["Impressor.Types"];
  var createCanvasElement = function __do() {
      var _81 = Prelude["<$>"](Control_Monad_Eff.functorEff)(DOM_HTML_Types.htmlDocumentToDocument)(Control_Bind["=<<"](Control_Monad_Eff.bindEff)(DOM_HTML_Window.document)(DOM_HTML.window))();
      return Prelude["<$>"](Control_Monad_Eff.functorEff)(Impressor_Types.elementToCanvasElement)(DOM_Node_Document.createElement("canvas")(_81))();
  };
  var createBlankImageData = function (_729) {
      return function __do() {
          var _83 = createCanvasElement();
          var _82 = Graphics_Canvas.getContext2D(_83)();
          Graphics_Canvas.setCanvasWidth(_729.w)(_83)();
          Graphics_Canvas.setCanvasHeight(_729.h)(_83)();
          return Graphics_Canvas.getImageData(_82)(0.0)(0.0)(_729.w)(_729.h)();
      };
  };
  var aspectRatio$prime = function (sourceRatio) {
      return function (_731) {
          return _731.w / Data_Maybe.maybe(_731.w / sourceRatio)(Prelude.id(Prelude.categoryFn))(_731.h);
      };
  };
  var aspectRatio = function (_730) {
      return _730.w / _730.h;
  };
  exports["aspectRatio'"] = aspectRatio$prime;
  exports["aspectRatio"] = aspectRatio;
  exports["createBlankImageData"] = createBlankImageData;
  exports["createCanvasElement"] = createCanvasElement;
  exports["unsafeDataUrlToBlob"] = $foreign.unsafeDataUrlToBlob;
  exports["canvasToDataURL_"] = $foreign.canvasToDataURL_;
  exports["getImageSize"] = $foreign.getImageSize;;

})(PS["Impressor.Utils"] = PS["Impressor.Utils"] || {});
(function(exports) {
  // Generated by psc version 0.7.4.1
  "use strict";
  var Prelude = PS["Prelude"];
  var DOM = PS["DOM"];
  var $$Math = PS["Math"];
  var Data_Traversable = PS["Data.Traversable"];
  var Data_Maybe = PS["Data.Maybe"];
  var Data_Maybe_Unsafe = PS["Data.Maybe.Unsafe"];
  var Data_Foreign = PS["Data.Foreign"];
  var Data_Foreign_Class = PS["Data.Foreign.Class"];
  var Data_Either = PS["Data.Either"];
  var Data_Monoid = PS["Data.Monoid"];
  var Data_Functor = PS["Data.Functor"];
  var Data_Function = PS["Data.Function"];
  var Control_Monad_Eff = PS["Control.Monad.Eff"];
  var Control_Monad_Eff_Class = PS["Control.Monad.Eff.Class"];
  var Control_Monad_Eff_Exception = PS["Control.Monad.Eff.Exception"];
  var Control_Monad_Aff = PS["Control.Monad.Aff"];
  var Graphics_Canvas = PS["Graphics.Canvas"];
  var Impressor_Workers = PS["Impressor.Workers"];
  var Impressor_Utils = PS["Impressor.Utils"];
  var Impressor_Types = PS["Impressor.Types"];
  var Impressor_Effects = PS["Impressor.Effects"];
  var imageQuality = 0.8;
  var croppingProps = function (src) {
      return function (target) {
          var targetAspectRatio = Impressor_Utils["aspectRatio'"](Impressor_Utils.aspectRatio(src))(target);
          var srcHasHigherAspectRatioThanTarget = Impressor_Utils.aspectRatio(src) > targetAspectRatio;
          var top = (function () {
              if (srcHasHigherAspectRatioThanTarget) {
                  return 0.0;
              };
              if (!srcHasHigherAspectRatioThanTarget) {
                  return (src.h - src.w / targetAspectRatio) / 2.0;
              };
              throw new Error("Failed pattern match at Impressor line 44, column 1 - line 45, column 1: " + [ srcHasHigherAspectRatioThanTarget.constructor.name ]);
          })();
          var width = (function () {
              if (srcHasHigherAspectRatioThanTarget) {
                  return src.h * targetAspectRatio;
              };
              if (!srcHasHigherAspectRatioThanTarget) {
                  return src.w;
              };
              throw new Error("Failed pattern match at Impressor line 44, column 1 - line 45, column 1: " + [ srcHasHigherAspectRatioThanTarget.constructor.name ]);
          })();
          var left = (function () {
              if (srcHasHigherAspectRatioThanTarget) {
                  return (src.w - src.h * targetAspectRatio) / 2.0;
              };
              if (!srcHasHigherAspectRatioThanTarget) {
                  return 0.0;
              };
              throw new Error("Failed pattern match at Impressor line 44, column 1 - line 45, column 1: " + [ srcHasHigherAspectRatioThanTarget.constructor.name ]);
          })();
          var height = (function () {
              if (srcHasHigherAspectRatioThanTarget) {
                  return src.h;
              };
              if (!srcHasHigherAspectRatioThanTarget) {
                  return src.w / targetAspectRatio;
              };
              throw new Error("Failed pattern match at Impressor line 44, column 1 - line 45, column 1: " + [ srcHasHigherAspectRatioThanTarget.constructor.name ]);
          })();
          return {
              left: left,
              top: top,
              w: width,
              h: height
          };
      };
  };
  var createImages = function (_9) {
      return function (srcSize) {
          return function (targetSizes) {
              var createImage = function (_10) {
                  var targetHeight = Data_Maybe.maybe(_10.w / Impressor_Utils.aspectRatio(srcSize))(Prelude.id(Prelude.categoryFn))(_10.h);
                  var croppingProps$prime = croppingProps(srcSize)(_10);
                  var maxHeight = $$Math.max(targetHeight)(croppingProps$prime.h);
                  var maxWidth = $$Math.max(_10.w)(croppingProps$prime.w);
                  var srcScale = croppingProps$prime.w / _10.w;
                  return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Prelude[">>="](Control_Monad_Eff.bindEff)(Graphics_Canvas.setCanvasWidth(maxWidth)(_9.canvas))(Graphics_Canvas.setCanvasHeight(maxHeight))))(function () {
                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Graphics_Canvas.drawImageFull(_9.ctx)(_9.img)(croppingProps$prime.left)(croppingProps$prime.top)(croppingProps$prime.w)(croppingProps$prime.h)(0.0)(0.0)(maxWidth)(maxHeight)))(function () {
                          return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Graphics_Canvas.getImageData(_9.ctx)(0.0)(0.0)(maxWidth)(maxHeight)))(function (_5) {
                              return Prelude.bind(Control_Monad_Aff.bindAff)((function () {
                                  var _21 = srcScale > 1.0;
                                  if (_21) {
                                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Prelude[">>="](Control_Monad_Eff.bindEff)(Graphics_Canvas.setCanvasWidth(_10.w)(_9.canvas))(Graphics_Canvas.setCanvasHeight(targetHeight))))(function () {
                                          return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Impressor_Utils.createBlankImageData({
                                              w: _10.w,
                                              h: targetHeight
                                          })))(function (_2) {
                                              return Impressor_Workers.downScaleImageWorker(1.0 / srcScale)(_5)(_2);
                                          });
                                      });
                                  };
                                  if (!_21) {
                                      return Prelude.pure(Control_Monad_Aff.applicativeAff)(_5);
                                  };
                                  throw new Error("Failed pattern match at Impressor line 59, column 3 - line 60, column 3: " + [ _21.constructor.name ]);
                              })())(function (_4) {
                                  return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Graphics_Canvas.putImageData(_9.ctx)(_4)(0.0)(0.0)))(function () {
                                      return Prelude.bind(Control_Monad_Aff.bindAff)(Control_Monad_Eff_Class.liftEff(Control_Monad_Aff.monadEffAff)(Impressor_Utils.canvasToDataURL_("image/jpeg")(imageQuality)(_9.canvas)))(function (_3) {
                                          return Prelude["return"](Control_Monad_Aff.applicativeAff)({
                                              name: _10.name,
                                              blob: Impressor_Utils.unsafeDataUrlToBlob(_3)
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              };
              return Data_Traversable.traverse(Data_Traversable.traversableArray)(Control_Monad_Aff.applicativeAff)(createImage)(targetSizes);
          };
      };
  };
  var impress = function (img) {
      return function (sizes) {
          return function (cb) {
              var parsingErrorHandler = function (err) {
                  return Data_Functor["$>"](Control_Monad_Eff.functorEff)(Control_Monad_Eff_Exception.throwException(Control_Monad_Eff_Exception.error(Prelude.show(Data_Foreign.showForeignError)(err))))(Prelude.unit);
              };
              var parsedArgs = Prelude["<$>"](Data_Either.functorEither)(Impressor_Types.ParsedArgs)(Prelude["<*>"](Data_Either.applyEither)(Prelude["<$>"](Data_Either.functorEither)(function (_0) {
                  return function (_1) {
                      return {
                          img: _0,
                          sizes: _1
                      };
                  };
              })(Data_Foreign_Class.read(Impressor_Types.isForeignForeignCanvasImageSource)(img)))(Data_Foreign_Class.read(Data_Foreign_Class.arrayIsForeign(Impressor_Types.isForeignTargetSize))(sizes)));
              var createImages$prime = function (_11) {
                  return function __do() {
                      var _8 = Impressor_Utils.createCanvasElement();
                      var _7 = Graphics_Canvas.getContext2D(_8)();
                      var _6 = Impressor_Utils.getImageSize(_11.img)();
                      return Control_Monad_Aff.runAff(Control_Monad_Eff_Exception.throwException)(Data_Function.runFn1(cb))(createImages({
                          canvas: _8,
                          ctx: _7,
                          img: _11.img
                      })(_6)(_11.sizes))();
                  };
              };
              return Data_Either.either(parsingErrorHandler)(createImages$prime)(parsedArgs);
          };
      };
  };
  exports["impress"] = impress;
  exports["createImages"] = createImages;
  exports["croppingProps"] = croppingProps;
  exports["imageQuality"] = imageQuality;;

})(PS["Impressor"] = PS["Impressor"] || {});
module.exports = PS;
},{"../js/down-scale-image-worker":1,"webworkify":4}],4:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        if (cache[key].exports === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'],'require(' + stringify(wkey) + ')(self)'),
        scache
    ];

    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    return new Worker(URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}]},{},[2])(2)
});