import { NextRequest, NextResponse } from "next/server"
import { getSelfHostedUser } from "@/models/users"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { safePathJoin, getUserUploadsDirectory, unsortedFilePath } from "@/lib/files"
import path from "path"
import { createFile } from "@/models/files"
import config from "@/lib/config"

export async function GET(req: NextRequest) {
  // VerificaciÃ³n de Webhook para WhatsApp Cloud API
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "Taxio_secret_2026"

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 })
    } else {
      return new NextResponse("Forbidden", { status: 403 })
    }
  }
  return new NextResponse("Bad Request", { status: 400 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    // Solo procesamos si es un documento o imagen vÃ¡lida de WhatsApp
    if (!message || (message.type !== "document" && message.type !== "image")) {
      return NextResponse.json({ success: true, reason: "No file content" })
    }

    const fileId = message.type === "document" ? message.document.id : message.image.id
    const mimeType = message.type === "document" ? message.document.mime_type : message.image.mime_type
    const defaultFilename = `WhatsApp_${message.type}_${Date.now()}.` + (mimeType.includes("pdf") ? "pdf" : "jpg")
    const filename = message.type === "document" && message.document.filename ? message.document.filename : defaultFilename

    // AquÃ­ irÃ­a la lÃ³gica para descargar el archivo de WhatsApp Graph API usando el fileId
    // const fileBuffer = await downloadWhatsAppMedia(fileId, process.env.WHATSAPP_TOKEN)
    // Para prototipo, asuminos un buffer vacÃ­o hasta que configuremos la API real:
    const fileBuffer = Buffer.from("")

    const user = await getSelfHostedUser()
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // LÃ³gica nativa de Taxio para subir el archivo
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const fileUuid = randomUUID()
    const relativeFilePath = unsortedFilePath(fileUuid, filename)
    
    const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)
    await mkdir(path.dirname(fullFilePath), { recursive: true })
    
    if (fileBuffer.length > 0) {
       await writeFile(fullFilePath, fileBuffer)
    }

    // Inyectarlo en la base de datos de Taxio como "Unsorted"
    await createFile(user.id, {
      id: fileUuid,
      filename: filename,
      path: relativeFilePath,
      mimetype: mimeType,
      metadata: {
        size: fileBuffer.length,
        lastModified: Date.now(),
        source: "whatsapp"
      },
    })

    return NextResponse.json({ success: true, processed: true, fileId: fileUuid })

  } catch (error) {
    console.error("WhatsApp Webhook Error:", error)
    return new NextResponse("Internal API Error", { status: 500 })
  }
}
