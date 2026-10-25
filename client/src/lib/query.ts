import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";

// Options acceptées par les hooks de lecture des features (clé et fonction sont fournies par le hook)
export type QueryOptions<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">;

export type MutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn">;

// Options de mutation déduites d'une fonction d'API : (vars) => Promise<data>
export type ApiMutationOptions<F> = F extends (vars: infer V) => Promise<infer D> ? MutationOptions<D, V> : never;

/**
 * Mutation qui invalide les clés données avant d'appeler le `onSuccess` de l'appelant.
 * Chaque clé est un préfixe (ex. `["opportunities"]` couvre toutes les requêtes de la feature).
 */
export function useApiMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  invalidate: QueryKey[],
  options?: MutationOptions<TData, TVars>,
) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVars>({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      await Promise.all(invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })));
      return options?.onSuccess?.(...args);
    },
  });
}
