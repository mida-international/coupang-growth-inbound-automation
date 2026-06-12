export function getKstTodayDate(): Date {
  const kstDateString = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });

  return new Date(`${kstDateString}T00:00:00.000Z`);
}
