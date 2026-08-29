import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function EmptyChartState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {message}
      </Typography>
    </Box>
  )
}
