import axios from 'axios'

/** Espejo de com.nexora.api.common.web.ApiError (ver GlobalExceptionHandler en nexora-api). */
interface ApiErrorBody {
  status: number
  error: string
  message?: string
  path: string
  fieldErrors: { field: string; message?: string }[]
}

/** Extrae un mensaje legible de un error de axios contra nexora-api; si no aplica, devuelve un genérico. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
