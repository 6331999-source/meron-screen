// חישוב זמני היום ולוח עברי – עובד בלי אינטרנט
// חישוב השמש לפי האלגוריתם של NOAA
(function (root) {
  'use strict';

  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;

  function julianCentury(jd) { return (jd - 2451545.0) / 36525.0; }

  function sunParams(t) {
    const L0 = ((280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360 + 360) % 360;
    const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const C = Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
      Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) +
      Math.sin(rad(3 * M)) * 0.000289;
    const omega = 125.04 - 1934.136 * t;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
    const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const eps = e0 + 0.00256 * Math.cos(rad(omega));
    const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    let y = Math.tan(rad(eps) / 2); y *= y;
    const eqTime = 4 * deg(
      y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) +
      4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
      0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
    return { dec, eqTime };
  }

  // jd0 = יום יוליאני של חצות UTC. מחזיר דקות UTC, או null אם אין אירוע
  function eventMinutesUTC(jd0, lat, lon, zenith, rising) {
    let minutes = 720 - 4 * lon;
    for (let i = 0; i < 3; i++) {
      const { dec, eqTime } = sunParams(julianCentury(jd0 + minutes / 1440));
      if (zenith === null) { minutes = 720 - 4 * lon - eqTime; continue; }
      const cosH = Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(dec))) -
        Math.tan(rad(lat)) * Math.tan(rad(dec));
      if (cosH > 1 || cosH < -1) return null;
      const H = deg(Math.acos(cosH)) * (rising ? 1 : -1);
      minutes = 720 - 4 * (lon + H) - eqTime;
    }
    return minutes;
  }

  function jdOf(y, m, d) { return Date.UTC(y, m - 1, d) / 86400000 + 2440587.5; }

  function sunEvent(y, m, d, loc, depression, rising) {
    const zenith = depression === null ? null : 90 + depression;
    const min = eventMinutesUTC(jdOf(y, m, d), loc.lat, loc.lon, zenith, rising);
    return min === null ? null : new Date(Date.UTC(y, m - 1, d) + min * 60000);
  }

  const addMin = (date, m) => new Date(date.getTime() + m * 60000);
  const between = (a, b, frac) => new Date(a.getTime() + (b.getTime() - a.getTime()) * frac);

  // y,m,d = התאריך האזרחי בישראל. השיטות לפי לוח "עתים לבינה"
  function calcZmanim(y, m, d, s) {
    const loc = { lat: s.latitude, lon: s.longitude };
    const at = (deg, rising) => sunEvent(y, m, d, loc, deg, rising);
    const sunrise = at(s.horizonDegrees, true);    // הנץ במישור
    const sunset = at(s.horizonDegrees, false);    // שקיעה במישור
    const alos90 = at(s.alos90Degrees, true);
    const alos72 = at(s.alos72Degrees, true);
    const tzeis72 = at(s.alos72Degrees, false);
    const gra = h => between(sunrise, sunset, h / 12);
    const mga = h => between(alos72, tzeis72, h / 12);
    const chatzos = sunEvent(y, m, d, loc, null);  // חצות אמיתי
    const gedola = gra(6.5), gedola30 = addMin(chatzos, 30);
    return {
      alos90, alos72, misheyakir: at(s.misheyakirDegrees, true), sunrise,
      shemaMGA: mga(3), shemaGRA: gra(3),
      tefilaMGA: mga(4), tefilaGRA: gra(4),
      chatzos, minchaGedola: gedola > gedola30 ? gedola : gedola30,  // המאוחר
      minchaKetana: gra(9.5), plag: gra(10.75),
      sunset,
      tzeisGeonim: at(s.tzeisGeonimDegrees, false),
      tzeis: at(s.tzeisDegrees, false),
      tzeisRT: tzeis72,
      // הדלקת נרות לפני השקיעה מהגובה, כמו בעתים לבינה
      candles: addMin(at(s.elevatedHorizonDegrees, false), -s.candleLightingMinutes),
      tzeisShabbat: at(s.shabbatEndDegrees, false),
    };
  }

  // ---------- לוח עברי ----------
  const HEB_MONTHS = {
    'Tishri': 'תשרי', 'Heshvan': 'חשון', 'Kislev': 'כסלו', 'Tevet': 'טבת', 'Shevat': 'שבט',
    'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', 'Adar': 'אדר', 'Nisan': 'ניסן', 'Iyar': 'אייר',
    'Sivan': 'סיון', 'Tamuz': 'תמוז', 'Av': 'אב', 'Elul': 'אלול',
  };
  const hebFmt = new Intl.DateTimeFormat('en-u-ca-hebrew', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  });

  function hebDate(y, m, d) {
    const parts = {};
    for (const p of hebFmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)))) parts[p.type] = p.value;
    let month = parts.month;
    // שמות חודשים לפי גרסאות שונות של הדפדפן
    const norm = { 'Tishrei': 'Tishri', 'Cheshvan': 'Heshvan', 'Tammuz': 'Tamuz', 'Shvat': 'Shevat', 'Iyyar': 'Iyar' };
    month = norm[month] || month;
    return { day: +parts.day, month, year: +String(parts.year || parts.relatedYear).replace(/\D/g, '') };
  }

  function gematria(n) {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = hundreds[Math.floor(n / 100) % 10] + tens[Math.floor(n / 10) % 10] + ones[n % 10];
    s = s.replace('יה', 'טו').replace('יו', 'טז');
    return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
  }

  function hebDateText(h) {
    return `${gematria(h.day)} ${HEB_MONTHS[h.month] || h.month} ${gematria(h.year % 1000)}`;
  }

  function shiftDate(y, m, d, days) {
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
  }

  // חגים לפי מנהג ארץ ישראל. yomTov = יום שאסור במלאכה
  function dayInfo(y, m, d) {
    const h = hebDate(y, m, d);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const k = h.month, n = h.day;
    let name = null, yomTov = false;
    const is = (mm, dd) => k === mm && n === dd;
    if (is('Tishri', 1) || is('Tishri', 2)) { name = 'ראש השנה'; yomTov = true; }
    else if (is('Tishri', 9)) name = 'ערב יום הכיפורים';
    else if (is('Tishri', 10)) { name = 'יום הכיפורים'; yomTov = true; }
    else if (is('Tishri', 14)) name = 'ערב סוכות';
    else if (is('Tishri', 15)) { name = 'סוכות'; yomTov = true; }
    else if (k === 'Tishri' && n >= 16 && n <= 20) name = 'חול המועד סוכות';
    else if (is('Tishri', 21)) name = 'הושענא רבה';
    else if (is('Tishri', 22)) { name = 'שמיני עצרת – שמחת תורה'; yomTov = true; }
    else if (is('Shevat', 15)) name = 'ט״ו בשבט';
    else if ((k === 'Adar' || k === 'Adar II') && n === 14) name = 'פורים';
    else if ((k === 'Adar' || k === 'Adar II') && n === 15) name = 'שושן פורים';
    else if (is('Nisan', 14)) name = 'ערב פסח';
    else if (is('Nisan', 15)) { name = 'פסח'; yomTov = true; }
    else if (k === 'Nisan' && n >= 16 && n <= 20) name = 'חול המועד פסח';
    else if (is('Nisan', 21)) { name = 'שביעי של פסח'; yomTov = true; }
    else if (is('Iyar', 18)) name = 'ל״ג בעומר – הילולת רשב״י';
    else if (is('Sivan', 5)) name = 'ערב שבועות';
    else if (is('Sivan', 6)) { name = 'שבועות'; yomTov = true; }

    // חנוכה: 8 ימים מכ״ה כסלו
    if (!name) {
      for (let i = 0; i < 8; i++) {
        const p = hebDate(...shiftDate(y, m, d, -i));
        if (p.month === 'Kislev' && p.day === 25) { name = `חנוכה – נר ${gematria(i + 1)}`; break; }
      }
    }
    // ראש חודש
    let roshChodesh = null;
    if (n === 30) roshChodesh = HEB_MONTHS[hebDate(...shiftDate(y, m, d, 1)).month];
    else if (n === 1 && k !== 'Tishri') roshChodesh = HEB_MONTHS[k];

    // ספירת העומר (ביום – הספירה של הלילה הקודם)
    let omer = null;
    for (let i = 0; i < 49; i++) {
      const p = hebDate(...shiftDate(y, m, d, -i));
      if (p.month === 'Nisan' && p.day === 16) { omer = i + 1; break; }
    }
    return { heb: h, weekday, name, yomTov, roshChodesh, omer, shabbat: weekday === 6 };
  }

  const api = { calcZmanim, dayInfo, hebDate, hebDateText, gematria, shiftDate };
  root.Zmanim = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
