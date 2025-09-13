import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import ResumePDF from '../../components/ResumePDF'

export async function GET() {
  try {
    // Use createElement instead of JSX syntax
    const pdfElement = createElement(ResumePDF)
    const buffer = await renderToBuffer(pdfElement)
    
    // Convert Buffer to ArrayBuffer for Response compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Bruce_Truong_Resume.pdf"',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}