import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, InputGroup } from 'react-bootstrap';
import { Search } from 'lucide-react';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSearch } from '../hooks/useSearch';

interface Props {
  onSelect?: () => void;
  placeholder?: string;
}

export function SearchBar({ onSelect, placeholder = 'Buscar productos...' }: Props) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useSearch({ q: debouncedQuery }, showSuggestions);
  const suggestions = data?.data?.slice(0, 6) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setShowSuggestions(false);
    setQuery('');
    onSelect?.();
  };

  const handleSelect = (slug: string) => {
    navigate(`/productos/${slug}`);
    setShowSuggestions(false);
    setQuery('');
    onSelect?.();
  };

  return (
    <div className="position-relative" style={{ minWidth: 260 }}>
      <Form onSubmit={handleSubmit}>
        <InputGroup size="sm">
          <Form.Control
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoComplete="off"
          />
          <button className="btn btn-primary btn-sm" type="submit" aria-label="Buscar">
            <Search />
          </button>
        </InputGroup>
      </Form>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="position-absolute top-100 start-0 end-0 bg-white border rounded-3 shadow-sm mt-1 overflow-hidden"
          style={{ zIndex: 1050 }}
        >
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              className="d-flex align-items-center gap-2 w-100 text-start px-3 py-2 border-0 bg-transparent"
              style={{ cursor: 'pointer' }}
              onMouseDown={() => handleSelect(product.slug)}
            >
              {product.images?.[0]?.url && (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  width={32}
                  height={32}
                  className="rounded object-fit-cover flex-shrink-0"
                  style={{ objectFit: 'cover' }}
                />
              )}
              <span className="text-truncate small">{product.name}</span>
            </button>
          ))}
          <button
            type="button"
            className="d-block w-100 text-center small text-primary py-2 border-0 border-top bg-light"
            onMouseDown={handleSubmit as any}
          >
            Ver todos los resultados
          </button>
        </div>
      )}
    </div>
  );
}
