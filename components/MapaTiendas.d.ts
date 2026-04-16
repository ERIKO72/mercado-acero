import React from 'react';

type MapaTiendasProps = {
  mapRef?: React.RefObject<any>;
  location: { latitude: number; longitude: number };
  tiendas: any[];
  radio: number;
  selected: any;
  onMarkerPress: (t: any) => void;
};

declare const MapaTiendas: React.FC<MapaTiendasProps>;
export default MapaTiendas;
