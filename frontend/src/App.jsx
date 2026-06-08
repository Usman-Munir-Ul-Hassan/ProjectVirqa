import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./routes/AppRoutes.jsx";
import { store } from "../store/store.js";
import { Provider } from "react-redux";

const queryClient = new QueryClient();

const App = () => {
  return (
     <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />{/* for seeing react query data in UI */}
      </QueryClientProvider>
     </Provider>
  );
};

export default App;
