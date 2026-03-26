import { Container } from 'react-bootstrap';
import { AppNavbar } from '../../../shared/components/AppNavbar';
import { BottomNav } from '../../../shared/components/BottomNav';
import { AppFooter } from '../../../shared/components/AppFooter';
import { OrderList } from '../components/OrderList';

export function OrdersPage() {
  return (
    <>
      <AppNavbar />
      <Container className="py-4 pb-5 mb-4">
        <h1 className="fs-3 fw-bold mb-4">Mis pedidos</h1>
        <OrderList />
      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}
