import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('bookmarked Digital topics open directly in slide and continuous reading modes', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom',
    plugins: [(await import('@vitejs/plugin-react')).default()] });
  try {
    const { default: DigitalLessonView } = await server.ssrLoadModule('/src/views/DigitalLessonView.jsx');
    const render = path => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(DigitalLessonView)));
    for (const topic of ['4', '12', '18']) {
      const slide = render(`/digital?topic=${topic}`);
      assert.ok(slide.includes('lesson-nav-pages'));
      assert.ok(slide.includes('lesson-slideshow'));
      const reading = render(`/digital?topic=${topic}&view=read`);
      assert.ok(reading.includes('digital-reading-page'));
      assert.ok(!reading.includes('lesson-slideshow-stage'));
      if (topic === '4') {
        assert.ok(reading.includes('digital-quick-check'));
        assert.ok(reading.includes('digital-circuits'));
      }
    }
    assert.ok(render('/digital?topic=missing').includes('จำลองสถานการณ์ Digital'));
  } finally { await server.close(); }
});
