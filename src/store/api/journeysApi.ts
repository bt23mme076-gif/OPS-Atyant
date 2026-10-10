import { baseApi } from './baseApi'

// Student journeys + funnel, built server-side from Atyant's `funnelevents`
// collection (ops backend src/atyant/funnel.service.ts).

export interface JourneyPerson {
  type: 'user' | 'guest'
  name: string
  email: string | null
  phone: string | null
  college: string | null
}

export interface JourneyStep {
  text: string
  at: string
  event: string
}

export interface Journey {
  id: string
  person: JourneyPerson
  steps: JourneyStep[]
  firstSeen: string
  lastSeen: string
  paid: boolean
  startedBooking: boolean
  leftAfter: string
}

export interface FollowUp extends JourneyPerson {
  id: string
  lastSeen: string
  leftAfter: string
}

export interface JourneysResponse {
  days: number
  people: number
  signedIn: number
  guests: number
  leftAt: { step: string; count: number }[]
  followUp: FollowUp[]
  journeys: Journey[]
}

export interface FunnelResponse {
  days: number
  steps: { event: string; label: string; count: number }[]
  purchases: number
  handoffs: { total: number; avgSeniorsShown: number; avgRepliesBeforeSeniors: number; noSameCollegePct: number }
}

export const journeysApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getJourneys: b.query<JourneysResponse, { days: number; email?: string }>({
      query: ({ days, email }) => ({
        url: '/atyant/journeys',
        params: { days, limit: 100, ...(email ? { email } : {}) },
      }),
    }),
    getFunnel: b.query<FunnelResponse, { days: number }>({
      query: ({ days }) => ({ url: '/atyant/funnel', params: { days } }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetJourneysQuery, useGetFunnelQuery } = journeysApi
