import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { OrderDetail } from '../features/orders/components/OrderDetail';
import { useAuthStore } from '../features/auth/store/authStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function OrderDetailPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <>
      <AppNavbar />
      <OrderDetail />
      <BottomNav />
    </>
  );
}
