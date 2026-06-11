import { executeSparql } from '@/lib/graphdb'

// --------- thesaurus query ---------
const THESAURUS_SPARQL = `
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX hint: <https://w3id.org/hi-thesaurus/>

SELECT DISTINCT ?term ?label ?definition ?broader ?broaderLabel
WHERE {
  ?term a skos:Concept ;
        skos:prefLabel ?label .
  FILTER(STRSTARTS(STR(?term), "https://w3id.org/hi-thesaurus/"))
  OPTIONAL {
    ?term skos:definition ?definition .
    FILTER(LANG(?definition) = "en" || LANG(?definition) = "")
  }
  OPTIONAL {
    ?term skos:broader ?broader .
    ?broader skos:prefLabel ?broaderLabel .
    FILTER(LANG(?broaderLabel) = "en" || LANG(?broaderLabel) = "") 
  }
  FILTER(LANG(?label) = "en" || LANG(?label) = "")
}
ORDER BY ?broader ?label
`.trim()

export async function GET() {
  try {
    const result = await executeSparql(THESAURUS_SPARQL)

    const terms = result.results.bindings.map((b) => ({
      uri: b.term?.value ?? '',
      label: b.label?.value ?? '',
      definition: b.definition?.value ?? '',
      broader: b.broader?.value ?? null,
      broaderLabel: b.broaderLabel?.value ?? null,
    }))

    return Response.json({ terms })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch thesaurus', details: String(error) },
      { status: 500 }
    )
  }
}
