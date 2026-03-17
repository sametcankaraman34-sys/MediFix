import { supabaseClient } from './supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function subscribeToTable<T>(
  table: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new: T | null, old: T | null }) => void
): RealtimeChannel {
  const channel = supabaseClient
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T | null,
          old: payload.old as T | null
        })
      }
    )
    .subscribe()

  return channel
}

export function unsubscribeFromTable(channel: RealtimeChannel): void {
  supabaseClient.removeChannel(channel)
}

export function subscribeToServiceRequests(
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new: any | null, old: any | null }) => void
): RealtimeChannel {
  return subscribeToTable('service_requests', callback)
}

export function subscribeToAppointments(
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new: any | null, old: any | null }) => void
): RealtimeChannel {
  return subscribeToTable('appointments', callback)
}

export function subscribeToReports(
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new: any | null, old: any | null }) => void
): RealtimeChannel {
  return subscribeToTable('reports', callback)
}
