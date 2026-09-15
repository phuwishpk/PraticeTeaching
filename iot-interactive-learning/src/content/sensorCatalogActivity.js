export const sensorCatalogQuestions = {
  1: { prompt: 'อุปกรณ์ใดใช้วัดความสว่างของแสง?', correct: 'ldr' },
  2: { prompt: 'อุปกรณ์ใดใช้วัดอุณหภูมิและความชื้นในอากาศ?', correct: 'dht11' },
  3: { prompt: 'เซนเซอร์ใดใช้ตรวจจับการเคลื่อนไหวของสิ่งมีชีวิต?', correct: 'pir' },
  4: { prompt: 'เซนเซอร์ใดใช้ประเมินว่าดินในกระถางแห้งหรือชื้น?', correct: 'soil' },
};

export const sensorCatalogOptions = [
  { id: 'ldr', label: 'LDR (เซนเซอร์แสง)', color: '#ffb86c', icon: '☀️' },
  { id: 'dht11', label: 'DHT11 (อุณหภูมิ/ความชื้น)', color: '#ff79c6', icon: '🌡️' },
  { id: 'pir', label: 'PIR (ตรวจจับความเคลื่อนไหว)', color: '#8be9fd', icon: '🚶' },
  { id: 'soil', label: 'Soil Moisture (ความชื้นดิน)', color: '#50fa7b', icon: '🌱' },
];

export const isSensorCatalogOption = (option) =>
  sensorCatalogOptions.some(({ id }) => id === option);

