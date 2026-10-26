/**
 * UI Bottom Controls - Instrument Setup Section
 */
if (typeof App !== 'undefined') {
    App.prototype.getInstrumentFooterHtml = function() {
        return `
        <footer id="instrument-footer" class="instrument-setup appearance-bottom-section" style="display: none;">
            <div style="grid-column: 1 / -1; width: 100%;">
                <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; font-size: 1.1em; color: var(--primary-color);">Instrument Setup</h3>
            </div>
            <div class="control-group" id="string-count-group">
                <label for="string-count">Number of Strings:</label>
                <input type="number" id="string-count" min="1" max="20" value="6">
            </div>
            <div id="tuning-container" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 10px; width: 100%;"></div>
        </footer>
        `;
    };

    App.prototype.organizeInstrumentControls = function() {
        const panel = document.getElementById('instrument-footer');
        if (!panel || panel.querySelector('.instrument-control-section')) return;
        const oldTitle = panel.querySelector('h3');
        if (oldTitle) oldTitle.parentElement.remove();
        const sections = [
            ['instrument-diagrams', 'Diagram set', 'Choose a diagram count, or load Gauntlet, Multi-Instrument or All Keys. Loading a set replaces the diagram setups; reselecting it reapplies the preset. Edit diagram selects which board the controls below change. All Keys links Type and Selection only; keys and instruments stay separate.', ['diagram-count', 'diagram-editor']],
            ['instrument-selected', 'Selected diagram: instrument and tuning', 'Instrument and tuning choices apply immediately to the selected diagram, not every board. A tuning preset replaces its open pitches and string/key count. Tune down/up shifts every pitch by one semitone; it does not transpose the selected musical key. Reverse order reverses pitches, note visibility and per-string limits together.', ['instrument-select', 'tuning-preset', 'string-count', 'flip-string-order']],
            ['instrument-range', 'Fret window and range presets', 'First/last fret set the visible neck window. Per-string limits below only restrict note markers inside that window. Built-in string/group presets use six-string numbering and may change the count to 6. Choose a preset, then Apply. Save stores per-string fret limits on this device, not tuning, visibility or the overall window.', ['start-fret', 'end-fret', 'fretspan-presets']],
            ['instrument-strings', 'Selected diagram: individual strings or keys', 'Open pitch sets each string at fret 0. Show notes hides its markers, not the string itself. From/To fret limits note markers on that string; 0 includes the open note. Conventional rows are numbered from string N down to string 1 (standard guitar: low 6 to high 1). Reference maps use their listed order; pitch labels are references, not octave-calibrated playback.', []],
            ['instrument-other-strings', 'Other diagrams: individual strings or keys', 'These rows edit their named diagram directly without switching the selected editor. Key, Type and Selection remain below each fretboard.', []]
        ];
        for (const [id, title, description, controls] of sections) {
            const section = document.createElement('fieldset');
            section.id = id;
            section.className = 'instrument-control-section';
            const legend = document.createElement('legend');
            legend.textContent = title;
            const help = document.createElement('p');
            help.id = id + '-help';
            help.className = 'instrument-control-help';
            help.textContent = description;
            section.setAttribute('aria-describedby', help.id);
            section.append(legend, help);
            controls.forEach(controlId => {
                const control = document.getElementById(controlId);
                const group = control?.closest('.control-group');
                if (group) section.appendChild(group);
            });
            panel.appendChild(section);
        }
        const selected = document.getElementById('instrument-selected');
        const status = document.createElement('p');
        status.id = 'instrument-editor-summary';
        status.className = 'instrument-editor-summary';
        status.setAttribute('role', 'status');
        selected.insertBefore(status, selected.children[1]);
        const strings = document.getElementById('instrument-strings');
        const heading = document.getElementById('active-diagram-strings-heading');
        if (heading) strings.appendChild(heading);
        strings.appendChild(document.getElementById('tuning-container'));
        const referenceHelp = document.createElement('p');
        referenceHelp.className = 'instrument-control-help';
        referenceHelp.textContent = 'Piano, harp and koto reference maps ignore fret windows and capo. The piano shows two octaves from the selected key; its per-key controls follow the stored tuning slots. Fretless instruments use semitone study grids, not physical frets.';
        strings.appendChild(referenceHelp);
        document.getElementById('instrument-other-strings').appendChild(document.getElementById('additional-diagram-strings'));
        const labels = { 'diagram-count': 'Number of diagrams or preset set:', 'diagram-editor': 'Edit settings for:', 'instrument-select': 'Instrument model:', 'tuning-preset': 'Open-pitch tuning preset:', 'fretspan-presets': 'Per-string range preset:' };
        Object.entries(labels).forEach(([id, text]) => {
            const label = panel.querySelector('label[for="' + id + '"]');
            if (label) label.textContent = text;
        });
    };

}