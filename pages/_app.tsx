import type { AppProps } from "next/app";
import { AuthProvider } from "lib/auth";
import { QueryClient, QueryClientProvider } from "react-query";
import "styles/antd.less";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default MyApp;
