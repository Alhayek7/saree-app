# سريع - توصيل سريع

تطبيق توصيل سريع للطرود يربط العملاء بالسائقين في غزة، مع نظام مزايدة على الأسعار وإدارة رصيد العمولات.

## Run & Operate

- `pnpm --filter @workspace/saree run dev` — run the Expo app (web preview)
- `pnpm --filter @workspace/saree run typecheck` — typecheck the Expo app

## Stack

- Expo ~54 + expo-router ~6, React Native
- TypeScript 5.9, pnpm workspaces
- AsyncStorage (local state — no backend yet)
- Cairo Google Font, RTL (I18nManager.forceRTL)
- @expo/vector-icons (Feather), expo-haptics, expo-blur

## Where things live

```
artifacts/saree/
  app/
    (customer)/         Customer tabs: home, orders, profile
    (driver)/           Driver tabs: orders (bids), earnings, agents, profile
    (agent)/            Agent tabs: sell, codes, commissions
    (admin)/            Admin tabs
    pending-approval.tsx  Driver awaiting admin activation
    driver-order.tsx    Active order execution screen (driver)
    new-order.tsx       3-step order wizard (customer)
    order-offers.tsx    Driver bid selection (customer)
    track-order.tsx     Live order tracking (customer)
    rate-driver.tsx     Rating screen (customer)
  context/
    AuthContext.tsx     User state, driver commission wallet, wallet top-up
    OrdersContext.tsx   Orders state, driver bids, status flow
  hooks/useColors.ts   Theme colors (light/dark)
  components/ui/       Button, Input, etc.
```

## Architecture decisions

- All state is local via AsyncStorage — no backend yet; easy to swap in later.
- Driver bid system: drivers submit price offers → system shows cheapest 3 to customer.
- Commission balance: drivers start with 20 ILS on activation; 1 ILS deducted per accepted order, refunded if cancelled.
- Route group `/(driver)` vs `/(customer)` resolved by index.tsx based on `user.role` + `user.driverStatus`.
- Expo-router typed routes: group paths cast with `as any` since typed routes don't support `/(group)/` notation.

## Product

**Customer flow:** Create order (pickup/delivery/package/vehicle/payment) → see 3 cheapest driver bids → select driver → track order → confirm delivery → rate driver.

**Driver flow:** Register (with ID + vehicle type) → pending approval → 20 ILS welcome balance on activation → browse open orders → submit price bid → if selected, execute order (going → picked up → delivered) → 1 ILS commission deducted per order.

**Agent flow:** Sell top-up codes to drivers, track commissions.

**Admin flow:** View all orders and users.

## Demo accounts

| Role | Phone | Password |
|------|-------|----------|
| Customer | 0591234567 | 123456 |
| Driver (active, 20₪ balance) | 0597654321 | 123456 |
| Agent | 0591112222 | 123456 |
| Admin | 0599998888 | 123456 |

## User preferences

- RTL Arabic UI throughout
- Always use `useColors()` hook — never hardcode hex values
- UUID pattern: `Date.now().toString()`
- Web insets: top 67px, bottom 34px; tab bar height 84px web / 62px native
- Colors: primary #6C63FF, driver green #28A745

## Gotchas

- Run `pnpm --filter @workspace/saree run typecheck` before shipping — Expo typed routes don't support `/(group)/` paths, use `as any` cast.
- `useNativeDriver` warning on web is expected — no native animation module in browser.
