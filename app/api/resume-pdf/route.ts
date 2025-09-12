import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import ResumePDF from '../../components/ResumePDF'

export async function GET() {
  try {
    const stream = await renderToStream(<ResumePDF />)
    
    return new NextResponse(stream as any, {
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