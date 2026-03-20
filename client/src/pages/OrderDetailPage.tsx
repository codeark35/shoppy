import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { OrderDetail } from '../features/orders/components/OrderDetail';

export function OrderDetailPage() {
  return (
    <>
      <AppNavbar />
      <OrderDetail />
      <AppFooter />
      <BottomNav />
    </>
  );
}
