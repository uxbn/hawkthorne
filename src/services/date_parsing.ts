import { Chrono, ParsedResult, ParsingOption } from "chrono-node";

// Chrono only appears to identify PT and ET in date strings. MT and CT are ignored, so a custom
// parser is used to catch those timezones and provide their context.
// TODO: Use this method to "fix" timezones if needed for daylight savings.
export function parseDate(text: string, ref?: Date, option?: ParsingOption): ParsedResult[] {
  const chrono = new Chrono()
  chrono.parsers.push({
    pattern: () => { return /MT|CT/ },
    extract: (_, match) => {
      const timezoneAbbreviation = match[0]
      if (!timezoneAbbreviation) {
        return {}
      }
      switch (timezoneAbbreviation) {
        // TODO: Daylight savings.
        case "MT":
          return { timezoneOffset: 60 * -7 }
        case "CT":
          return { timezoneOffset: 60 * -6 }
        default:
          throw "Unhandled timezone " + timezoneAbbreviation
      }
    }
  })
  return chrono.parse(text, ref, option)
}