export const chartData = {
  "s3.c1": {
    type: "bar",
    labels: { bn: ["০.৪", "০.৭৫", "১.০", "১.৫", "২.০"], en: ["0.4", "0.75", "1.0", "1.5", "2.0"] },
    values: [3, 6, 9, 18, 50],
    axisX: { bn: "মিলিগ্রাম / বর্গ সেন্টিমিটার", en: "mg / cm²" },
    axisY: { bn: "কার্যকর SPF", en: "Effective SPF" },
    yMax: 55,
  },
  "s3.c2": {
    type: "bar",
    labels: {
      bn: ["অস্ট্রেলিয়া", "জাপান", "EU", "কোরিয়া", "ভারত"],
      en: ["Australia", "Japan", "EU", "Korea", "India"],
    },
    values: [240, 80, 80, 20, 0],
    axisY: { bn: "মিনিট", en: "Minutes" },
  },
  "s4.uva": {
    type: "line",
    labels: { bn: ["০", "৫", "১০", "১৫", "২০"], en: ["0", "5", "10", "15", "20"] },
    datasets: [
      { labelKey: "s4.leg1s", values: [0, 8, 17, 27, 38] },
      { labelKey: "s4.leg2s", values: [0, 20, 42, 62, 84] },
      { labelKey: "s4.leg3s", values: [0, 38, 72, 92, 100] },
    ],
    axisX: { bn: "বছর", en: "Years" },
    axisY: { bn: "আপেক্ষিক UVA ক্ষতি", en: "Relative UVA Damage" },
    yMax: 105,
  },
  "s4.uvb": {
    type: "line",
    labels: { bn: ["০", "৫", "১০", "১৫", "২০"], en: ["0", "5", "10", "15", "20"] },
    datasets: [
      { labelKey: "s4.leg1s", values: [0, 5, 11, 18, 26] },
      { labelKey: "s4.leg2s", values: [0, 14, 30, 47, 66] },
      { labelKey: "s4.leg3s", values: [0, 28, 55, 78, 100] },
    ],
    axisX: { bn: "বছর", en: "Years" },
    axisY: { bn: "আপেক্ষিক UVB ক্ষতি", en: "Relative UVB Damage" },
    yMax: 105,
  },
};

export default chartData;
