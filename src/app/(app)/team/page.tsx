import { redirect } from 'next/navigation'

// Old /team page — merged into Command Centre
export default function TeamPage() {
  redirect('/command-centre')
}