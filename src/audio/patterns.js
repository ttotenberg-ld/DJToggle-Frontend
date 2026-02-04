export const PATTERNS = {
    bass: {
        option1: 'note("c3 e3 g3 b3").s("triangle").lpf(1000)',
        option2: 'note("c2 c3").s("sawtooth").lpf(500)',
        option3: 'note("c2*2").s("square").lpf(800)'
    },
    drums: {
        option1: 's("bd sd").bank("RolandTR909")',
        option2: 's("bd hh sd hh").bank("RolandTR909")',
        option3: 's("bd*2 [sd hh]*2").bank("RolandTR909")'
    },
    harmony: {
        option1: 'chord("Cm7").s("piano")',
        option2: 'chord("Cm9").s("superpiano")',
        option3: 'chord("Cm7").s("sawtooth").lpf(2000).delay(0.5)'
    },
    melody: {
        option1: 'note("g4 f4 eb4 d4").s("piano")',
        option2: 'note("c5 g4").s("sine")',
        option3: 'note("eb5 d5 c5 bb4").s("square")'
    }
};
