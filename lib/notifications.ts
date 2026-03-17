import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  type: 'service_request' | 'appointment' | 'report' | 'system',
  relatedId?: string
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating notification:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error creating notification:', error)
    return null
  }
}
