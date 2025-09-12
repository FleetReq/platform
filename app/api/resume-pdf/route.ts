import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import ResumePDF from '../../components/ResumePDF'

export async function GET() {
  try {
    // Use createElement instead of JSX syntax
    const pdfElement = createElement(ResumePDF)
    const buffer = await renderToBuffer(pdfElement)
    
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer)
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Bruce_Truong_Resume.pdf"'
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}