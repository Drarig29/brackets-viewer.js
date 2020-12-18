import { Status } from 'brackets-model';
import { isMajorRound } from './helpers';
import { FinalType, BracketType, OriginHint, RankingHeaders } from './types';

/**
 * Returns an origin hint function based on rounds information.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param skipFirstRound Whether to skip the first round.
 * @param matchLocation Location of the match.
 */
export function getOriginHint(roundNumber: number, roundCount: number, skipFirstRound: boolean, matchLocation: BracketType): OriginHint {
    if (roundNumber === 1) {
        if (matchLocation === 'single-bracket')
            return (position: number): string => `Seed ${position}`;

        if (matchLocation === 'winner-bracket')
            return (position: number): string => `Seed ${position}`;

        if (matchLocation === 'loser-bracket' && skipFirstRound)
            return (position: number): string => `Seed ${position}`;
    }

    if (isMajorRound(roundNumber) && matchLocation === 'loser-bracket') {
        if (roundNumber === roundCount - 2)
            return (position: number): string => `Loser of WB Semi ${position}`;

        if (roundNumber === roundCount)
            return (): string => 'Loser of WB Final';

        const roundNumberWB = Math.ceil((roundNumber + 1) / 2);

        if (skipFirstRound)
            return (position: number): string => `Loser of WB ${roundNumberWB - 1}.${position}`;

        return (position: number): string => `Loser of WB ${roundNumberWB}.${position}`;
    }

    return undefined;
}

/**
 * Returns the label of a match.
 *
 * @param matchNumber Number of the match.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param matchLocation Location of the match.
 */
export function getMatchLabel(matchNumber: number, roundNumber: number, roundCount: number, matchLocation: BracketType): string {
    const matchPrefix = matchLocation === 'winner-bracket' ? 'WB' :
        matchLocation === 'loser-bracket' ? 'LB' : 'M';

    const inSemiFinalRound = roundNumber === roundCount - 1;
    const inFinalRound = roundNumber === roundCount;

    if (matchLocation === 'single-bracket') {
        if (inSemiFinalRound)
            return `Semi ${matchNumber}`;

        if (inFinalRound)
            return 'Final';
    }

    if (inSemiFinalRound)
        return `${matchPrefix} Semi ${matchNumber}`;

    if (inFinalRound)
        return `${matchPrefix} Final`;

    return `${matchPrefix} ${roundNumber}.${matchNumber}`;
}

/**
 * Returns the label of a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getFinalMatchLabel(finalType: FinalType, roundNumber: number, roundCount: number): string {
    // Single elimination.
    if (finalType === 'consolation_final')
        return 'Consolation Final';

    // Double elimination.
    return getGrandFinalName(roundNumber, roundCount);
}

/**
 * Returns an origin hint function for a match in final.
 *
 * @param finalType Type of the final.
 * @param roundNumber Number of the round.
 */
export function getFinalOriginHint(finalType: FinalType, roundNumber: number): OriginHint {
    // Single elimination.
    if (finalType === 'consolation_final')
        return (position: number): string => `Loser of Semi ${position}`;

    // Double elimination.
    if (roundNumber === 1)
        return (): string => 'Winner of LB Final';

    return undefined;
}

/**
 * Returns the status of a match.
 *
 * @param status The match status.
 */
export function getMatchStatus(status: Status): string {
    switch (status) {
        case Status.Locked:
            return 'Locked';
        case Status.Waiting:
            return 'Waiting';
        case Status.Ready:
            return 'Ready';
        case Status.Running:
            return 'Running';
        case Status.Completed:
            return 'Completed';
        case Status.Archived:
            return 'Archived';
    }
}

/**
 * Returns the name of a grand final round.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of final rounds.
 */
export function getGrandFinalName(roundNumber: number, roundCount: number): string {
    if (roundCount === 1)
        return 'Grand Final';

    return `GF Round ${roundNumber}`;
}

/**
 * Returns the name of a group.
 *
 * @param groupNumber Number of the group.
 */
export function getGroupName(groupNumber: number): string {
    return `Group ${groupNumber}`;
}

/**
 * Returns the name of a round.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? 'Final Round' : `Round ${roundNumber}`;
}

/**
 * Returns the name of a round in the winner bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getWinnerBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? 'WB Final Round' : `WB Round ${roundNumber}`;
}

/**
 * Returns the name of a round in the loser bracket of a double elimination stage.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 */
export function getLoserBracketRoundName(roundNumber: number, roundCount: number): string {
    return roundNumber === roundCount ? 'LB Final Round' : `LB Round ${roundNumber}`;
}

/**
 * Abbreviations used in the viewer.
 */
export const abbreviations = {
    win: 'W',
    loss: 'L',
    forfeit: 'F',
    position: 'P',
    seed: '#',
};

/**
 * Headers of the ranking.
 */
export const headers: RankingHeaders = {
    rank: {
        text: '#',
        tooltip: 'Rank',
    },
    id: {
        text: 'Name',
        tooltip: 'Name',
    },
    played: {
        text: 'P',
        tooltip: 'Played',
    },
    wins: {
        text: abbreviations.win,
        tooltip: 'Wins',
    },
    draws: {
        text: 'D',
        tooltip: 'Draws',
    },
    losses: {
        text: abbreviations.loss,
        tooltip: 'Losses',
    },
    forfeits: {
        text: abbreviations.forfeit,
        tooltip: 'Forfeits',
    },
    scoreFor: {
        text: 'SF',
        tooltip: 'Score For',
    },
    scoreAgainst: {
        text: 'SA',
        tooltip: 'Score Against',
    },
    scoreDifference: {
        text: '+/-',
        tooltip: 'Score Difference',
    },
    points: {
        text: 'Pts',
        tooltip: 'Points',
    },
};
