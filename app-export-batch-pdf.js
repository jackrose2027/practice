/** Offline, sequential per-key diagram archives for the main Neck Diagram Explorer. */
if (typeof Exporter !== 'undefined') {
    Exporter.createDiagramBatchZip = async function(app, selection, format, customSettings) {
        if (!selection || !format) throw new Error('Choose a batch set and output format.');
        if (typeof JSZip === 'undefined') throw new Error('The bundled ZIP library is unavailable.');
        if (typeof Fretboard === 'undefined') throw new Error('The fretboard renderer is unavailable.');
        if (!['pdf', 'jpg', 'png'].includes(format)) throw new Error('Unsupported output format.');
        if (format === 'pdf' && !Exporter.getJsPDF) throw new Error('The bundled PDF library is unavailable.');

        const type = selection.endsWith('interval') ? 'interval' : selection.endsWith('chord') ? 'chord' : 'scale';
        const requiredSet = selection.startsWith('gauntlet-') ? 'gauntlet' : selection.startsWith('all-keys-') ? 'all-keys' : null;
        const activeSet = document.getElementById('diagram-count')?.value || '1';
        if (requiredSet && activeSet !== requiredSet) {
            throw new Error('Choose Instrument > Diagram set > ' + (requiredSet === 'gauntlet' ? 'Gauntlet' : 'All Keys (17 diagrams, sharps & flats)') + ' first.');
        }
        if (typeof app.updateFretboard === 'function') app.updateFretboard();

        const mt = app.musicTheory;
        const source = type === 'interval' ? mt.intervals : type === 'chord' ? mt.chords : mt.scales;
        let patternIds = Object.keys(source || {});
        if (type === 'interval') patternIds = patternIds.filter(id => id !== '1').sort((a, b) => source[a].semitones - source[b].semitones);
        if (!patternIds.length) throw new Error('No ' + type + ' patterns are available.');

        const allKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'C#', 'Db', 'G#', 'Ab', 'D#', 'Eb', 'A#', 'Bb', 'F'];
        const keys = activeSet === 'all-keys' ? allKeys : (mt.notes || ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']).slice();
        const boards = app.diagramBoards?.length ? app.diagramBoards : [app.fretboard];
        const diagrams = boards.map((board, index) => {
            const settings = JSON.parse(JSON.stringify(board.settings || {}));
            const tuning = settings.tuning || ['E', 'A', 'D', 'G', 'B', 'E'];
            if (customSettings && customSettings.tuning.length < tuning.length) {
                throw new Error('Custom tuning needs at least ' + tuning.length + ' notes for this diagram set.');
            }
            settings.tuning = customSettings ? customSettings.tuning.slice(0, tuning.length) : tuning;
            settings.startFret = customSettings?.startFret ?? 0;
            settings.endFret = customSettings?.endFret ?? 24;
            settings.stringStartFrets = Array(settings.tuning.length).fill(settings.startFret);
            settings.stringEndFrets = Array(settings.tuning.length).fill(settings.endFret);
            return { settings, width: Math.max(1000, board.container?.clientWidth || 0), tuning: settings.tuning, index };
        });
        if (activeSet === 'all-keys' && diagrams.length !== allKeys.length) throw new Error('The All Keys set must contain 17 diagrams. Reselect it and try again.');
        const progress = document.getElementById('new-ui-batch-export-status');
        const runButton = document.getElementById('new-ui-batch-export-run');
        const stopButton = document.getElementById('new-ui-batch-export-stop');
        const oldTitles = Exporter.includeTitles;
        let renderer, completed = 0, pageCount = 0;
        app.stopExporting = false;
        Exporter.includeTitles = false;
        stopButton.hidden = false;
        stopButton.disabled = false;
        runButton.disabled = true;

        const container = document.createElement('div');
        container.id = 'new-ui-batch-export-render';
        container.setAttribute('aria-hidden', 'true');
        container.style.cssText = 'position:fixed;left:-100000px;top:0;width:1200px;pointer-events:none;';
        document.body.appendChild(container);
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const archive = new JSZip();
        const safe = value => Exporter.safe(String(value || 'item'));
        const yieldUi = () => new Promise(resolve => setTimeout(resolve, 0));
        const visibleStringRange = settings => {
            const shown = (settings.visibleStrings || settings.tuning.map(() => true))
                .map((visible, index) => visible === false ? null : index + 1).filter(Boolean);
            return shown.length ? shown.join('-') : 'none';
        };
        const addPdfTile = async (doc, image, title, state, mime = 'image/jpeg') => {
            const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
            const margin = 24, columns = 2, rows = 3;
            const slot = state.tiles % (columns * rows);
            if (slot === 0 && state.tiles > 0) doc.addPage();
            const col = slot % columns, row = Math.floor(slot / columns);
            const cellW = (W - margin * 2) / columns, cellH = (H - margin * 2) / rows;
            const titleY = margin + row * cellH + 14;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20);
            doc.text(title, margin + col * cellW + cellW / 2, titleY, { align: 'center', maxWidth: cellW - 16 });
            const dataUrl = 'data:' + mime + ';base64,' + image;
            const dims = await new Promise(resolve => {
                const imageElement = new Image();
                imageElement.onload = () => resolve({ width: imageElement.width, height: imageElement.height });
                imageElement.onerror = () => resolve({ width: 1000, height: 250 });
                imageElement.src = dataUrl;
            });
            const maxW = cellW - 18, maxH = cellH - 34;
            const scale = Math.min(maxW / dims.width, maxH / dims.height);
            const width = dims.width * scale, height = dims.height * scale;
            doc.addImage(dataUrl, mime === 'image/png' ? 'PNG' : 'JPEG', margin + col * cellW + (cellW - width) / 2, titleY + 8, width, height, undefined, 'FAST');
            state.tiles++;
        };

        try {
            renderer = new Fretboard(container.id, mt);
            window.removeEventListener('resize', renderer.queueResponsiveDraw);
            renderer.resizeObserver?.disconnect();
            const context = { fretboard: renderer, musicTheory: mt, instrumentName: '' };
            for (let keyIndex = 0; keyIndex < keys.length && !app.stopExporting; keyIndex++) {
                const key = keys[keyIndex];
                progress.textContent = 'Key ' + (keyIndex + 1) + '/' + keys.length + ': ' + key + ' - preparing ' + label.toLowerCase() + 's';
                await yieldUi();
                let pdf = format === 'pdf' ? Exporter.newPdf() : null;
                const pdfState = { tiles: 0 };
                let keyItems = 0;
                const keyDiagrams = activeSet === 'all-keys' ? [diagrams[keyIndex]] : diagrams;
                for (let patternIndex = 0; patternIndex < patternIds.length && !app.stopExporting; patternIndex++) {
                    const patternId = patternIds[patternIndex];
                    const patternName = Exporter.patternName(app, type, patternId);
                    for (const diagram of keyDiagrams) {
                        if (app.stopExporting) break;
                        container.style.width = diagram.width + 'px';
                        renderer.updateSettings(diagram.settings);
                        renderer.updatePattern(key, type, patternId);
                        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
                        const image = await Exporter.getFretboardImageBase64(context, {
                            mime, scale: format === 'png' ? 2 : 1, quality: 0.92, includeInfo: false, decorate: false
                        });
                        const title = key + ' - ' + patternName + (type === 'interval' ? '' : ' ' + label);
                        if (format === 'pdf') {
                            await addPdfTile(pdf, image, title, pdfState);
                        } else {
                            const settings = diagram.settings;
                            const stem = [String(diagram.index + 1).padStart(2, '0'), safe(key), safe(type), safe(patternName), 'frets-' + settings.startFret + '-' + settings.endFret, 'strings-' + visibleStringRange(settings), 'tuning-' + settings.tuning.map(safe).join('-')].join('_');
                            archive.folder(format.toUpperCase() + '/' + safe(key)).file(stem + '.' + format, image, { base64: true });
                        }
                        keyItems++;
                        completed++;
                    }
                    if (completed % 4 === 0) {
                        progress.textContent = 'Key ' + (keyIndex + 1) + '/' + keys.length + ': ' + key + ' - ' + (patternIndex + 1) + '/' + patternIds.length + ' ' + label.toLowerCase() + ' patterns (' + completed + ' diagrams)';
                        await yieldUi();
                    }
                }
                if (format === 'pdf' && keyItems) {
                    archive.folder('PDF').file(String(keyIndex + 1).padStart(2, '0') + '_' + safe(key) + '_' + type + 's.pdf', pdf.output('arraybuffer'));
                }
                pageCount += format === 'pdf' ? Math.ceil(pdfState.tiles / 6) : 0;
                progress.textContent = (app.stopExporting ? 'Stopped after ' : 'Finished ') + 'key ' + key + ' (' + keyItems + ' diagrams). ' + completed + ' total; ' + (app.stopExporting ? 'packaging completed batches...' : 'moving to the next key...');
                await yieldUi();
            }
            if (completed) {
                progress.textContent = 'Packaging ' + completed + ' diagrams into ZIP...';
                const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' }, meta => {
                    progress.textContent = 'Building ZIP: ' + Math.round(meta.percent) + '%';
                });
                const filename = 'neck-diagrams_' + type + 's_' + format + (app.stopExporting ? '_partial' : '') + '.zip';
                if (window.ST?.download) window.ST.download(blob, filename);
                else {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a'); link.href = url; link.download = filename;
                    document.body.appendChild(link); link.click(); link.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
                progress.textContent = (app.stopExporting ? 'Stopped. ' : 'Complete. ') + completed + ' diagrams in ' + filename + (format === 'pdf' ? ' (' + pageCount + ' pages).' : '.');
            } else {
                progress.textContent = 'Export cancelled before a key batch was completed.';
            }
        } finally {
            if (renderer) {
                clearTimeout(renderer.resizeTimeout); clearTimeout(renderer.redrawTimeout);
                renderer.resizeObserver?.disconnect(); window.removeEventListener('resize', renderer.queueResponsiveDraw);
            }
            container.remove();
            if (oldTitles === undefined) delete Exporter.includeTitles;
            else Exporter.includeTitles = oldTitles;
            stopButton.hidden = true; stopButton.disabled = false; stopButton.textContent = 'Stop'; runButton.disabled = false;
        }
    };

    Exporter.createKeyOrderedDocxZip = async function(app, type, imageFormat, customSettings) {
        if (!['interval', 'chord', 'scale'].includes(type)) throw new Error('Unsupported diagram category.');
        if (!['jpg', 'png'].includes(imageFormat)) throw new Error('Choose JPG or PNG for the DOCX diagrams.');
        if (typeof JSZip === 'undefined' || typeof docx === 'undefined') throw new Error('The bundled ZIP or Word library is unavailable.');
        if (!Exporter.getJsPDF || typeof Fretboard === 'undefined') throw new Error('The bundled PDF or fretboard renderer is unavailable.');

        const mt = app.musicTheory;
        const source = type === 'interval' ? mt.intervals : type === 'chord' ? mt.chords : mt.scales;
        let patternIds = Object.keys(source || {});
        if (type === 'interval') patternIds = patternIds.filter(id => id !== '1').sort((a, b) => source[a].semitones - source[b].semitones);
        if (!patternIds.length) throw new Error('No ' + type + ' patterns are available.');
        const keys = (mt.notes || ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']).slice();
        if (typeof app.updateFretboard === 'function') app.updateFretboard();
        const sourceBoard = app.diagramBoards?.[app.activeDiagram] || app.fretboard;
        const settings = JSON.parse(JSON.stringify(sourceBoard.settings || {}));
        const tuning = settings.tuning || ['E', 'A', 'D', 'G', 'B', 'E'];
        if (customSettings && customSettings.tuning.length !== tuning.length) {
            throw new Error('Custom tuning must have ' + tuning.length + ' notes to match the selected diagram.');
        }
        settings.tuning = customSettings ? customSettings.tuning.slice() : tuning;
        settings.startFret = customSettings?.startFret ?? 0;
        settings.endFret = customSettings?.endFret ?? 24;
        settings.stringStartFrets = Array(settings.tuning.length).fill(settings.startFret);
        settings.stringEndFrets = Array(settings.tuning.length).fill(settings.endFret);
        const width = Math.max(1000, sourceBoard.container?.clientWidth || 0);
        const { Document, Packer, Paragraph, TextRun, ImageRun, InternalHyperlink, BookmarkStart, BookmarkEnd, AlignmentType } = docx;
        const progress = document.getElementById('new-ui-batch-export-status');
        const runButton = document.getElementById('new-ui-batch-export-run');
        const stopButton = document.getElementById('new-ui-batch-export-stop');
        const oldTitles = Exporter.includeTitles;
        const archive = new JSZip();
        const entries = [];
        const pdf = Exporter.newPdf();
        const pdfState = { tiles: 0 };
        const mime = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
        const safe = value => Exporter.safe(String(value || 'item'));
        const yieldUi = () => new Promise(resolve => setTimeout(resolve, 0));
        let renderer, completed = 0, pageCount = 0;
        app.stopExporting = false;
        Exporter.includeTitles = false;
        runButton.disabled = true;
        stopButton.hidden = false;
        stopButton.disabled = false;

        const container = document.createElement('div');
        container.id = 'new-ui-key-docx-render';
        container.setAttribute('aria-hidden', 'true');
        container.style.cssText = 'position:fixed;left:-100000px;top:0;width:' + width + 'px;pointer-events:none;';
        document.body.appendChild(container);

        try {
            renderer = new Fretboard(container.id, mt);
            window.removeEventListener('resize', renderer.queueResponsiveDraw);
            renderer.resizeObserver?.disconnect();
            renderer.updateSettings(settings);
            const context = { fretboard: renderer, musicTheory: mt, instrumentName: '' };
            for (let keyIndex = 0; keyIndex < keys.length && !app.stopExporting; keyIndex++) {
                const key = keys[keyIndex];
                for (let patternIndex = 0; patternIndex < patternIds.length && !app.stopExporting; patternIndex++) {
                    const patternId = patternIds[patternIndex];
                    const patternName = Exporter.patternName(app, type, patternId);
                    const title = patternName + ' - ' + key;
                    progress.textContent = 'Option ' + (type === 'interval' ? 'J' : type === 'chord' ? 'K' : 'L') + ': key ' + (keyIndex + 1) + '/' + keys.length + ' ' + key + ', ' + (patternIndex + 1) + '/' + patternIds.length + ' ' + type + 's';
                    container.style.width = width + 'px';
                    renderer.updatePattern(key, type, patternId);
                    const image = await Exporter.getFretboardImageBase64(context, {
                        mime, scale: 1, quality: 0.92, includeInfo: false, decorate: false
                    });
                    const dimensions = await new Promise(resolve => {
                        const imageElement = new Image();
                        imageElement.onload = () => resolve({ width: imageElement.width, height: imageElement.height });
                        imageElement.onerror = () => resolve({ width: 1000, height: 250 });
                        imageElement.src = 'data:' + mime + ';base64,' + image;
                    });
                    const bytes = Uint8Array.from(atob(image), char => char.charCodeAt(0));
                    const entry = { key, patternId, title, bytes, width: dimensions.width, height: dimensions.height, bookmark: 'diagram-' + (completed + 1), bookmarkId: completed + 1 };
                    entries.push(entry);
                    await addPdfTile(pdf, image, title, pdfState, mime);
                    completed++;
                    await yieldUi();
                }
                progress.textContent = (app.stopExporting ? 'Stopping after ' : 'Finished ') + 'key ' + key + ' (' + completed + ' diagrams); ' + (app.stopExporting ? 'building completed files...' : 'moving to the next key...');
                await yieldUi();
            }

            stopButton.disabled = true;
            if (entries.length) {
                const children = [new Paragraph({ children: [new TextRun({ text: 'Contents', bold: true, size: 28 })], spacing: { after: 120 } })];
                for (const entry of entries) {
                    children.push(new Paragraph({
                        children: [new InternalHyperlink({ anchor: entry.bookmark, children: [new TextRun({ text: entry.title, style: 'Hyperlink' })] })],
                        spacing: { after: 20 }
                    }));
                }
                const maxWidth = 920, maxHeight = 300;
                for (let index = 0; index < entries.length; index++) {
                    const entry = entries[index];
                    const ratio = Math.min(maxWidth / entry.width, maxHeight / entry.height);
                    const imageWidth = Math.round(entry.width * ratio), imageHeight = Math.round(entry.height * ratio);
                    children.push(new Paragraph({
                        children: [new BookmarkStart(entry.bookmark, entry.bookmarkId), new TextRun({ text: entry.title, bold: true, size: 20 }), new BookmarkEnd(entry.bookmarkId)],
                        pageBreakBefore: index === 0, spacing: { before: 60, after: 30 }
                    }));
                    children.push(new Paragraph({
                        children: [new ImageRun({ type: imageFormat, data: entry.bytes, transformation: { width: imageWidth, height: imageHeight } })],
                        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }
                    }));
                    if (index % 16 === 15) {
                        progress.textContent = 'Building DOCX content: ' + (index + 1) + '/' + entries.length;
                        await yieldUi();
                    }
                }
                const word = new Document({ sections: [{
                    properties: { page: { size: { width: 15840, height: 12240 }, margin: { top: 420, bottom: 420, left: 540, right: 540 } } },
                    children
                }] });
                progress.textContent = 'Packaging PDF and DOCX...';
                const wordBlob = await Packer.toBlob(word);
                const name = 'all_' + type + 's_by_key';
                archive.folder('PDF').file(name + '.pdf', pdf.output('arraybuffer'));
                archive.folder('DOCX').file(name + '.docx', wordBlob);
                pageCount = Math.ceil(pdfState.tiles / 6);
                const zipBlob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' }, meta => {
                    progress.textContent = 'Building ZIP: ' + Math.round(meta.percent) + '%';
                });
                const filename = name + (app.stopExporting ? '_partial' : '') + '.zip';
                if (window.ST?.download) window.ST.download(zipBlob, filename);
                else {
                    const url = URL.createObjectURL(zipBlob);
                    const link = document.createElement('a'); link.href = url; link.download = filename;
                    document.body.appendChild(link); link.click(); link.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
                progress.textContent = (app.stopExporting ? 'Stopped. ' : 'Complete. ') + completed + ' key-ordered diagrams in ' + filename + ' (' + pageCount + ' PDF pages, hyperlinked DOCX contents).';
            } else {
                progress.textContent = 'Export cancelled before the first diagram was completed.';
            }
        } finally {
            if (renderer) {
                clearTimeout(renderer.resizeTimeout); clearTimeout(renderer.redrawTimeout);
                renderer.resizeObserver?.disconnect(); window.removeEventListener('resize', renderer.queueResponsiveDraw);
            }
            container.remove();
            if (oldTitles === undefined) delete Exporter.includeTitles;
            else Exporter.includeTitles = oldTitles;
            stopButton.hidden = true; stopButton.disabled = false; stopButton.textContent = 'Stop';
            runButton.disabled = false;
        }
    };
}
