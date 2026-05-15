import { parseReplayLog } from './parse-replay-log';

describe('parseReplayLog', () => {
  it('extracts p1 and p2 teams from switch events in order', () => {
    const log = [
      '|switch|p1a: Garchomp|Garchomp, L100, M|100/100',
      '|switch|p2a: Gyarados|Gyarados, L100, F|100/100',
      '|switch|p1a: Infernape|Infernape, L100, M|100/100',
      '|switch|p2a: Starmie|Starmie, L100|100/100',
    ].join('\n');

    const result = parseReplayLog(log);
    expect(result.p1).toEqual(['Garchomp', 'Infernape']);
    expect(result.p2).toEqual(['Gyarados', 'Starmie']);
  });

  it('handles drag events the same as switch', () => {
    const log = [
      '|drag|p1a: Hippowdon|Hippowdon, L100, M|100/100',
      '|drag|p2a: Skarmory|Skarmory, L100, F|100/100',
    ].join('\n');

    const result = parseReplayLog(log);
    expect(result.p1).toEqual(['Hippowdon']);
    expect(result.p2).toEqual(['Skarmory']);
  });

  it('deduplicates species that appear multiple times', () => {
    const log = [
      '|switch|p1a: Garchomp|Garchomp, L100, M|100/100',
      '|switch|p1a: Infernape|Infernape, L100, M|80/100',
      '|switch|p1a: Garchomp|Garchomp, L100, M|60/100',
    ].join('\n');

    const result = parseReplayLog(log);
    expect(result.p1).toEqual(['Garchomp', 'Infernape']);
  });

  it('strips species suffix after comma', () => {
    const log = '|switch|p1a: Togekiss|Togekiss, L100, F|100/100\n';

    const result = parseReplayLog(log);
    expect(result.p1).toEqual(['Togekiss']);
  });

  it('ignores unrelated log lines', () => {
    const log = [
      '|move|p1a: Garchomp|Earthquake|p2a: Gyarados',
      '|turn|2',
      '|-damage|p2a: Gyarados|50/100',
      '|switch|p1a: Infernape|Infernape, L100|100/100',
    ].join('\n');

    const result = parseReplayLog(log);
    expect(result.p1).toEqual(['Infernape']);
    expect(result.p2).toEqual([]);
  });

  it('returns empty arrays for empty log', () => {
    const result = parseReplayLog('');
    expect(result.p1).toEqual([]);
    expect(result.p2).toEqual([]);
  });
});
