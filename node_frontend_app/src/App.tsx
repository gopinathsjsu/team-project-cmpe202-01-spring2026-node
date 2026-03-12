import Header from './app/pages/header';
import AppRoutes from './app/pages/routes';
import { AuthProvider } from './app/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Header />
      <AppRoutes />
    </AuthProvider>
  )
}

export default App;
