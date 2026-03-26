import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualListOptions {
  /** Número total de items en la lista */
  count: number;
  /** Altura estimada de cada fila en px (para el cálculo inicial) */
  estimateSize?: number;
  /** Padding superior e inferior del contenedor en px */
  overscan?: number;
}

/**
 * Hook que encapsula `@tanstack/react-virtual` para listas y tablas largas.
 *
 * @example — Tabla con filas de altura fija
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { virtualItems, totalSize, getItemKey } = useVirtualList({
 *   count: products.length,
 *   estimateSize: 56,      // altura de cada <tr> en px
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 500, overflowY: 'auto' }}>
 *     <table style={{ height: totalSize }}>
 *       <tbody>
 *         {virtualItems.map((vRow) => {
 *           const item = products[vRow.index];
 *           return (
 *             <tr
 *               key={item.id}
 *               ref={vRow.measureRef}
 *               style={{ transform: `translateY(${vRow.start}px)`, position: 'absolute', width: '100%' }}
 *             >
 *               ...celdas
 *             </tr>
 *           );
 *         })}
 *       </tbody>
 *     </table>
 *   </div>
 * );
 */
export function useVirtualList({ count, estimateSize = 52, overscan = 5 }: UseVirtualListOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return {
    /** Ref para asignar al contenedor scroll */
    containerRef,
    /** Items virtuales a renderizar en el DOM */
    virtualItems: virtualizer.getVirtualItems(),
    /** Altura total necesaria para el scroll (asignar a un spacer o al contenedor) */
    totalSize: virtualizer.getTotalSize(),
    /** Mide una fila en tiempo real (asignar como ref a cada fila) */
    measureElement: virtualizer.measureElement,
  };
}
