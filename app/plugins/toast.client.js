// app/plugins/toast.client.js
import { defineNuxtPlugin } from "#app";
import Vue3Toastify, { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, {
    autoClose: 3000,
    position: "top-right",
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  // même API que ton code actuel: useNuxtApp().$useToast()
  nuxtApp.provide("useToast", () => ({
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    info: (msg) => toast.info(msg),
    warning: (msg) => toast.warning(msg),
  }));
});
