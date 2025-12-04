// stores/obituaries.js
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useObituariesStore = defineStore('obituaries', () => {
  // --- STATE ---
  const items = ref([]);
  const pagination = ref({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 0,
  });

  const filters = ref({
    countryCode: '',
    city: '',
    language: 'fr',
    type: null,    // "death" | "anniversary" | "memorial" | etc. (selon ton backend)
    isFree: null,  // true | false | null
    q: '',
    sort: 'recent', // "recent" | "oldest" | "popular"
  });

  const loading = ref(false);
  const error = ref(null);
  const currentObituary = ref(null);
  const lastLoadedAt = ref(null);

  // --- HELPERS ---

  const buildQueryParams = () => {
    const f = filters.value;

    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sort: f.sort || 'recent',
      language: f.language, // géré dans /api/obituaries (language / lang)
    };

    if (f.countryCode) {
      params.country_code = f.countryCode.toUpperCase();
    }

    if (f.city) {
      params.city = f.city.trim();
    }

    if (f.type) {
      params.type = f.type;
    }

    if (f.isFree !== null) {
      // le handler supporte is_free / free, on envoie is_free=1|0
      params.is_free = f.isFree ? '1' : '0';
    }

    if (f.q) {
      params.q = f.q.trim();
    }

    return params;
  };

  const setFilters = (partial) => {
    filters.value = {
      ...filters.value,
      ...partial,
    };
    // à chaque changement de filtre, on revient à la page 1
    pagination.value.page = 1;
  };

  const resetFilters = () => {
    filters.value = {
      countryCode: '',
      city: '',
      language: filters.value.language || 'fr',
      type: null,
      isFree: null,
      q: '',
      sort: 'recent',
    };
    pagination.value.page = 1;
  };

  const setPage = (page) => {
    pagination.value.page = page > 0 ? page : 1;
  };

  const setPageSize = (pageSize) => {
    pagination.value.pageSize = pageSize > 0 ? pageSize : 6;
  };

  // --- ACTIONS API ---

  const fetchList = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch('/api/obituaries', {
        params: buildQueryParams(),
      });

      if (!data || data.ok !== true) {
        throw new Error('Unexpected response from /api/obituaries');
      }

      items.value = data.items || [];
      pagination.value = {
        page: data.pagination?.page ?? 1,
        pageSize: data.pagination?.pageSize ?? pagination.value.pageSize,
        total: data.pagination?.total ?? 0,
        totalPages: data.pagination?.totalPages ?? 0,
      };

      lastLoadedAt.value = new Date().toISOString();
    } catch (err) {
      console.error('fetchList obituaries failed', err);
      error.value = err.message || 'Failed to load obituaries.';
    } finally {
      loading.value = false;
    }
  };

  const fetchOne = async (slug) => {
    if (!slug) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch(`/api/obituaries/${slug}`);
      currentObituary.value = data;
    } catch (err) {
      console.error('fetchOne obituary failed', err);
      error.value = err.message || 'Failed to load obituary.';
    } finally {
      loading.value = false;
    }
  };

  return {
    // state
    items,
    pagination,
    filters,
    loading,
    error,
    currentObituary,
    lastLoadedAt,

    // actions
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    fetchList,
    fetchOne,
  };
});
