import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LogIn, Eye, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoader } from '@/components/global/Loading';
import { EmptyState } from '@/components/global/EmptyState';
import {
  useLoginLocationPoints,
  useLoginLocationStates,
  useOrderLocationStates,
  useVisitLocationReport,
} from './cipApi';
import { stateCentroid } from './indiaStateCentroids';

const INDIA_CENTER = [22.9734, 78.6569];

// sqrt scale - a state with 4x the count of another gets a circle only 2x
// the radius, so one big city's volume doesn't visually swallow the map.
const radiusForCount = (count, max) => 6 + 18 * Math.sqrt((count || 0) / (max || 1));

function LocationMap({ points }) {
  return (
    <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom style={{ height: '520px', width: '100%', borderRadius: 'var(--radius-card)' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={p.radius} pathOptions={{ color: '#c8a24a', fillColor: '#c8a24a', fillOpacity: 0.45 }}>
          <Popup>
            <p className="font-medium">{p.label}</p>
            {p.sublabel && <p className="text-xs text-muted-foreground">{p.sublabel}</p>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function StateTable({ rows, countLabel }) {
  if (rows.length === 0) return <EmptyState title="No data yet" description="Real activity will show up here once it happens." />;
  return (
    <div className="flex flex-col divide-y divide-border rounded-card border border-border">
      {rows.map((row) => (
        <div key={row.state} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="font-medium text-foreground">{row.state}</span>
          <span className="text-muted-foreground">
            {row.count} {countLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoginsTab() {
  const { data: points, isLoading: pointsLoading } = useLoginLocationPoints();
  const { data: states, isLoading: statesLoading } = useLoginLocationStates();

  const mapPoints = useMemo(
    () =>
      (points ?? []).map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        radius: 7,
        label: [p.city, p.state].filter(Boolean).join(', ') || 'Unknown location',
        sublabel: new Date(p.createdAt).toLocaleString('en-IN'),
      })),
    [points]
  );
  const stateRows = useMemo(() => (states ?? []).map((s) => ({ state: s._id, count: s.count })), [states]);

  if (pointsLoading || statesLoading) return <PageLoader label="Loading login locations..." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {mapPoints.length === 0 ? (
        <EmptyState
          icon={LogIn}
          title="No precise logins recorded yet"
          description="Points appear here once a signed-in customer grants the browser's location permission."
        />
      ) : (
        <LocationMap points={mapPoints} />
      )}
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">By State</p>
        <StateTable rows={stateRows} countLabel="logins" />
      </div>
    </div>
  );
}

function VisitsTab() {
  const { data, isLoading } = useVisitLocationReport();
  const stateRows = useMemo(() => (data?.byState ?? []).map((s) => ({ state: s._id, count: s.count })), [data]);
  const maxCount = Math.max(1, ...stateRows.map((r) => r.count));

  const mapPoints = useMemo(
    () =>
      stateRows
        .map((row) => {
          const centroid = stateCentroid(row.state);
          if (!centroid) return null;
          return {
            id: row.state,
            lat: centroid[0],
            lng: centroid[1],
            radius: radiusForCount(row.count, maxCount),
            label: row.state,
            sublabel: `${row.count} visits (city/state-level, from page-view IP geolocation)`,
          };
        })
        .filter(Boolean),
    [stateRows, maxCount]
  );

  if (isLoading) return <PageLoader label="Loading visit locations..." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {mapPoints.length === 0 ? (
        <EmptyState icon={Eye} title="No visit location data yet" description="Populates as real storefront page views are tracked." />
      ) : (
        <LocationMap points={mapPoints} />
      )}
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">By State</p>
        <StateTable rows={stateRows} countLabel="visits" />
      </div>
    </div>
  );
}

function OrdersTab() {
  const { data, isLoading } = useOrderLocationStates();
  const stateRows = useMemo(() => (data ?? []).map((s) => ({ state: s._id, count: s.count })), [data]);
  const maxCount = Math.max(1, ...stateRows.map((r) => r.count));

  const mapPoints = useMemo(
    () =>
      stateRows
        .map((row) => {
          const centroid = stateCentroid(row.state);
          if (!centroid) return null;
          return {
            id: row.state,
            lat: centroid[0],
            lng: centroid[1],
            radius: radiusForCount(row.count, maxCount),
            label: row.state,
            sublabel: `${row.count} orders shipped here (state-level - real shipping address)`,
          };
        })
        .filter(Boolean),
    [stateRows, maxCount]
  );

  if (isLoading) return <PageLoader label="Loading order locations..." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {mapPoints.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No order location data yet" description="Populates as real orders are placed and shipped." />
      ) : (
        <LocationMap points={mapPoints} />
      )}
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">By State</p>
        <StateTable rows={stateRows} countLabel="orders" />
      </div>
    </div>
  );
}

const TABS = [
  { key: 'logins', label: 'Logins', icon: LogIn, Component: LoginsTab },
  { key: 'visits', label: 'Visits', icon: Eye, Component: VisitsTab },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, Component: OrdersTab },
];

// Where a real customer signed in from (browser GPS, opt-in), browsed from
// (IP-derived city/state, every page view), and ordered from (the real
// shipping address on the order) - three genuinely different data sources,
// never blended into one misleading "location" number. Every marker/row
// here is real activity; a store with no traffic yet shows an EmptyState,
// never a placeholder map.
export default function LocationIntelligencePage() {
  const [tab, setTab] = useState('logins');
  const Active = TABS.find((t) => t.key === tab)?.Component;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <MapPin className="size-6 text-primary" /> Location Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Where customers sign in from, browse from, and order from.</p>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                  <t.icon className="size-3.5" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <CardTitle className="sr-only">{TABS.find((t) => t.key === tab)?.label} Locations</CardTitle>
          {Active && <Active />}
        </CardContent>
      </Card>
    </div>
  );
}
