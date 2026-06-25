import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // ── Validate type ──────────────────────────────────────────
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, or GIF allowed' },
        { status: 400 }
      )
    }

    // ── Validate size (max 2 MB) ───────────────────────────────
    const MAX_BYTES = 2 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File must be under 2 MB' },
        { status: 400 }
      )
    }

    // ── Save to /public/uploads/profiles/ ─────────────────────
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext      = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const dir      = path.join(process.cwd(), 'public', 'uploads', 'profiles')

    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)

    const url = `/uploads/profiles/${filename}`
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[profile/upload]', err)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
