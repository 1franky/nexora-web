import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CategoryIcon from '@mui/icons-material/Category'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../auth/AuthContext'
import { listNotifications } from '../api/notificationsApi'
import ThemeModeSwitch from './ThemeModeSwitch'

const DRAWER_WIDTH = 260

const NAV_ITEMS = [
  { to: '/', labelKey: 'nav.dashboard', icon: <DashboardIcon /> },
  { to: '/accounts', labelKey: 'nav.accounts', icon: <AccountBalanceIcon /> },
  { to: '/transactions', labelKey: 'nav.transactions', icon: <SwapHorizIcon /> },
  { to: '/credit-cards', labelKey: 'nav.creditCards', icon: <CreditCardIcon /> },
  { to: '/reports', labelKey: 'nav.reports', icon: <AssessmentIcon /> },
  { to: '/categories', labelKey: 'nav.categories', icon: <CategoryIcon /> },
  { to: '/notifications', labelKey: 'nav.notifications', icon: <NotificationsIcon /> },
] as const

export default function AppLayout() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)

  // Compartida con NotificationsPage (misma queryKey): entrar a esa página
  // no dispara una segunda consulta, solo reusa/actualiza este mismo caché.
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: () => listNotifications() })
  const unreadCount = notifications?.filter((n) => n.status === 'UNREAD').length ?? 0

  const navContent = (
    <>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
          {t('app.name')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              sx={{
                '&.active': {
                  bgcolor: 'action.selected',
                  borderRight: 3,
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon>
                {item.to === '/notifications' && unreadCount > 0 ? (
                  <Badge badgeContent={unreadCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/settings" onClick={() => setMobileOpen(false)}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t('nav.settings')} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1 }}>
        <Toolbar>
          {!isDesktop && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.displayName}
          </Typography>
          <ThemeModeSwitch />
          <Tooltip title={t('nav.logout')}>
            <IconButton color="inherit" onClick={() => logout()} aria-label={t('nav.logout')}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {navContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {navContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
