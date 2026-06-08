import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from '~react-pages'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
