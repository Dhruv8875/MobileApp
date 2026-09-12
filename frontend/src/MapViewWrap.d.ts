// Type declarations for the platform-specific MapViewWrap.
// Metro picks MapViewWrap.native.tsx (iOS/Android) or MapViewWrap.web.tsx at
// bundle time; this .d.ts gives TypeScript a single `./MapViewWrap` module to
// resolve so imports type-check without a base .tsx file.
import * as React from 'react';

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  data?: any;
};

type MapViewWrapProps = {
  center: { latitude: number; longitude: number };
  points: MapPoint[];
  onPressPoint?: (p: MapPoint) => void;
};

declare const MapViewWrap: React.ForwardRefExoticComponent<
  MapViewWrapProps & React.RefAttributes<any>
>;

export default MapViewWrap;
