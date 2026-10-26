import { BrowserRouter } from 'react-router';
import { Button, Screen, Tile } from '../components/ui';

/** Temporary design check; replaced by the router in the routes step. */
export function App() {
  return (
    <BrowserRouter>
      <Screen eyebrow="guestcam" title="Zaim & Hidayah" bottom={<Button variant="primary">Snap!</Button>}>
        <div className="grid grid-cols-2 gap-4">
          <Tile icon="□" label="Snap" />
          <Tile icon="□" label="Galeri" wide />
        </div>
        <Button>Sekunder</Button>
      </Screen>
    </BrowserRouter>
  );
}
