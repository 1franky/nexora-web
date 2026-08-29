import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ConstructionIcon from '@mui/icons-material/Construction'

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary', py: 8 }}>
      <ConstructionIcon fontSize="large" sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2">Esta sección todavía no está lista — llega en una fase posterior.</Typography>
    </Box>
  )
}
