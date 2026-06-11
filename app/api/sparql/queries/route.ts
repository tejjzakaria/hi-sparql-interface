import { CQ_QUERIES } from '@/lib/cq-queries'

export async function GET() {
  const queries = Object.values(CQ_QUERIES).map(({ name, title, description, paramCategory, paramName }) => ({
    name,
    title,
    description,
    paramCategory,
    paramName,
  }))

  return Response.json({ queries })
}
 