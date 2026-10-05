import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import EventRepeatIcon from '@mui/icons-material/EventRepeat'
import NotificationsIcon from '@mui/icons-material/Notifications'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
  type NotificationType,
} from '../api/notificationsApi'
import { getApiErrorMessage } from '../api/apiError'
import { formatDateShort } from '../components/dataviz/format'
import EmptyChartState from '../components/dataviz/EmptyChartState'

function iconFor(type: NotificationType) {
  if (type === 'INSTALLMENT_DUE') return <CalendarMonthIcon />
  if (type === 'SCHEDULED_CHARGE_POSTED') return <EventRepeatIcon />
  if (type === 'SCHEDULED_CHARGE_FAILED') return <EventBusyIcon />
  if (type === 'PAYMENT_DUE' || type === 'PAYMENT_DUE_SOON' || type === 'PAYMENT_OVERDUE') return <CreditCardIcon />
  return <NotificationsIcon />
}

export default function NotificationsPage() {
  const { t } = useTranslation('notifications')
  const queryClient = useQueryClient()

  const { data: allNotifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
  })

  const unreadCount = allNotifications?.filter((n) => n.status === 'UNREAD').length ?? 0

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4" component="h1">
            {t('title')}
          </Typography>
          {unreadCount > 0 && <Chip size="small" color="error" label={unreadCount} />}
        </Stack>
        <Button
          variant="outlined"
          startIcon={<DoneAllIcon />}
          onClick={() => markAllReadMutation.mutate()}
          disabled={unreadCount === 0 || markAllReadMutation.isPending}
        >
          {t('markAllRead')}
        </Button>
      </Stack>

      {markAllReadMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(markAllReadMutation.error, t('common:errors.generic'))}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{t('loadError')}</Alert>}

      {allNotifications && allNotifications.length === 0 && <EmptyChartState message={t('empty')} />}

      {allNotifications && allNotifications.length > 0 && (
        <Paper variant="outlined">
          <List disablePadding>
            {allNotifications.map((notification, index) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                divider={index < allNotifications.length - 1}
                onMarkRead={() => markReadMutation.mutate(notification.id)}
                markingRead={markReadMutation.isPending && markReadMutation.variables === notification.id}
              />
            ))}
          </List>
        </Paper>
      )}
    </Box>
  )
}

function NotificationRow({
  notification,
  divider,
  onMarkRead,
  markingRead,
}: {
  notification: Notification
  divider: boolean
  onMarkRead: () => void
  markingRead: boolean
}) {
  const { t } = useTranslation('notifications')
  const isUnread = notification.status === 'UNREAD'
  const isScheduledCharge = notification.type === 'SCHEDULED_CHARGE_POSTED' || notification.type === 'SCHEDULED_CHARGE_FAILED'
  // Un cargo que no se pudo registrar quedó pausado y requiere acción del usuario: se resalta como advertencia.
  const iconColor = !isUnread ? 'text.disabled' : notification.type === 'SCHEDULED_CHARGE_FAILED' ? 'warning.main' : 'primary.main'

  return (
    <ListItem
      divider={divider}
      sx={{ bgcolor: isUnread ? 'action.hover' : 'transparent', py: 1.5 }}
      secondaryAction={
        isUnread && (
          <Tooltip title={t('markRead')}>
            <span>
              <IconButton edge="end" size="small" onClick={onMarkRead} disabled={markingRead} aria-label={t('markRead')}>
                <RadioButtonUncheckedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )
      }
    >
      <ListItemIcon sx={{ color: iconColor }}>{iconFor(notification.type)}</ListItemIcon>
      <ListItemText
        primary={
          <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: isUnread ? 600 : 400 }}>
              {notification.title}
            </Typography>
            {isUnread && <Chip size="small" color="primary" label={t('unread')} />}
          </Stack>
        }
        secondary={
          <>
            <Typography component="span" variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
              {notification.message}
            </Typography>
            <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
              {formatDateShort(notification.createdAt.slice(0, 10))}
            </Typography>
            {isScheduledCharge && (
              <Link component={RouterLink} to="/scheduled-charges" variant="caption" sx={{ ml: 1.5 }}>
                {t('scheduledCharges:notifications.viewLink')}
              </Link>
            )}
          </>
        }
      />
    </ListItem>
  )
}
