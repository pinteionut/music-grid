import { config } from './constants.js';
let synth;
let destinationStream;
let scales = {
  classic: [
    'B3', 'C#4', 'F#4', 'G#4',
    'C#5', 'D#5', 'E5', 'G#5',
    'B5', 'C#6', 'F#6', 'G#6'
    ],
    pentatonic: [
      'C4', 'D4', 'E4', 'G4',
      'A4', 'C5', 'D5', 'E5',
      'G5', 'A5', 'C6', 'D6',
    ],
    chromatic: [
      'C5', 'C#5', 'D5', 'Eb5',
      'E5', 'F5', 'F#5', 'G5',
      'G#5','A5', 'Bb5', 'B5',
    ],
    major: [
      'C4', 'D4', 'E4', 'F4',
      'G4', 'A4', 'B4', 'C5',
      'D5', 'E5', 'F5', 'G5',
    ],
    harmonic_minor: [
      'A4', 'B4', 'C5', 'D5',
      'E5', 'F5', 'G#5', 'A5',
      'B5', 'C6', 'D6', 'E6',
    ],
};

export const initAudio = async () => {
  destinationStream  = Tone.context.createMediaStreamDestination();
  synth = new Tone.PolySynth().toDestination();
  synth.set({ oscillator: { type: 'triangle' }});
  synth.connect(destinationStream);
  synth.set({ 'detune': -1200 });
  await Tone.start();
  await Tone.context.resume();
  console.log('audio is ready');
}

export const playRow = async (row) => {
  let currentScale = scales[config.scale];
  if(!synth) {
    await initAudio();
  }
  let notesToPlay = []
  for (let i = row.length - 1; i >= 0; i--) {
    if(row[i] >= 0) {
      notesToPlay.push(currentScale[i]);
    }
  }
  synth.triggerAttackRelease(notesToPlay, '16n');
}
