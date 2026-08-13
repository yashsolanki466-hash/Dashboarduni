export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
export * from './generated/api';
export * from './generated/api.schemas';

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, UseQueryResult, UseMutationResult, QueryKey } from "@tanstack/react-query";
import { customFetch, ErrorType, BodyType } from "./custom-fetch";
import { BioinfoRecord, BioinfoRecordInput } from "./generated/api.schemas";

export const getGetBioinfoRecordUrl = (projectId: number) => `/api/projects/${projectId}/bioinfo`;

export const getBioinfoRecord = async (projectId: number, options?: RequestInit): Promise<BioinfoRecord> => {
  return customFetch<BioinfoRecord>(getGetBioinfoRecordUrl(projectId), {
    ...options,
    method: 'GET'
  });
};

export const getGetBioinfoRecordQueryKey = (projectId: number) => [`/api/projects/${projectId}/bioinfo`] as const;

export const getGetBioinfoRecordQueryOptions = <TData = Awaited<ReturnType<typeof getBioinfoRecord>>, TError = ErrorType<unknown>>(projectId: number, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getBioinfoRecord>>, TError, TData> }): any => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetBioinfoRecordQueryKey(projectId);
  const queryFn: any = () => getBioinfoRecord(projectId);
  return { queryKey, queryFn, enabled: projectId !== null && projectId !== undefined, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getBioinfoRecord>>, TError, TData> & { queryKey: QueryKey };
};

export function useGetBioinfoRecord<TData = Awaited<ReturnType<typeof getBioinfoRecord>>, TError = ErrorType<unknown>>(
  projectId: number, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getBioinfoRecord>>, TError, TData> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetBioinfoRecordQueryOptions(projectId, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getUpsertBioinfoRecordUrl = (projectId: number) => `/api/projects/${projectId}/bioinfo`;

export const upsertBioinfoRecord = async (projectId: number, data: BioinfoRecordInput, options?: RequestInit): Promise<BioinfoRecord> => {
  return customFetch<BioinfoRecord>(getUpsertBioinfoRecordUrl(projectId), {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(data)
  });
};

export const getUpsertBioinfoRecordMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof upsertBioinfoRecord>>, TError, { projectId: number; data: BodyType<BioinfoRecordInput> }, TContext> }): any => {
  const mutationKey = ['upsertBioinfoRecord'];
  const { mutation: mutationOptions } = options ?? {};
  const mutationFn: any = (props: { projectId: number; data: BodyType<BioinfoRecordInput> }) => {
    const { projectId, data } = props;
    return upsertBioinfoRecord(projectId, data);
  };
  return { mutationFn, mutationKey, ...mutationOptions };
};

export const useUpsertBioinfoRecord = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof upsertBioinfoRecord>>, TError, { projectId: number; data: BodyType<BioinfoRecordInput> }, TContext> }
): UseMutationResult<Awaited<ReturnType<typeof upsertBioinfoRecord>>, TError, { projectId: number; data: BodyType<BioinfoRecordInput> }, TContext> => {
  return useMutation(getUpsertBioinfoRecordMutationOptions(options));
};
