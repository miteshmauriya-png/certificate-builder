import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCertificateHtml,
  clampWithinCanvas,
  convertPointerToCanvas,
  normalizeDimensions,
  scaleElementsProportionally,
  escapeHtml,
} from './certificateHtml';
import { CanvasElement } from '../types/certificate';

test('buildCertificateHtml generates standalone HTML with absolute positions and literal tokens', () => {
  const template = {
    canvasWidth: 1000,
    canvasHeight: 700,
    background: {
      attFileUrl: 'https://example.com/cert-bg.png',
      attFileName: 'cert-bg.png',
    },
  };

  const elements: CanvasElement[] = [
    {
      uid: 'el_1',
      type: 'placeholder',
      token: '{{Name}}',
      label: 'Name',
      x: 100,
      y: 150,
      width: 400,
      height: 60,
      fontFamily: 'Playfair Display',
      fontSize: 36,
      bold: true,
      italic: false,
      underline: false,
      textAlign: 'center',
      color: '#0B3D91',
      zIndex: 2,
    },
    {
      uid: 'el_2',
      type: 'placeholder',
      token: '{{Course Name}}',
      label: 'Course Name',
      x: 120,
      y: 250,
      width: 360,
      height: 50,
      fontFamily: 'Montserrat',
      fontSize: 24,
      bold: false,
      italic: true,
      underline: false,
      textAlign: 'center',
      color: '#1E293B',
      zIndex: 1,
    },
  ];

  const html = buildCertificateHtml(template, elements);

  // Assert root wrapper attributes
  assert.ok(html.startsWith('<div style="position:relative;width:1000px;height:700px;'));
  assert.ok(html.includes("background-image:url('https://example.com/cert-bg.png')"));

  // Assert literal tokens are preserved without resolution
  assert.ok(html.includes('{{Name}}'));
  assert.ok(html.includes('{{Course Name}}'));
  assert.ok(html.includes('data-token="{{Name}}"'));
  assert.ok(html.includes('data-token="{{Course Name}}"'));

  // Assert sorted by zIndex (el_2 zIndex:1 comes before el_1 zIndex:2)
  const indexOfEl2 = html.indexOf('{{Course Name}}');
  const indexOfEl1 = html.indexOf('{{Name}}');
  assert.ok(indexOfEl2 < indexOfEl1, 'Lower zIndex element should precede higher zIndex in DOM');

  // Assert CSS properties
  assert.ok(html.includes('font-family:Playfair Display, serif'));
  assert.ok(html.includes('color:#0B3D91'));
  assert.ok(html.includes('font-size:36px'));
  assert.ok(html.includes('font-weight:bold'));
  assert.ok(html.includes('font-style:italic'));
});

test('clampWithinCanvas prevents coordinates from spilling out of bounds', () => {
  const canvasWidth = 1000;
  const canvasHeight = 700;

  // Clamped at negative
  const negative = clampWithinCanvas(-50, -20, 200, 100, canvasWidth, canvasHeight);
  assert.equal(negative.x, 0);
  assert.equal(negative.y, 0);
  assert.equal(negative.width, 200);
  assert.equal(negative.height, 100);

  // Clamped at right/bottom overflow
  const overflow = clampWithinCanvas(900, 650, 200, 100, canvasWidth, canvasHeight);
  assert.equal(overflow.x, 800); // 1000 - 200
  assert.equal(overflow.y, 600); // 700 - 100

  // Within bounds untouched
  const valid = clampWithinCanvas(150, 200, 300, 80, canvasWidth, canvasHeight);
  assert.equal(valid.x, 150);
  assert.equal(valid.y, 200);
});

test('convertPointerToCanvas handles zoom scale accurately', () => {
  const canvasRect = { left: 100, top: 50, width: 800, height: 600 };

  // At 100% zoom
  const at1x = convertPointerToCanvas(250, 150, canvasRect, 1.0);
  assert.equal(at1x.x, 150);
  assert.equal(at1x.y, 100);

  // At 50% zoom (pointer diff is 150px, which corresponds to 300px in natural coords)
  const atHalf = convertPointerToCanvas(250, 150, canvasRect, 0.5);
  assert.equal(atHalf.x, 300);
  assert.equal(atHalf.y, 200);
});

test('normalizeDimensions caps width at 2480px and scales height proportionally', () => {
  // Normal image below cap
  const normal = normalizeDimensions(1920, 1080);
  assert.equal(normal.width, 1920);
  assert.equal(normal.height, 1080);

  // Large image above cap
  const large = normalizeDimensions(4960, 3508);
  assert.equal(large.width, 2480);
  assert.equal(large.height, 1754);
});

test('scaleElementsProportionally scales positions and fonts proportionally', () => {
  const elements: CanvasElement[] = [
    {
      uid: 'e1',
      type: 'placeholder',
      token: '{{Name}}',
      x: 100,
      y: 200,
      width: 200,
      height: 50,
      fontFamily: 'Montserrat',
      fontSize: 20,
      bold: false,
      italic: false,
      underline: false,
      textAlign: 'center',
      color: '#000000',
      zIndex: 1,
    },
  ];

  const scaled = scaleElementsProportionally(elements, 1000, 500, 2000, 1000);
  assert.equal(scaled[0].x, 200);
  assert.equal(scaled[0].y, 400);
  assert.equal(scaled[0].width, 400);
  assert.equal(scaled[0].height, 100);
  assert.equal(scaled[0].fontSize, 40);
});

test('escapeHtml safely escapes special characters', () => {
  assert.equal(escapeHtml('<script>alert("test&")</script>'), '&lt;script&gt;alert(&quot;test&amp;&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
});
