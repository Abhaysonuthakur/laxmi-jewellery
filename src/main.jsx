import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { WishlistProvider } from './auth/WishlistProvider'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found in index.html')
}

/*
 * Provider order is a dependency order, not a preference: the wishlist is
 * per-user, so it has to sit inside the provider that knows who the user is.
 * Swapping these two lines gives a wishlist that loads before the session
 * resolves and always comes back empty.
 */
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
