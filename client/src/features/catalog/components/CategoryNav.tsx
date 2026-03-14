import { Nav, Spinner } from 'react-bootstrap';
import { useCategories } from '../hooks/useProducts';
import type { ProductFilters } from '../types/catalog.types';

interface Props {
  activeSlug?: string;
  onSelect: (filters: Partial<ProductFilters>) => void;
}

export function CategoryNav({ activeSlug, onSelect }: Props) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) return <Spinner size="sm" />;
  if (!categories?.length) return null;

  return (
    <Nav className="flex-nowrap overflow-auto pb-1 gap-2" style={{ scrollbarWidth: 'none' }}>
      <Nav.Item>
        <Nav.Link
          className={`px-3 py-2 rounded-pill border ${!activeSlug ? 'bg-primary text-white border-primary' : 'text-body border-secondary-subtle'}`}
          style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
          onClick={() => onSelect({ categorySlug: undefined, page: 1 })}
        >
          Todo
        </Nav.Link>
      </Nav.Item>
      {categories.map((cat) => (
        <Nav.Item key={cat.id}>
          <Nav.Link
            className={`px-3 py-2 rounded-pill border ${activeSlug === cat.slug ? 'bg-primary text-white border-primary' : 'text-body border-secondary-subtle'}`}
            style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => onSelect({ categorySlug: cat.slug, page: 1 })}
          >
            {cat.name}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}
