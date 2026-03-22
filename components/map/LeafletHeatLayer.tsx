'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatLayerProps {
  points: [number, number, number][];
  radius?: number;
  blur?: number;
  max?: number;
  gradient?: { [key: number]: string };
  minOpacity?: number;
}

export default function LeafletHeatLayer({ 
  points, 
  radius = 25, 
  blur = 20, 
  max = 1.0, 
  gradient,
  minOpacity = 0.4
}: HeatLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait for map to be fully initialized
    timeoutRef.current = setTimeout(() => {
      if (!map || !map.getContainer()) {
        console.warn('Map not ready');
        return;
      }

      // Remove existing layer
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      // Validate points
      if (!points || points.length === 0) {
        console.log('No heatmap points');
        return;
      }

      const validPoints = points.filter(p => 
        Array.isArray(p) && 
        p.length === 3 && 
        !isNaN(p[0]) && 
        !isNaN(p[1]) && 
        !isNaN(p[2]) &&
        p[2] > 0
      );

      if (validPoints.length === 0) {
        console.warn('No valid points');
        return;
      }

      try {
        // Create and add layer
        const heat = L.heatLayer(validPoints, {
          radius,
          blur,
          maxZoom: 18,
          max,
          minOpacity,
          gradient: gradient || {
  0.0: 'lightblue',   // Add a very low intensity color
  0.2: 'blue',
  0.4: 'cyan',
  0.6: 'lime',
  0.8: 'yellow',
  1.0: 'red'
}
        });

        heat.addTo(map);
        layerRef.current = heat;
        
        // Force redraw
        setTimeout(() => map.invalidateSize(), 100);
        
        console.log('Heat layer added with', validPoints.length, 'points');
      } catch (error) {
        console.error('Error adding heat layer:', error);
      }
    }, 100); // Small delay to ensure map is ready

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, radius, blur, max, gradient, minOpacity]);

  return null;
}