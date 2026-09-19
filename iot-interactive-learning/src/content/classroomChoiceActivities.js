import { chapterTwoActivities } from './chapterTwo.js';

export const classroomChoiceActivities = {
  ...chapterTwoActivities,
  roles: {
    title: 'ใครเป็นผู้ตัดสินใจในระบบ IoT?',
    question: 'เมื่อเซ็นเซอร์ส่งค่าเข้ามา อุปกรณ์ใดอ่านค่า ตรวจเงื่อนไข และสั่ง Output?',
    durationSeconds: 30,
    correctId: 'controller',
    options: [
      { id: 'sensor', icon: '👁️', label: 'Sensor', detail: 'รับข้อมูลจากสิ่งแวดล้อม' },
      { id: 'controller', icon: '🧠', label: 'Controller เช่น ESP32', detail: 'ประมวลผลและตัดสินใจตามโปรแกรม' },
      { id: 'output', icon: '⚙️', label: 'Output', detail: 'ทำให้เกิดแสง เสียง การเคลื่อนไหว หรือการแสดงผล' },
      { id: 'network', icon: '📶', label: 'Network', detail: 'ส่งข้อมูลระหว่างอุปกรณ์และบริการ' },
    ],
    explanation: 'Controller เป็นส่วนที่อ่านข้อมูลจาก Sensor แล้วตรวจเงื่อนไขในโปรแกรม ก่อนส่งคำสั่งให้ Output ทำงาน ส่วน Network ช่วยส่งข้อมูลแต่ไม่ได้ตัดสินใจแทนโปรแกรมบนบอร์ด',
    objective: 'แยกหน้าที่ของ Sensor, Controller, Output และ Network ได้ พร้อมอธิบายลำดับรับข้อมูล → ตัดสินใจ → สร้างผลลัพธ์',
    flow: ['Soil Moisture วัดค่าดิน', 'ESP32 ตรวจเงื่อนไข', 'ปั๊มน้ำทำงาน'],
  },
  wrapup: {
    title: 'ต่อเส้นทางระบบรดน้ำให้ถูกต้อง',
    question: 'ข้อใดเรียงลำดับการทำงานของระบบรดน้ำอัตโนมัติได้ครบและสมเหตุผลที่สุด?',
    durationSeconds: 30,
    correctId: 'complete_flow',
    options: [
      { id: 'complete_flow', icon: '🌱', label: 'Soil Sensor → ESP32 ตรวจเงื่อนไข → ปั๊มน้ำ → ส่งสถานะไปแอป', detail: 'วัด ตัดสินใจ สั่งงาน และสื่อสารครบ' },
      { id: 'pump_first', icon: '💧', label: 'ปั๊มน้ำ → Soil Sensor → ESP32', detail: 'เริ่มทำงานก่อนมีข้อมูลและการตัดสินใจ' },
      { id: 'app_controls_sensor', icon: '📱', label: 'แอป → สั่ง Sensor ให้ทำให้ดินชื้น', detail: 'Sensor มีหน้าที่วัด ไม่ได้รดน้ำ' },
      { id: 'sensor_to_pump', icon: '🔌', label: 'Soil Sensor → ปั๊มน้ำโดยตรง', detail: 'ขาด Controller ที่ตรวจเงื่อนไขและสั่งงาน' },
    ],
    explanation: 'ระบบที่ครบเริ่มจาก Sensor วัดดิน ส่งค่าให้ ESP32 ตีความและตรวจเงื่อนไข จากนั้นจึงสั่งวงจรปั๊มน้ำ และอาจส่งข้อมูลหรือสถานะให้ผู้ใช้ดูผ่านแอป',
    objective: 'อธิบายเส้นทางข้อมูลและคำสั่งในระบบ IoT ตั้งแต่ Sensor จนถึง Output และแอปได้',
    flow: ['รับข้อมูล', 'ตัดสินใจ', 'สร้างผลลัพธ์', 'แจ้งผู้ใช้'],
  },
  ideation: {
    title: 'เลือกแผนออกแบบ IoT ที่พร้อมทดลอง',
    question: 'ข้อใดเป็นแนวคิดระบบ IoT ที่ระบุปัญหา ข้อมูล เงื่อนไข และผลลัพธ์ชัดเจนที่สุด?',
    durationSeconds: 30,
    correctId: 'classroom_plan',
    options: [
      { id: 'classroom_plan', icon: '🌡️', label: 'ห้องร้อน → DHT11 วัดอุณหภูมิ → ถ้าเกิน 30°C ให้ ESP32 เปิดพัดลม', detail: 'ปัญหา สิ่งที่วัด เกณฑ์ และ Output ชัดเจน' },
      { id: 'many_sensors', icon: '🧰', label: 'ติดเซ็นเซอร์หลายชนิดให้มากที่สุด', detail: 'ยังไม่ระบุปัญหาและผลที่ต้องการ' },
      { id: 'smart_app', icon: '📱', label: 'สร้างแอปอัจฉริยะที่ทำงานได้ทุกอย่าง', detail: 'ยังไม่ระบุข้อมูล เงื่อนไข และอุปกรณ์' },
      { id: 'motor_only', icon: '⚙️', label: 'เปิดมอเตอร์ตลอดเวลา', detail: 'ไม่มี Sensor หรือเงื่อนไขจากข้อมูล' },
    ],
    explanation: 'แผนที่พร้อมทดลองต้องบอกว่าแก้ปัญหาอะไร วัดอะไรด้วย Sensor ใด ใช้เงื่อนไขแบบใด และสั่ง Output อะไร จึงสามารถทดสอบผลที่คาดหวังได้',
    objective: 'เลือกและอธิบายแผนระบบ IoT ที่เชื่อมปัญหา Sensor เงื่อนไข และ Output ได้ครบ',
    flow: ['ระบุปัญหา', 'เลือกข้อมูลและ Sensor', 'กำหนดเงื่อนไข', 'เลือก Output'],
  },
};

export const isClassroomChoice = (activityId, optionId) =>
  Boolean(classroomChoiceActivities[activityId]?.options.some(({ id }) => id === optionId));

