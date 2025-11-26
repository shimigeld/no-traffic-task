import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import apiClient from "@/lib/api";
import { normalizePolygon } from "@/lib/geometry";
import type { Polygon } from "@/types/polygon";

export const POLYGONS_QUERY_KEY = ["polygons"] as const;

export const fetchPolygons = async () => {
  const { data } = await apiClient.get<Polygon[]>("/polygons");
  return data.map((polygon) => normalizePolygon(polygon));
};

export const usePolygonsQuery = () =>
  useQuery<Polygon[], AxiosError>({
    queryKey: POLYGONS_QUERY_KEY,
    queryFn: fetchPolygons,
    refetchOnWindowFocus: false,
  });

type CreateVariables = { name: string; points: [number, number][] };
type OptimisticContext = { previousPolygons: Polygon[]; tempId?: Polygon["id"] };

type CreatePolygonOptions = Omit<
  UseMutationOptions<Polygon, AxiosError, CreateVariables, OptimisticContext>,
  "mutationFn" | "onMutate"
>;

type DeletePolygonOptions = Omit<
  UseMutationOptions<unknown, AxiosError, Polygon["id"], OptimisticContext>,
  "mutationFn" | "onMutate"
>;

export const useCreatePolygonMutation = (options?: CreatePolygonOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Polygon, AxiosError, CreateVariables, OptimisticContext>({
    ...(options ?? {}),
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Polygon>("/polygons", payload);
      return normalizePolygon(data);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: POLYGONS_QUERY_KEY });
      const previousPolygons = queryClient.getQueryData<Polygon[]>(POLYGONS_QUERY_KEY) ?? [];
      const tempId = `temp-${Date.now()}`;
      const optimisticPolygon: Polygon = {
        id: tempId,
        name: variables.name,
        points: variables.points,
      };
      queryClient.setQueryData<Polygon[]>(POLYGONS_QUERY_KEY, [...previousPolygons, optimisticPolygon]);
      return { previousPolygons, tempId };
    },
    onError: (error, variables, context, mutation) => {
      if (context?.previousPolygons) {
        queryClient.setQueryData(POLYGONS_QUERY_KEY, context.previousPolygons);
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData<Polygon[]>(POLYGONS_QUERY_KEY, (current = []) => {
        if (!context?.tempId) {
          return [...current, data];
        }
        let replaced = false;
        const updated = current.map((polygon) => {
          if (polygon.id === context.tempId) {
            replaced = true;
            return data;
          }
          return polygon;
        });
        return replaced ? updated : [...current, data];
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: POLYGONS_QUERY_KEY });
      }
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
};

export const useDeletePolygonMutation = (options?: DeletePolygonOptions) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, Polygon["id"], OptimisticContext>({
    ...(options ?? {}),
    mutationFn: (id) => apiClient.delete(`/polygons/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: POLYGONS_QUERY_KEY });
      const previousPolygons = queryClient.getQueryData<Polygon[]>(POLYGONS_QUERY_KEY) ?? [];
      queryClient.setQueryData<Polygon[]>(
        POLYGONS_QUERY_KEY,
        previousPolygons.filter((polygon) => polygon.id !== id),
      );
      return { previousPolygons };
    },
    onError: (error, variables, context, mutation) => {
      if (context?.previousPolygons) {
        queryClient.setQueryData(POLYGONS_QUERY_KEY, context.previousPolygons);
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: POLYGONS_QUERY_KEY });
      }
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
};
