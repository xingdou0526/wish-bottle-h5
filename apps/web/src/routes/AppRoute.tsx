import { Navigate, Route, Routes } from 'react-router-dom';
import { PhoneShell } from '../components/PhoneShell';
import { TopBar } from '../components/TopBar';
import { BottleStage } from '../features/bottle/BottleStage';
import { WishListView } from '../features/wishes/WishListView';
import { FriendsView } from '../features/friends/FriendsView';

export function AppRoute() {
  return (
    <PhoneShell>
      <TopBar />
      <main>
        <Routes>
          <Route index element={<Navigate to="bottle" replace />} />
          <Route path="bottle" element={<BottleStage />} />
          <Route path="me" element={<WishListView />} />
          <Route path="friends" element={<FriendsView />} />
        </Routes>
      </main>
    </PhoneShell>
  );
}
