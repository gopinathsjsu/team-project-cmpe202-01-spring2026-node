import Header from './app/pages/header';
import AppRoutes from './app/routes';
import { AuthProvider } from './app/context/AuthContext';
import Footer from './app/pages/footer';
import { Toaster } from './app/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
      </div>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}

export default App;
