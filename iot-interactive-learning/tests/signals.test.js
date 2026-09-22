import test from 'node:test';
import assert from 'node:assert/strict';
import { adcCode, binaryValue } from '../src/content/signalMath.js';

test('ADC keeps nearby analog inputs in one bin and moves at the bin boundary', () => {
  assert.equal(adcCode(12.4, 3), 0);
  assert.equal(adcCode(12.5, 3), 1);
  assert.equal(adcCode(24.9, 3), 1);
  assert.equal(adcCode(25, 3), 2);
});

test('all demonstrated ADC resolutions include zero and saturate at the highest valid code', () => {
  for (const bits of [3, 4, 12]) {
    assert.equal(adcCode(0, bits), 0);
    assert.equal(adcCode(50, bits), 2 ** (bits - 1));
    assert.equal(adcCode(100, bits), 2 ** bits - 1);
    assert.equal(adcCode(101, bits), 2 ** bits - 1);
    assert.equal(adcCode(-1, bits), 0);
  }
});

test('the four-bit graphic represents every number from 0 to 15', () => {
  for (let expected = 0; expected <= 15; expected++) {
    const bits = [8, 4, 2, 1].map(weight => (expected & weight) ? 1 : 0);
    assert.equal(binaryValue(bits), expected);
  }
});

// Check what learners actually receive, including the diagrams embedded in slides.
// These checks complement the ADC math tests; they do not assess visual layout.
test('signal lesson renders consistent values, units, and reading paths', async (t) => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { chapterTwoLessons } = await import('../src/content/chapterTwo.js');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: Graphic } = await server.ssrLoadModule('/src/components/SignalGraphics.jsx');
    const { SectionExplanation, LessonRecap } = await server.ssrLoadModule('/src/components/LessonGraphics.jsx');
    const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
    await t.test('25 degrees agrees with the LM35 voltage, binary code, and chart labels', () => {
      const html = render(Graphic, { type: 'comparison:multibit' });
      assert.match(html, /แรงดันขาสัญญาณ 0\.250 V/);
      assert.match(html, /00011001₂ = 25/);
      assert.match(html, /0, 0, 0, 1, 1, 0, 0, 1/);
      assert.match(html, /min="0" max="50"/);
      assert.match(html, /ไม่ใช่รูปคลื่นหรือแพ็กเก็ตจริงของ DHT11/);
      assert.doesNotMatch(html, /01011001/);
    });
    await t.test('AO owns the voltage threshold and DO reports the equality case as LOW', () => {
      const html = render(Graphic, { type: 'comparison:aodo' });
      const digitalStart = html.indexOf('class="comparison-digital"');
      assert.ok(html.indexOf('class="signal-threshold"') < digitalStart);
      assert.match(html, /แรงดันขาสัญญาณ 1\.650 V/);
      assert.match(html, /LOW \/ 0 · AO น้อยกว่าหรือเท่ากับ 1\.65 V/);
      assert.match(html, /aria-pressed="false"/);
      assert.doesNotMatch(html, /รู้ระดับเป๊ะ|ไฟเข้าบอร์ด|Op-Amp/);
    });
    await t.test('soil reading separates raw code from a reference index and physical water content', () => {
      const html = render(Graphic, { type: 'analog:raw' });
      assert.match(html, /<strong>2048<\/strong>/);
      assert.match(html, /<strong>61%<\/strong><span>ดัชนีเทียบจุดอ้างอิง/);
      assert.match(html, /ไม่ใช่เปอร์เซ็นต์ปริมาณน้ำจริงในดิน/);
      assert.doesNotMatch(html, /ความชื้นดิน \(โดยประมาณ\)/);
      // Verify all ADC codes are reachable using the actual rendered slider precision.
      const step = Number(html.match(/type="range"[^>]*step="([^"]+)"/)[1]);
      const codes = new Set(Array.from({ length: Math.round(100 / step) + 1 }, (_, i) => adcCode(i * step, 12)));
      assert.equal(codes.size, 4096);
    });
    await t.test('both the sensor section and recap show all three reading paths instead of the incorrect image', () => {
      const lesson = chapterTwoLessons[11];
      for (const html of [render(SectionExplanation, { section: lesson.sections[0] }), render(LessonRecap, { lesson })]) {
        assert.equal((html.match(/class="signal-route(?: analog-route)?"/g) || []).length, 3);
        for (const label of ['PIR · ขาสถานะ', 'DHT11 · ขาข้อมูล', 'LDR / เซนเซอร์ดิน · ขา AO']) assert.ok(html.includes(label));
        assert.doesNotMatch(html, /signal_comparison\.jpg/);
      }
    });
    await t.test('every chapter two explanation and recap still renders, including optional material', () => {
      for (const lesson of Object.values(chapterTwoLessons)) {
        for (const section of lesson.sections) assert.ok(render(SectionExplanation, { section }).length > 100);
        assert.ok(render(LessonRecap, { lesson }).includes(lesson.recap.title));
      }
    });
  } finally {
    await server.close();
  }
});
