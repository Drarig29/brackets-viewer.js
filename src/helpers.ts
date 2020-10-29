import { Match, ParticipantResult } from "brackets-model";
import { headers } from "./lang";
import { RankingHeader, Ranking, RankingFormula, RankingItem, RankingMap } from "./types";

/**
 * Splits an array based on values of a given key of the objects of the array.
 *
 * @param array The array to split.
 * @param key The key of T.
 */
export function splitBy<T>(array: T[], key: keyof T): T[][] {
    const obj = Object();

    for (const value of array) {
        if (!obj[value[key]])
            obj[value[key]] = [];

        obj[value[key]].push(value);
    }

    return Object.values(obj);
}

/**
 * Indicates whether a round is major.
 *
 * @param roundNumber Number of the round.
 */
export function isMajorRound(roundNumber: number): boolean {
    return roundNumber === 1 || roundNumber % 2 === 0;
}

/**
 * Returns the header for a ranking property.
 *
 * @param itemName Name of the ranking property.
 */
export function rankingHeader(itemName: keyof RankingItem): RankingHeader {
    return headers[itemName];
}

/**
 * Calculates the ranking based on a list of matches and a formula.
 *
 * @param matches The list of matches.
 * @param formula The points formula to apply.
 */
export function getRanking(matches: Match[], formula?: RankingFormula): Ranking {
    formula = formula || (
        (item: RankingItem) => 3 * item.wins + 1 * item.draws + 0 * item.losses
    );

    const rankingMap: RankingMap = {};

    for (const match of matches) {
        processParticipant(rankingMap, formula, match.opponent1, match.opponent2);
        processParticipant(rankingMap, formula, match.opponent2, match.opponent1);
    }

    return createRanking(rankingMap);
}

/**
 * Processes a participant and edits the ranking map.
 *
 * @param rankingMap The ranking map to edit.
 * @param formula The points formula to apply.
 * @param current The current participant.
 * @param other The opponent.
 */
function processParticipant(rankingMap: RankingMap, formula: RankingFormula, current: ParticipantResult | null, other: ParticipantResult | null): void {
    if (!current || current.id === null) return;

    const state = rankingMap[current.id] || {
        rank: 0,
        id: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        forfeits: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        scoreDifference: 0,
        points: 0,
    };

    state.id = current.id;
    state.played++;

    if (current.result === 'win')
        state.wins++;

    if (current.result === 'draw')
        state.draws++;

    if (current.result === 'loss')
        state.losses++;

    if (current.forfeit)
        state.forfeits++;

    state.scoreFor += current.score || 0;
    state.scoreAgainst += other && other.score || 0;
    state.scoreDifference = state.scoreFor - state.scoreAgainst;

    state.points = formula(state);

    rankingMap[current.id] = state;
}

/**
 * Creates the final ranking based on a ranking map. (Sort + Total points)
 *
 * @param rankingMap The ranking map (object).
 */
function createRanking(rankingMap: RankingMap): RankingItem[] {
    const ranking = Object.values(rankingMap).sort((a, b) => b.points - a.points);

    const rank = {
        value: 0,
        lastPoints: -1,
    };

    for (const item of ranking) {
        item.rank = rank.lastPoints !== item.points ? ++rank.value : rank.value;
        rank.lastPoints = item.points;
    }

    return ranking;
}