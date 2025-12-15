// composables/useObituaryDocuments.js
import { computed } from "vue";
import { useFetch } from "#imports";

/**
 * Gestion des documents justificatifs pour une annonce.
 *
 * @param {Ref<string> | string} slugRef - slug de l'annonce, ou ref(slug)
 * @param {object} options
 * @param {boolean} options.enabled - si false, ne déclenche pas le fetch
 */
export async function useObituaryDocuments(slugRef, options = {}) {
  const enabled = options.enabled ?? true;

  const slug = computed(() => {
    if (!slugRef) return null;
    if (typeof slugRef === "string") return slugRef;
    return slugRef.value || null;
  });

  const shouldFetch = computed(() => {
    return enabled && !!slug.value;
  });

  const { data, pending, error, refresh } = await useFetch(
    () =>
      shouldFetch.value ? `/api/obituaries/${slug.value}/documents` : null,
    {
      key: () =>
        shouldFetch.value
          ? `obituary-docs-${slug.value}`
          : "obituary-docs-disabled",
      default: () => ({
        ok: false,
        documents: [],
      }),
    }
  );

  const documents = computed(() => data.value?.documents || []);
  const hasDocuments = computed(() => documents.value.length > 0);

  return {
    documents,
    hasDocuments,
    pending,
    error,
    refresh,
  };
}
