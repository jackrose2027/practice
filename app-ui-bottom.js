/**
 * UI Bottom Controls Extension for App
 */
if (typeof App !== 'undefined') {
    // removed static HTML string template -> moved to app-ui-bottom-controls.js, app-ui-bottom-instrument.js, app-ui-bottom-appearance.js, app-ui-bottom-export.js

    App.prototype.injectBottomControls = function() {
        let controlsHtml = '';

        // Inject Export footer first so export actions appear at the top of the bottom area
        if (typeof this.getExportFooterHtml === 'function') controlsHtml += this.getExportFooterHtml();

        // Then inject primary controls and other bottom sections
        if (typeof this.getBottomControlsHtml === 'function') controlsHtml += this.getBottomControlsHtml();
        if (typeof this.getInstrumentFooterHtml === 'function') controlsHtml += this.getInstrumentFooterHtml();
        if (typeof this.getAppearanceFooterHtml === 'function') controlsHtml += this.getAppearanceFooterHtml();
        controlsHtml += '<footer id="new-ui-footer" class="bottom-footer new-ui-footer" style="display: none;">' +
            '<fieldset class="new-ui-export-card"><legend>Diagram Set Export</legend>' +
            '<p class="new-ui-export-help">Build an offline ZIP one key batch at a time. A-I create PDF, JPG, or PNG sets. J-L include a key-ordered PDF and DOCX. A-J can optionally override fret range and tuning.</p>' +
            '<div class="new-ui-export-controls"><label for="new-ui-batch-export-set">Batch set</label>' +
            '<select id="new-ui-batch-export-set">' +
            '<option value="current-interval">A. Intervals - current diagram set</option><option value="current-chord">B. Chords - current diagram set</option><option value="current-scale">C. Scales - current diagram set</option>' +
            '<option value="gauntlet-interval">D. Intervals - Gauntlet (20 diagrams)</option><option value="gauntlet-chord">E. Chords - Gauntlet (20 diagrams)</option><option value="gauntlet-scale">F. Scales - Gauntlet (20 diagrams)</option>' +
            '<option value="all-keys-interval">G. Intervals - All Keys (17 spellings)</option><option value="all-keys-chord">H. Chords - All Keys (17 spellings)</option><option value="all-keys-scale">I. Scales - All Keys (17 spellings)</option>' +
            '<option value="key-interval">J. Intervals - key-ordered PDF + DOCX</option><option value="key-chord">K. Chords - key-ordered PDF + DOCX</option><option value="key-scale">L. Scales - key-ordered PDF + DOCX</option>' +
            '</select><div id="new-ui-batch-output-format"><label for="new-ui-batch-export-format">Image output</label>' +
            '<select id="new-ui-batch-export-format"><option value="pdf">PDFs in ZIP</option><option value="jpg">JPGs in ZIP</option><option value="png">PNGs in ZIP</option></select></div>' +
            '<div id="new-ui-batch-docx-format" hidden><label for="new-ui-batch-docx-image-format">DOCX diagram format</label>' +
            '<select id="new-ui-batch-docx-image-format"><option value="jpg">JPG images</option><option value="png">PNG images</option></select></div>' +
            '<fieldset id="new-ui-custom-settings" class="new-ui-custom-settings">' +
            '<label class="new-ui-custom-enable"><input id="new-ui-custom-settings-enable" type="checkbox"> Override frets and tuning for A-J</label>' +
            '<div id="new-ui-custom-settings-fields" class="new-ui-custom-settings-fields">' +
            '<label for="new-ui-custom-start-fret">Start fret<input id="new-ui-custom-start-fret" type="number" min="0" max="24" value="0" disabled></label>' +
            '<label for="new-ui-custom-end-fret">End fret<input id="new-ui-custom-end-fret" type="number" min="0" max="24" value="24" disabled></label>' +
            '<label for="new-ui-custom-tuning">Tuning, low to high<input id="new-ui-custom-tuning" type="text" value="E, A, D, G, B, E" placeholder="E, A, D, G, B, E" disabled></label>' +
            '<small>Use comma-separated notes for the longest diagram in the set; shorter diagrams use the first N notes.</small></div></fieldset>' +
            '<button id="new-ui-batch-export-run" type="button">Create ZIP</button> <button id="new-ui-batch-export-stop" type="button" hidden>Stop</button></div>' +
            '<p id="new-ui-batch-export-status" role="status" aria-live="polite">Choose a batch set and format.</p></fieldset></footer>';

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('beforeend', 
                '<section id="fretboard-controls-dock" class="fretboard-controls-dock" aria-label="Fretboard controls" style="display:none;">' +
                    '<div class="fretboard-controls-heading"><div><p>WORKSPACE CONTROLS</p><h2>Shape your view</h2></div><span>Adjust the board, instrument, and output.</span></div>' +
                    '<div class="fretboard-control-tabs" role="tablist" aria-label="Control categories">' +
                        '<button id="fretboard-tab-board" type="button" role="tab" aria-selected="true" aria-controls="controls-bottom" tabindex="0">Board &amp; Playback</button>' +
                        '<button id="fretboard-tab-instrument" type="button" role="tab" aria-selected="false" aria-controls="instrument-footer" tabindex="-1">Instrument</button>' +
                        '<button id="fretboard-tab-appearance" type="button" role="tab" aria-selected="false" aria-controls="appearance-footer" tabindex="-1">Appearance</button>' +
                        '<button id="fretboard-tab-export" type="button" role="tab" aria-selected="false" aria-controls="export-footer" tabindex="-1">Export</button>' +
                        '<button id="fretboard-tab-new-ui" type="button" role="tab" aria-selected="false" aria-controls="new-ui-footer" tabindex="-1">New UI</button>' +
                    '</div>' + controlsHtml +
                '</section>'
            );

            this.organizeBoardControls();

            const panels = [
                ['controls-bottom', 'fretboard-tab-board'],
                ['instrument-footer', 'fretboard-tab-instrument'],
                ['appearance-footer', 'fretboard-tab-appearance'],
                ['export-footer', 'fretboard-tab-export'],
                ['new-ui-footer', 'fretboard-tab-new-ui']
            ].map(([panelId, tabId]) => {
                const panel = document.getElementById(panelId);
                const tab = document.getElementById(tabId);
                if (!panel || !tab) return null;
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('aria-labelledby', tabId);
                panel.setAttribute('tabindex', '0');
                panel.dataset.controlPanel = '';
                return { panel, tab };
            }).filter(Boolean);
            const dock = document.getElementById('fretboard-controls-dock');
            const tabs = panels.map(item => item.tab);
            function activateControlTab(index) {
                panels.forEach((item, i) => {
                    const active = i === index;
                    item.tab.setAttribute('aria-selected', String(active));
                    item.tab.tabIndex = active ? 0 : -1;
                    item.panel.classList.toggle('is-active', active);
                    item.panel.style.display = active && dock.style.display !== 'none' ? '' : 'none';
                });
            }
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => activateControlTab(index));
                tab.addEventListener('keydown', event => {
                    let next = index;
                    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
                    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
                    else if (event.key === 'Home') next = 0;
                    else if (event.key === 'End') next = tabs.length - 1;
                    else return;
                    event.preventDefault();
                    activateControlTab(next);
                    tabs[next].focus();
                });
            });
            activateControlTab(0);
        }
    };
}