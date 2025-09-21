import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 600_000, retry: 1 },
    mutations: { retry: 0 }
  }
});
persistQueryClient({ queryClient, persister: createAsyncStoragePersister({ storage: AsyncStorage }), maxAge: 24*60*60*1000 });
