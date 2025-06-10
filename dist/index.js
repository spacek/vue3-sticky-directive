var a = Object.defineProperty;
var c = (t, e, s) => e in t ? a(t, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : t[e] = s;
var o = (t, e, s) => (c(t, typeof e != "symbol" ? e + "" : e, s), s);
const namespace = "@@vue3-sticky-directive", events = [
  "resize",
  "scroll",
  "touchstart",
  "touchmove",
  "touchend",
  "pageshow",
  "load"
], batchStyle = (t, e = {}, s = {}) => {
  for (let i in e)
    t.style[i] = e[i];
  for (let i in s)
    s[i] && !t.classList.contains(i) ? t.classList.add(i) : !s[i] && t.classList.contains(i) && t.classList.remove(i);
};
class Sticky {
  constructor(t, e) {
    o(this, "el");
    o(this, "vm");
    o(this, "unSubscribers");
    o(this, "isPending");
    o(this, "state");
    o(this, "lastState");
    o(this, "options");
    o(this, "placeholderEl");
    o(this, "containerEl");
    this.el = t, this.vm = e, this.unSubscribers = [], this.isPending = !1, this.state = {
      isTopSticky: null,
      isBottomSticky: null,
      height: null,
      width: null,
      xOffset: null
    }, this.lastState = {
      top: null,
      bottom: null,
      sticked: !1
    };
    const s = this.getAttribute("sticky-offset") || {}, i = this.getAttribute("sticky-side") || "top", n = this.getAttribute("sticky-z-index") || "10", h = this.getAttribute("on-stick") || null;
    this.options = {
      topOffset: Number(s.top) || 0,
      bottomOffset: Number(s.bottom) || 0,
      shouldTopSticky: i === "top" || i === "both",
      shouldBottomSticky: i === "bottom" || i === "both",
      zIndex: n,
      onStick: h
    };
  }
  doBind() {
    if (this.unSubscribers.length > 0)
      return;
    const { el: t, vm: e } = this;
    e.$nextTick(() => {
      this.placeholderEl = document.createElement("div"), this.containerEl = this.getContainerEl(), t.parentElement.insertBefore(this.placeholderEl, t), events.forEach((s) => {
        const i = this.update.bind(this);
        this.unSubscribers.push(() => window.removeEventListener(s, i)), this.unSubscribers.push(() => this.containerEl.removeEventListener(s, i)), window.addEventListener(s, i, { passive: !0 }), this.containerEl.addEventListener(s, i, { passive: !0 });
      });
    });
  }
  doUnbind() {
    this.unSubscribers.forEach((t) => t()), this.unSubscribers = [], this.resetElement();
  }
  update() {
    this.isPending || (requestAnimationFrame(() => {
      this.isPending = !1, this.recomputeState(), this.updateElements();
    }), this.isPending = !0);
  }
  isTopSticky() {
    if (!this.options.shouldTopSticky)
      return !1;
    const t = this.state.placeholderElRect.top, e = this.state.containerElRect.bottom, s = this.options.topOffset, i = this.options.bottomOffset;
    return t <= s && e >= i;
  }
  isBottomSticky() {
    if (!this.options.shouldBottomSticky)
      return !1;
    const t = window.innerHeight - this.state.placeholderElRect.top - this.state.height, e = window.innerHeight - this.state.containerElRect.top, s = this.options.topOffset, i = this.options.bottomOffset;
    return t <= i && e >= s;
  }
  recomputeState() {
    this.state = Object.assign({}, this.state, {
      height: this.getHeight(),
      width: this.getWidth(),
      xOffset: this.getXOffset(),
      placeholderElRect: this.getPlaceholderElRect(),
      containerElRect: this.getContainerElRect()
    }), this.state.isTopSticky = this.isTopSticky(), this.state.isBottomSticky = this.isBottomSticky();
  }
  fireEvents() {
    typeof this.options.onStick == "function" && (this.lastState.top !== this.state.isTopSticky || this.lastState.bottom !== this.state.isBottomSticky || this.lastState.sticked !== (this.state.isTopSticky || this.state.isBottomSticky)) && (this.lastState = {
      top: this.state.isTopSticky,
      bottom: this.state.isBottomSticky,
      sticked: this.state.isBottomSticky || this.state.isTopSticky
    }, this.options.onStick(this.lastState));
  }
  updateElements() {
    const t = {
      paddingTop: 0
    }, e = {
      position: "static",
      top: "auto",
      bottom: "auto",
      left: "auto",
      width: "auto",
      zIndex: this.options.zIndex
    }, s = {
      "vue-sticky-placeholder": !0
    }, i = {
      "vue-sticky-el": !0,
      "top-sticky": !1,
      "bottom-sticky": !1
    };
    if (this.state.isTopSticky) {
      e.position = "fixed", e.top = this.options.topOffset + "px", e.left = this.state.xOffset + "px", e.width = this.state.width + "px";
      const n = this.state.containerElRect.bottom - this.state.height - this.options.bottomOffset - this.options.topOffset;
      n < 0 && (e.top = n + this.options.topOffset + "px"), t.paddingTop = this.state.height + "px", i["top-sticky"] = !0;
    } else if (this.state.isBottomSticky) {
      e.position = "fixed", e.bottom = this.options.bottomOffset + "px", e.left = this.state.xOffset + "px", e.width = this.state.width + "px";
      const n = window.innerHeight - this.state.containerElRect.top - this.state.height - this.options.bottomOffset - this.options.topOffset;
      n < 0 && (e.bottom = n + this.options.bottomOffset + "px"), t.paddingTop = this.state.height + "px", i["bottom-sticky"] = !0;
    } else
      t.paddingTop = 0;
    batchStyle(this.el, e, i), batchStyle(this.placeholderEl, t, s), this.fireEvents();
  }
  resetElement() {
    ["position", "top", "bottom", "left", "width", "zIndex"].forEach((e) => {
      this.el.style.removeProperty(e);
    }), this.el.classList.remove("bottom-sticky", "top-sticky");
    const { parentElement: t } = this.placeholderEl;
    t && t.removeChild(this.placeholderEl);
  }
  getContainerEl() {
    let t = this.el.parentElement;
    for (; t && t.tagName !== "HTML" && t.tagName !== "BODY" && t.nodeType === 1; ) {
      if (t.hasAttribute("sticky-container"))
        return t;
      t = t.parentElement;
    }
    return this.el.parentElement;
  }
  getXOffset() {
    return this.placeholderEl.getBoundingClientRect().left;
  }
  getWidth() {
    return this.placeholderEl.getBoundingClientRect().width;
  }
  getHeight() {
    return this.el.getBoundingClientRect().height;
  }
  getPlaceholderElRect() {
    return this.placeholderEl.getBoundingClientRect();
  }
  getContainerElRect() {
    return this.containerEl.getBoundingClientRect();
  }
  getAttribute(name) {
    const expr = this.el.getAttribute(name);
    let result;
    if (expr)
      if (this.vm[expr])
        result = this.vm[expr];
      else
        try {
          result = eval(`(${expr})`);
        } catch (t) {
          result = expr;
        }
    return result;
  }
}
const Sticky$1 = {
  mounted(t, e) {
    (typeof e.value > "u" || e.value) && (t[namespace] = new Sticky(t, e.instance), t[namespace].doBind());
  },
  unmounted(t) {
    t[namespace] && (t[namespace].doUnbind(), t[namespace] = void 0);
  },
  updated(t, e) {
    typeof e.value > "u" || e.value ? (t[namespace] || (t[namespace] = new Sticky(t, e.instance)), t[namespace].doBind()) : t[namespace] && t[namespace].doUnbind();
  }
}, StickyPlugin = {
  install(t) {
    t.directive("Sticky", Sticky$1);
  }
};
export {
  StickyPlugin,
  StickyPlugin as default
};
