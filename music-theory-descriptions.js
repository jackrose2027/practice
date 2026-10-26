/**
 * Music Theory Descriptions Extension
 * Contains textual descriptions for scales, chords, and intervals.
 */

MusicTheory.prototype.getScaleDescription = function(scaleId) {
    const descriptions = {
        // Basic & Modes
        'major': 'The Ionian mode or Major scale is the foundation of Western music, known for its stable, bright, and happy character.',
        'natural_minor': 'The Aeolian mode or Natural Minor scale provides a melancholic, soulful sound used extensively in classical, pop, and rock.',
        'harmonic_minor': 'Characterized by its "exotic" augmented second interval (b6 to 7), this scale is vital in neoclassical metal and Middle Eastern music.',
        'melodic_minor': 'The "Jazz Minor" scale. It offers a sophisticated sound, resolving the awkward leap of the harmonic minor while maintaining melodic tension.',
        'dorian': 'A minor-type scale with a raised 6th, giving it a sophisticated, "cool" jazz or folk vibe. Think "Oye Como Va" or "So What".',
        'phrygian': 'A dark, tense minor scale with a flat 2nd. It is a staple of Flamenco, heavy metal, and ancient modal music.',
        'lydian': 'The brightest mode, featuring a raised 4th. It creates a dreamy, cinematic, and slightly mystical atmosphere common in film scores.',
        'mixolydian': 'The "Bluesy" major scale with a flat 7th. It is the core sound of classic rock, funk, and dominant chord improvisation.',
        'locrian': 'The most dissonant mode, built on a diminished triad. It sounds unstable and "dark", often used in experimental jazz and heavy metal.',
        
        // Pentatonics & Blues
        'pentatonic_major': 'A five-note scale that is virtually impossible to play a wrong note with. Found in folk music across almost every culture.',
        'pentatonic_minor': 'The most popular scale for guitarists. It is the backbone of blues, rock, and metal soloing.',
        'blues': 'A minor pentatonic scale with an added "Blue Note" (b5), creating the quintessential tension and release of the blues.',
        'major_blues': 'A major pentatonic with an added b3, providing a sweet country and early rock-and-roll flavor.',
        
        // Melodic Minor Modes
        'altered': 'The "Super Locrian" scale, containing every possible alteration (b9, #9, b5, #5). It is used over dominant chords to create maximum tension.',
        'super_locrian': 'Identical to the Altered Scale, this mode is the 7th mode of the Melodic Minor scale, commonly used to solo over dominant 7th chords.',
        'lydian_dominant': 'A major scale with a #4 and b7. It provides a unique "overtone" sound, often used on IV7 chords or back-door dominants.',
        'lydian_augmented': 'The 3rd mode of melodic minor. A very "out" sound with a #4 and #5, creating an ethereal and highly augmented quality.',
        'mixolydian_flat_6': 'The 5th mode of melodic minor. Often used in jazz over "dominant minor" situations or V7 chords resolving to minor.',
        'locrian_sharp_2': 'A more stable version of Locrian used commonly in jazz to play over minor 7b5 chords.',
        
        // Symmetric & Artificial
        'whole_tone': 'A hexatonic scale where every interval is a whole step. It creates an ambiguous, floating, "dream-like" effect (think Debussy).',
        'diminished': 'An octatonic scale alternating whole and half steps. It is symmetrical and creates a highly tense, driving sound used in jazz and metal.',
        'augmented': 'A symmetric scale alternating minor thirds and half steps, creating a series of overlapping augmented triads.',
        'chromatic': 'Consists of all twelve pitches. It represents the total harmonic palette and is used for passing tones or atonal exploration.',
        
        // Exotic & World
        'double_harmonic': 'The "Byzantine" or "Flamenco" scale. Its two augmented seconds create a deeply evocative, Middle Eastern atmosphere.',
        'hungarian_minor': 'A harmonic minor scale with a raised 4th. It has a double-augmented second structure, popular in Romani music.',
        'hungarian_major': 'A bright, exotic scale with a #2 and #4. It produces a very strong leading-tone feel and unique harmonic possibilities.',
        'neapolitan_major': 'A major-type scale starting with a flat second, creating a distinct "Phrygian-Major" hybrid feel.',
        'neapolitan_minor': 'A minor-type scale with a flat second degree, blending the darkness of Phrygian with the tension of Harmonic Minor.',
        'persian': 'A highly exotic scale using intervals that suggest ancient Middle Eastern melodies and complex harmonic textures.',
        'arabian': 'A scale often used to evoke Middle Eastern or "Oriental" atmospheres, featuring a distinctive diminished fifth.',
        'japanese': 'A traditional Japanese pentatonic scale often found in traditional folk music and evoking a sense of space and tranquility.',
        'hirajoshi': 'A Japanese pentatonic scale commonly used for koto music, providing a hauntingly beautiful and distinct Eastern tonality.',
        'in_sen': 'A traditional Japanese scale often used in Shamisen music, characterized by its wide intervals and missing thirds.',
        'insen': 'A variant of the traditional Japanese In Sen scale, commonly used for its distinct "Eastern" minor quality.',
        'iwato': 'A Japanese pentatonic scale derived from the Koto tradition, featuring a very dark, minor-key character.',
        'yo': 'A bright Japanese pentatonic scale commonly associated with folk music and celebratory melodies.',
        'pelog': 'An Indonesian scale used in Gamelan music. It possesses a unique, slightly dissonant yet melodic quality.',
        'balinese': 'A specific five-note subset used in Balinese Gamelan, known for its shimmering and evocative cultural sound.',
        'romanian_minor': 'Also known as the Ukrainian Dorian, this scale features a #4, blending minor tonality with Lydian brightness.',
        'ukranian_dorian': 'A minor scale with a sharp 4th. Common in Klezmer and Eastern European folk music.',
        'gypsy': 'A scale that utilizes two augmented seconds to create a soulful, wandering, and deeply expressive melodic character.',
        'byzantine': 'Another name for the Double Harmonic Major scale, famously used to create an ancient Mediterranean or Middle Eastern sound.',
        
        // Bebop
        'bebop_dominant': 'A Mixolydian scale with an added major 7th as a passing tone, allowing chord tones to fall on the downbeats in jazz.',
        'bebop_major': 'A Major scale with an added #5, designed for smooth scalar runs in swing and bebop jazz.',
        'bebop_minor': 'A scale designed to allow jazz soloists to play long, fluid lines over minor chords without losing harmonic alignment.',
        'bebop_dorian': 'A Dorian scale with an added major 3rd, used extensively in the bebop era for soloing over minor 7th chords.',
        
        // Messiaen Modes
        'messiaen_mode_1': 'Olivier Messiaen\'s first mode of limited transposition, identical to the Whole Tone scale.',
        'messiaen_mode_2': 'The second Messiaen mode, identical to the Octatonic or Diminished scale (alternating half and whole steps).',
        'messiaen_mode_3': 'A nine-note scale created by Messiaen, featuring a repeating structure of (whole, half, half) steps.',
        'messiaen_mode_4': 'A rare Messiaen mode consisting of eight notes with a complex, symmetrical interval structure.',
        'messiaen_mode_5': 'Messiaen\'s fifth mode, a hexatonic scale with a unique, highly specialized harmonic color.',
        'messiaen_mode_6': 'An eight-note Messiaen mode that provides a dense, sophisticated harmonic palette.',
        'messiaen_mode_7': 'The most complex of Messiaen\'s modes, utilizing ten different notes to create a total harmonic environment.',
        
        // Misc & Specific
        'enigmatic': 'A strange, artificial scale famously used by Verdi and Joe Satriani, featuring a mix of unconventional intervals.',
        'prometheus': 'Named after Alexander Scriabin\'s mystic chord, this scale creates a highly specialized, modernistic harmonic color.',
        'prometheus_neapolitan': 'A hybrid of the Prometheus scale and the Neapolitan flavor, creating a highly altered, dark harmonic space.',
        'half_diminished': 'A scale designed specifically to outline the minor 7th flat 5 chord, essential for ii-V-I progressions in minor keys.',
        'algerian': 'A North African scale that changes its structure as it ascends and descends, represented here in its primary form.',
        'chinese': 'A pentatonic scale reflecting the traditional harmonic structures found in historical Chinese music.',
        'hindu': 'A variant of the Mixolydian scale with a flat 6th, common in Indian classical music contexts.',
        'raga_bhairav': 'An Indian Raga scale characterized by its flat 2nd and flat 6th, evoking the early morning hours.',
        'eight_tone_spanish': 'A scale used in Flamenco music to provide a rich, dark, and highly decorative melodic palette.',
        'mela_todi': 'One of the fundamental parent scales in South Indian Carnatic music, known for its intense emotional depth.',
        'kumoi': 'A Japanese pentatonic scale commonly used for its distinctive melodic character in traditional string music.'
    };
    return descriptions[scaleId] || 'A unique collection of notes forming a specific musical character, used to build melodies and harmonies.';
};

MusicTheory.prototype.getChordDescription = function(chordId) {
    const descriptions = {
        'major': 'The major triad has a bright, happy sound.',
        'minor': 'The minor triad has a darker, more melancholic sound.',
        'diminished': 'The diminished triad has a tense, unstable sound.',
        'augmented': 'The augmented triad has an unresolved, mysterious sound.',
        'major7': 'The major 7th chord has a rich, jazzy sound.',
        'dominant7': 'The dominant 7th chord creates tension that resolves to the tonic.',
        'minor7': 'The minor 7th chord has a mellow, warm sound.',
        'diminished7': 'The diminished 7th chord has an extremely tense sound.',
        'half_diminished': 'The half diminished chord (min7b5) has a jazzy, tense sound.',
        'sus2': 'The sus2 chord replaces the 3rd with a 2nd, creating an open sound.',
        'sus4': 'The sus4 chord replaces the 3rd with a 4th, creating a suspended sound.',
        'add9': 'The add9 chord adds a 9th (2nd octave up) without the 7th.',
        '6': 'The 6 chord adds a major 6th to a major triad.',
        'm6': 'The minor 6 chord adds a major 6th to a minor triad.'
    };
    return descriptions[chordId] || 'A combination of three or more notes played simultaneously.';
};

MusicTheory.prototype.getIntervalQuality = function(intervalId) {
    const qualities = {
        '1': 'Perfect, identical pitch',
        'b2': 'Highly dissonant, tense',
        '2': 'Dissonant, bright tension',
        'b3': 'Minor, somewhat dark',
        '3': 'Major, bright and consonant',
        '4': 'Perfect, stable and open',
        'b5': 'Dissonant, unstable (tritone)',
        '5': 'Perfect, extremely stable',
        '#5': 'Augmented, exotic and unstable',
        '6': 'Major, consonant and sweet',
        'b7': 'Minor, bluesy tension',
        '7': 'Major, strong leading tone tension'
    };
    return qualities[intervalId] || 'Unknown';
};

MusicTheory.prototype.getIntervalConsonance = function(intervalId) {
    const consonance = {
        '1': 'Perfect consonance',
        'b2': 'Sharp dissonance',
        '2': 'Mild dissonance',
        'b3': 'Imperfect consonance',
        '3': 'Imperfect consonance',
        '4': 'Perfect consonance (context dependent)',
        'b5': 'Strong dissonance (tritone)',
        '5': 'Perfect consonance',
        '#5': 'Mild dissonance',
        '6': 'Imperfect consonance',
        'b7': 'Mild dissonance',
        '7': 'Sharp dissonance'
    };
    return consonance[intervalId] || 'Unknown';
};