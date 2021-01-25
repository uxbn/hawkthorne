interface TimeZone {
  name: string,
  description: string,
  offset: number,
}

// TODO: Make DST aware.
export class TimeZoneParser {
  private static timeZones: TimeZone[] = [
    { name: "GMT", description: "Greenwich Mean Time", offset: 0 },
    { name: "UTC", description: "Universal Coordinated Time", offset: 0 },
    { name: "ECT", description: "European Central Time", offset: 60 },
    { name: "EET", description: "Eastern European Time", offset: 120 },
    { name: "ART", description: "(Arabic) Egypt Standard Time", offset: 120 },
    { name: "EAT", description: "Eastern African Time", offset: 180 },
    { name: "MET", description: "Middle East Time", offset: 210 },
    { name: "NET", description: "Near East Time", offset: 240 },
    { name: "PLT", description: "Pakistan Lahore Time", offset: 300 },
    { name: "IST", description: "India Standard Time", offset: 330 },
    { name: "BST", description: "Bangladesh Standard Time", offset: 360 },
    { name: "VST", description: "Vietnam Standard Time", offset: 420 },
    { name: "CTT", description: "China Taiwan Time", offset: 480 },
    { name: "JST", description: "Japan Standard Time", offset: 540 },
    { name: "ACT", description: "Australia Central Time", offset: 570 },
    { name: "AET", description: "Australia Eastern Time", offset: 600 },
    { name: "SST", description: "Solomon Standard Time", offset: 660 },
    { name: "NST", description: "New Zealand Standard Time", offset: 720 },
    { name: "MIT", description: "Midway Islands Time", offset: -660 },
    { name: "HST", description: "Hawaii Standard Time", offset: -600 },
    { name: "AST", description: "Alaska Standard Time", offset: -540 },
    { name: "PST", description: "Pacific Standard Time", offset: -480 },
    { name: "PNT", description: "Phoenix Standard Time", offset: -420 },
    { name: "MST", description: "Mountain Standard Time", offset: -420 },
    { name: "CST", description: "Central Standard Time", offset: -360 },
    { name: "EST", description: "Eastern Standard Time", offset: -300 },
    { name: "IET", description: "Indiana Eastern Standard Time", offset: -300 },
    { name: "PRT", description: "Puerto Rico and US Virgin Islands Time", offset: -240 },
    { name: "CNT", description: "Canada Newfoundland Time", offset: -210 },
    { name: "AGT", description: "Argentina Standard Time", offset: -180 },
    { name: "BET", description: "Brazil Eastern Time", offset: -180 },
    { name: "CAT", description: "Central African Time", offset: -60 },
  ]

  static offsetToTimeZoneName(timeZoneOffset: number): string|undefined {
    const timeZone = this.timeZones.find(t => t.offset == timeZoneOffset)
    return timeZone ? timeZone.name : undefined
  }
}