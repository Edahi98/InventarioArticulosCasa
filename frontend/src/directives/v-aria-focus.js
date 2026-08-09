function applyAriaFocus(el, binding) {
  const label = typeof binding.value === "string" ? binding.value : binding.value?.label;
  const autoFocus = binding.value?.autoFocus ?? binding.modifiers?.auto ?? false;

  if (!el.hasAttribute("tabindex")) {
    el.setAttribute("tabindex", "0");
  }
  if (label) {
    el.setAttribute("aria-label", label);
  }
  el.setAttribute("role", el.getAttribute("role") ?? "button");

  if (autoFocus) {
    el.focus();
  }
}

function handleKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.target.click();
  }
}

export const vAriaFocus = {
  mounted(el, binding) {
    applyAriaFocus(el, binding);
    el.addEventListener("keydown", handleKeydown);
  },
  updated(el, binding) {
    applyAriaFocus(el, binding);
  },
  unmounted(el) {
    el.removeEventListener("keydown", handleKeydown);
  },
};

export default vAriaFocus;
