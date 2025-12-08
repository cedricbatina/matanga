// stores/confirmStore.js
import { defineStore } from "pinia";

export const useConfirmStore = defineStore("confirm", {
  state: () => ({
    open: false,
    title: "",
    message: "",
    confirmLabel: "OK",
    cancelLabel: "Annuler",
    _resolver: null,
  }),

  actions: {
    ask({ title, message, confirmLabel = "OK", cancelLabel = "Annuler" }) {
      this.title = title || "";
      this.message = message || "";
      this.confirmLabel = confirmLabel;
      this.cancelLabel = cancelLabel;
      this.open = true;

      return new Promise((resolve) => {
        this._resolver = resolve;
      });
    },

    confirm() {
      this.open = false;
      if (this._resolver) {
        this._resolver(true);
        this._resolver = null;
      }
    },

    cancel() {
      this.open = false;
      if (this._resolver) {
        this._resolver(false);
        this._resolver = null;
      }
    },
  },
});
