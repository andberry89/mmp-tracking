export default {
  mounted(el, binding) {
    el.__ClickOutsideHandler__ = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    setTimeout(() => {
      document.body.addEventListener("click", el.__ClickOutsideHandler__);
    }, 0);
  },
  unmounted(el) {
    if (el.__ClickOutsideHandler__) {
      document.body.removeEventListener("click", el.__ClickOutsideHandler__);
      delete el.__ClickOutsideHandler__;
    }
  },
};
