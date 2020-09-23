import { Match } from "brackets-model";
import { isMajorRound } from "./helpers";

export function getMatchHint(roundNumber: number, roundCount: number, inLowerBracket?: boolean): MatchHint {
    if (!inLowerBracket && roundNumber === 1)
        return (i: number) => `Seed ${i}`;

    if (inLowerBracket && isMajorRound(roundNumber)) {
        const roundNumberWB = Math.ceil((roundNumber + 1) / 2);

        let hint = (i: number) => `Loser of WB ${roundNumberWB}.${i}`;

        if (roundNumber === roundCount - 2)
            hint = (i: number) => `Loser of WB Semi ${i}`;

        if (roundNumber === roundCount)
            hint = () => 'Loser of WB Final';

        return hint;
    }

    return undefined;
}

export function getMatchLabel(match: Match, roundNumber: number, roundCount: number, inLowerBracket?: boolean) {
    let matchPrefix = 'M';

    if (inLowerBracket)
        matchPrefix = 'LB';
    else if (inLowerBracket === false)
        matchPrefix = 'WB';

    const semiFinalRound = roundNumber === roundCount - 1;
    const finalRound = roundNumber === roundCount;

    let matchLabel = `${matchPrefix} ${roundNumber}.${match.number}`;

    if (!inLowerBracket && semiFinalRound)
        matchLabel = `Semi ${match.number}`;

    if (finalRound)
        matchLabel = 'Final';

    return matchLabel;
}

export function getFinalMatchLabel(type: string, grandFinalName: (i: number) => string, i: number) {
    return type === 'consolation_final' ? 'Consolation Final' : grandFinalName(i);
}

export function getFinalMatchHint(type: string, i: number): MatchHint {
    if (type === 'consolation_final')
        return number => `Loser of Semi ${number}`;

    if (i === 0)
        return () => 'Winner of LB Final';

    return undefined;
}

export function getGrandFinalName(matches: Match[]) {
    return matches.length === 1 ? () => 'Grand Final' : (i: number) => `GF Round ${i + 1}`;
}

export function getGroupName(groupNumber: number) {
    return `Round ${groupNumber}`;
}

export function getRoundName(roundNumber: number) {
    return `Round ${roundNumber}`;
}

export function getWinnerBracketRoundName(roundNumber: number) {
    return `WB Round ${roundNumber}`;
}

export function getLoserBracketRoundName(roundNumber: number) {
    return `LB Round ${roundNumber}`;
}