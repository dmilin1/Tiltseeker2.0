import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Navbar from '../assets/Navbar'

export const Route = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})