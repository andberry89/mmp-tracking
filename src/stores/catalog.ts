import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { testDocuments } from "@/test";

export interface MakeOption {
  id: string;
  name: string;
}

export interface ModelOption {
  id: string;
  makeId: string;
  make: string;
  name: string;
  segment: string;
}

export const useCatalogStore = defineStore("catalog", () => {
  const makes = ref<MakeOption[]>([]);
  const models = ref<ModelOption[]>([]);
  const modelYears = ref<number[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const modelsForMake = (makeId: string) => computed(() => models.value.filter((model) => model.makeId === makeId));

  async function loadCatalog() {
    isLoading.value = true;
    error.value = null;

    if (!isSupabaseConfigured || !supabase) {
      const modelByKey = new Map<string, ModelOption>();
      const makeByName = new Map<string, MakeOption>();
      const years = new Set<number>();

      for (const task of testDocuments) {
        const makeKey = task.vehicle.make.toLocaleLowerCase();
        const make = makeByName.get(makeKey) ?? {
          id: `demo-make:${makeKey}`,
          name: task.vehicle.make,
        };
        makeByName.set(makeKey, make);

        const modelKey = `${makeKey}:${task.vehicle.model.toLocaleLowerCase()}`;
        modelByKey.set(modelKey, {
          id: `demo-model:${modelKey}`,
          makeId: make.id,
          make: make.name,
          name: task.vehicle.model,
          segment: task.vehicle.segment,
        });
        years.add(task.vehicle.modelYear);
      }

      makes.value = [...makeByName.values()].sort((a, b) => a.name.localeCompare(b.name));
      models.value = [...modelByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
      modelYears.value = [...years].sort((a, b) => b - a);
      isLoading.value = false;
      return;
    }

    try {
      const [makeResult, modelResult, yearResult] = await Promise.all([
        supabase.from("makes").select("id, name").eq("active", true).order("name"),
        supabase
          .from("models")
          .select("id, make_id, name, makes!inner(name), segments(name)")
          .eq("active", true)
          .order("name"),
        supabase.from("model_years").select("year").order("year", { ascending: false }),
      ]);
      if (makeResult.error) throw makeResult.error;
      if (modelResult.error) throw modelResult.error;
      if (yearResult.error) throw yearResult.error;

      makes.value = (makeResult.data ?? []) as MakeOption[];
      models.value = ((modelResult.data ?? []) as unknown as Array<{
        id: string;
        make_id: string;
        name: string;
        makes: { name: string } | { name: string }[] | null;
        segments: { name: string } | { name: string }[] | null;
      }>).map((model) => {
        const make = Array.isArray(model.makes) ? model.makes[0] : model.makes;
        const segment = Array.isArray(model.segments) ? model.segments[0] : model.segments;
        return {
          id: model.id,
          makeId: model.make_id,
          make: make?.name ?? "",
          name: model.name,
          segment: segment?.name ?? "",
        };
      });
      modelYears.value = (yearResult.data ?? []).map((row) => row.year);
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to load vehicle options.";
      makes.value = [];
      models.value = [];
      modelYears.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  return { makes, models, modelYears, isLoading, error, modelsForMake, loadCatalog };
});
