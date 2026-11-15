/* CONLER Studio — client-side Brief PDF (jsPDF + embedded DM Sans).
   Visual system follows /workspace/docs/templates (white A4, light display title,
   sender block top-right, client + DATA, hairline tables). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ConlerBriefPdf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SENDER = {
    name: 'CONLER STUDIO',
    email: 'conlerstudio@gmail.com',
    phones: '+31 6 234 59248 | +39 350 18 18 209',
  };

  var PAGE_W = 595.28;
  var PAGE_H = 841.89;
  var M_LEFT = 19;
  var M_RIGHT = 20;
  var TEXT_X = 28.4;
  var RULE_W = 556;
  var MUTED = '#636363';
  var INK = '#000000';
  var RULE = '#E4E4E4';
  var FOOTER_Y = 818;
  var CONTENT_BOTTOM = 792;

  function u8ToBase64(u8) {
    if (typeof Buffer !== 'undefined') return Buffer.from(u8).toString('base64');
    var CHUNK = 0x8000;
    var s = '';
    for (var i = 0; i < u8.length; i += CHUNK) {
      s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return btoa(s);
  }

  function asU8(src) {
    if (!src) return null;
    if (src instanceof Uint8Array) return src;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(src)) return new Uint8Array(src);
    if (src instanceof ArrayBuffer) return new Uint8Array(src);
    return null;
  }

  function registerFonts(doc, fonts) {
    var map = [
      ['light', 'DMSans-Light.ttf', 'DMSansLight', 'normal'],
      ['regular', 'DMSans-Regular.ttf', 'DMSans', 'normal'],
      ['medium', 'DMSans-Medium.ttf', 'DMSansMedium', 'normal'],
      ['bold', 'DMSans-Bold.ttf', 'DMSans', 'bold'],
    ];
    map.forEach(function (item) {
      var bytes = asU8(fonts[item[0]]);
      if (!bytes) throw new Error('Missing DM Sans font: ' + item[0]);
      doc.addFileToVFS(item[1], u8ToBase64(bytes));
      doc.addFont(item[1], item[2], item[3], 'Identity-H');
    });
  }

  function textW(doc, str, size, font, style) {
    doc.setFont(font, style);
    doc.setFontSize(size);
    return doc.getTextWidth(String(str || ''));
  }

  function slugName(name) {
    var parts = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
    return parts.join('') || 'Richiesta';
  }

  function fileName(data) {
    var name = data && data.client && data.client.name;
    return 'Brief_' + slugName(name) + '_CONLER.pdf';
  }

  function defaultNote(date) {
    return 'Documento generato il ' + date + ' dalla richiesta di consulenza CONLER. Non costituisce un preventivo.';
  }

  function draw(doc, data) {
    var pageCount = 0;
    var y = 0;

    function font(name, style, size, color) {
      doc.setFont(name, style || 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color || INK);
    }

    function rule(atY) {
      doc.setFillColor(228, 228, 228);
      doc.rect(M_LEFT, atY, RULE_W, 1, 'F');
    }

    function drawSender(topBaseline) {
      var xR = PAGE_W - M_RIGHT;
      font('DMSans', 'bold', 14, INK);
      doc.text(SENDER.name, xR, topBaseline, { align: 'right' });
      font('DMSans', 'normal', 12, INK);
      doc.text(SENDER.email, xR, topBaseline + 24, { align: 'right' });
      doc.text(SENDER.phones, xR, topBaseline + 40, { align: 'right' });
    }

    function drawCoverHead() {
      drawSender(110);
      font('DMSansLight', 'normal', 108, INK);
      doc.text(data.title || 'Brief', 20, 285);
      var client = data.client || {};
      var name = client.name || '—';
      font('DMSans', 'bold', 14, INK);
      var nameSize = 14;
      while (nameSize > 9 && textW(doc, name, nameSize, 'DMSans', 'bold') > 360) {
        nameSize -= 0.25;
        doc.setFontSize(nameSize);
      }
      doc.text(name, 19.8, 353);
      var cy = 353 + 20;
      font('DMSans', 'normal', 12, MUTED);
      (client.lines || []).forEach(function (line) {
        var wrapped = doc.splitTextToSize(String(line), 360);
        wrapped.forEach(function (row) {
          doc.text(row, 19.8, cy);
          cy += 16;
        });
      });
      font('DMSans', 'normal', 12, MUTED);
      doc.text('DATA:', 395, 353);
      doc.text(data.date || '', PAGE_W - M_RIGHT, 353, { align: 'right' });
      y = Math.max(cy, 353) + 36;
    }

    function drawContHead() {
      font('DMSansMedium', 'normal', 15, INK);
      doc.text(data.title || 'Brief', 20, 37 + 12);
      doc.setFillColor(0, 0, 0);
      doc.rect(20, 62.8, 547, 0.4, 'F');
      y = 89;
    }

    function addPage(first) {
      if (!first) doc.addPage();
      pageCount += 1;
      if (first) drawCoverHead();
      else drawContHead();
    }

    function ensure(h) {
      if (y + h > CONTENT_BOTTOM) {
        addPage(false);
      }
    }

    function measureRow(label, value) {
      var labelMax = 170;
      var valueX = TEXT_X + labelMax + 12;
      var valueMax = (M_LEFT + RULE_W) - 8 - valueX;
      font('DMSans', 'normal', 10.16, MUTED);
      var labelLines = doc.splitTextToSize(String(label || ''), labelMax);
      font('DMSans', 'normal', 10.16, INK);
      var valueLines = doc.splitTextToSize(String(value || '—'), valueMax);
      return Math.max(labelLines.length, valueLines.length) * 13 + 12;
    }
    function measureBlock(title, body) {
      font('DMSans', 'bold', 10.16, INK);
      var titleLines = doc.splitTextToSize(String(title || ''), RULE_W - (TEXT_X - M_LEFT) - 8);
      font('DMSans', 'normal', 10.16, INK);
      var bodyLines = body ? doc.splitTextToSize(String(body), RULE_W - (TEXT_X - M_LEFT) - 8) : [];
      return titleLines.length * 13 + bodyLines.length * 13 + 16 + 14;
    }
    function sectionHeader(title, firstH) {
      ensure(28 + (firstH || 36));
      font('DMSans', 'bold', 10.16, INK);
      doc.text(title, TEXT_X, y);
      y += 10;
      rule(y);
      y += 16;
    }

    function drawRow(label, value) {
      var labelText = String(label || '');
      var valueText = String(value || '—');
      var colGap = 12;
      var labelMax = 170;
      var valueX = TEXT_X + labelMax + colGap;
      var valueMax = (M_LEFT + RULE_W) - 8 - valueX;
      font('DMSans', 'normal', 10.16, MUTED);
      var labelLines = doc.splitTextToSize(labelText, labelMax);
      font('DMSans', 'normal', 10.16, INK);
      var valueLines = doc.splitTextToSize(valueText, valueMax);
      var linesN = Math.max(labelLines.length, valueLines.length);
      var h = linesN * 13 + 12;
      ensure(h);
      font('DMSans', 'normal', 10.16, MUTED);
      labelLines.forEach(function (row, i) { doc.text(row, TEXT_X, y + i * 13); });
      font('DMSans', 'normal', 10.16, INK);
      valueLines.forEach(function (row, i) { doc.text(row, valueX, y + i * 13); });
      y += linesN * 13 + 6;
      rule(y);
      y += 12;
    }

    function drawBlock(title, body) {
      var titleSize = 10.16;
      var bodySize = 10.16;
      font('DMSans', 'bold', titleSize, INK);
      var titleLines = doc.splitTextToSize(String(title || ''), RULE_W - (TEXT_X - M_LEFT) - 8);
      font('DMSans', 'normal', bodySize, INK);
      var bodyLines = body ? doc.splitTextToSize(String(body), RULE_W - (TEXT_X - M_LEFT) - 8) : [];
      var h = titleLines.length * 13 + bodyLines.length * 13 + 16;
      ensure(h);
      font('DMSans', 'bold', titleSize, INK);
      titleLines.forEach(function (row) {
        doc.text(row, TEXT_X, y);
        y += 13;
      });
      if (bodyLines.length) {
        y += 2;
        font('DMSans', 'normal', bodySize, INK);
        bodyLines.forEach(function (row) {
          doc.text(row, TEXT_X, y);
          y += 13;
        });
      }
      y += 8;
      rule(y);
      y += 14;
    }

    addPage(true);

    (data.sections || []).forEach(function (sec) {
      if (!sec || !sec.title) return;
      var rows = (sec.rows || []).filter(function (r) { return r && (r.value || r.value === 0); });
      var ideas = (sec.ideas || []).filter(function (i) { return i && (i.title || i.body); });
      var services = (sec.services || []).filter(function (s) { return s && s.name; });
      if (!rows.length && !ideas.length && !services.length) return;
      var firstH = 40;
      if (rows.length) firstH = measureRow(rows[0].label, rows[0].value);
      else if (ideas.length) {
        var idea0 = ideas[0];
        var head0 = ((idea0.num ? idea0.num + '  ' : '') + (idea0.title || 'Senza titolo')).replace(/^\s+/, '');
        firstH = measureBlock(head0, idea0.body || '');
      } else if (services.length) {
        var svc0 = services[0];
        var details0 = (svc0.details || []).filter(Boolean);
        var body0 = details0.length ? details0.join('\n') : 'Da definire insieme';
        firstH = measureBlock(svc0.name + (svc0.kind ? '  ·  ' + svc0.kind : ''), body0);
      }
      sectionHeader(sec.title, firstH);
      rows.forEach(function (r) { drawRow(r.label, r.value); });
      ideas.forEach(function (idea) {
        var num = idea.num ? idea.num + '  ' : '';
        var head = (num + (idea.title || 'Senza titolo')).replace(/^\s+/, '');
        drawBlock(head, idea.body || '');
      });
      services.forEach(function (svc) {
        var details = (svc.details || []).filter(Boolean);
        var body = details.length ? details.join('\n') : 'Da definire insieme';
        var kind = svc.kind ? '  ·  ' + svc.kind : '';
        drawBlock(svc.name + kind, body);
      });
    });

    var note = data.note || defaultNote(data.date || '');
    var total = doc.getNumberOfPages();
    for (var p = 1; p <= total; p++) {
      doc.setPage(p);
      font('DMSans', 'normal', 8, MUTED);
      var noteLines = doc.splitTextToSize(note, 420);
      var noteY = FOOTER_Y - (noteLines.length - 1) * 10;
      noteLines.forEach(function (row, i) {
        doc.text(row, M_LEFT, noteY + i * 10);
      });
      var pn = p + '/' + total;
      font('DMSans', 'normal', 8, MUTED);
      var pnW = doc.getTextWidth(pn);
      doc.text(pn, PAGE_W - M_RIGHT, FOOTER_Y, { align: 'right' });
      doc.text('CONLER STUDIO', PAGE_W - M_RIGHT - pnW - 12, FOOTER_Y, { align: 'right' });
    }

    return doc;
  }

  function getJsPDF(passed) {
    if (passed) return passed;
    var ns = (typeof window !== 'undefined' && window.jspdf) || (typeof globalThis !== 'undefined' && globalThis.jspdf);
    if (ns && ns.jsPDF) return ns.jsPDF;
    try {
      return require('jspdf').jsPDF;
    } catch (e) {
      throw new Error('jsPDF is not loaded');
    }
  }

  function buildPdf(data, options) {
    options = options || {};
    var JsPDF = getJsPDF(options.jsPDF);
    var doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
    registerFonts(doc, options.fonts || {});
    draw(doc, data || {});
    return doc;
  }

  function download(data, options) {
    var doc = buildPdf(data, options);
    var name = fileName(data);
    if (typeof doc.save === 'function' && typeof window !== 'undefined') doc.save(name);
    return { doc: doc, fileName: name };
  }

  return {
    SENDER: SENDER,
    slugName: slugName,
    fileName: fileName,
    defaultNote: defaultNote,
    buildPdf: buildPdf,
    download: download,
  };
});
